import JSZip from "jszip";

export interface ParsedEpubMetadata {
  title: string;
  author: string;
  description?: string;
  coverDataUrl?: string;
  totalEstimatedPages: number;
}

/**
 * Extract metadata and cover image directly from an EPUB file Blob
 * Runs 100% offline in browser client
 */
export async function parseEpubFile(file: File | Blob): Promise<ParsedEpubMetadata> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Locate container.xml to find the OPF package path
  const containerFile = zip.file("META-INF/container.xml");
  let opfPath = "content.opf";

  if (containerFile) {
    const containerXml = await containerFile.async("text");
    const match = containerXml.match(/full-path=["']([^"']+)["']/i);
    if (match && match[1]) {
      opfPath = match[1];
    }
  }

  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error("Invalid EPUB: package OPF file not found");
  }

  const opfXml = await opfFile.async("text");
  const opfDir = opfPath.includes("/") ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1) : "";

  // 2. Extract Title and Creator (Author)
  const titleMatch = opfXml.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
  const title = titleMatch ? titleMatch[1].trim() : (file instanceof File ? file.name.replace(/\.epub$/i, "") : "Buku Tanpa Judul");

  const creatorMatch = opfXml.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
  const author = creatorMatch ? creatorMatch[1].trim() : "Penulis Tidak Diketahui";

  const descMatch = opfXml.match(/<dc:description[^>]*>([^<]+)<\/dc:description>/i);
  const description = descMatch ? descMatch[1].trim() : undefined;

  // 3. Extract Cover Image if available
  let coverDataUrl: string | undefined = undefined;

  // Look for cover meta tag: <meta name="cover" content="cover-image-id"/>
  const coverMetaMatch = opfXml.match(/<meta\s+name=["']cover["']\s+content=["']([^"']+)["']/i) ||
                         opfXml.match(/<meta\s+content=["']([^"']+)["']\s+name=["']cover["']/i);
  let coverHref: string | null = null;

  if (coverMetaMatch && coverMetaMatch[1]) {
    const coverId = coverMetaMatch[1];
    const itemMatch = opfXml.match(new RegExp(`<item[^>]*id=["']${coverId}["'][^>]*href=["']([^"']+)["']`, "i")) ||
                      opfXml.match(new RegExp(`<item[^>]*href=["']([^"']+)["'][^>]*id=["']${coverId}["']`, "i"));
    if (itemMatch && itemMatch[1]) {
      coverHref = itemMatch[1];
    }
  }

  // Fallback: look for item with properties="cover-image" or containing "cover" in href
  if (!coverHref) {
    const propertyMatch = opfXml.match(/<item[^>]*properties=["'][^"']*cover-image[^"']*["'][^>]*href=["']([^"']+)["']/i);
    if (propertyMatch && propertyMatch[1]) {
      coverHref = propertyMatch[1];
    }
  }

  if (coverHref) {
    const cleanCoverPath = opfDir + coverHref.replace(/^\//, "");
    const coverImageFile = zip.file(cleanCoverPath);
    if (coverImageFile) {
      const coverBlob = await coverImageFile.async("blob");
      coverDataUrl = await blobToDataUrl(coverBlob);
    }
  }

  // 4. Estimate Virtual Pages based on uncompressed text content size
  // Standard benchmark: ~1,600 characters per page in a paperback/light novel
  let totalCharacters = 0;
  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (filename.endsWith(".xhtml") || filename.endsWith(".html") || filename.endsWith(".htm")) {
      const htmlText = await zipEntry.async("text");
      // Strip HTML tags for rough character count
      const cleanText = htmlText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      totalCharacters += cleanText.length;
    }
  }

  const totalEstimatedPages = Math.max(10, Math.round(totalCharacters / 1600));

  return {
    title,
    author,
    description,
    coverDataUrl,
    totalEstimatedPages,
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
