import { describe, it } from "node:test";
import assert from "node:assert";
import JSZip from "jszip";
import { parseEpubFile } from "../src/lib/reader/epub-parser.js";

describe("EPUB Parser & Ingestion Pipeline", () => {
  it("should parse metadata, title, author and estimate pages from an in-memory EPUB", async () => {
    const zip = new JSZip();

    // 1. Add mimetype
    zip.file("mimetype", "application/epub+zip");

    // 2. Add container.xml
    zip.file(
      "META-INF/container.xml",
      `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
    );

    // 3. Add content.opf
    zip.file(
      "OEBPS/content.opf",
      `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Buying My Classmate Once a Week Vol 2</dc:title>
    <dc:creator>Fei</dc:creator>
    <dc:description>Kisah novel ringan tentang Miyagi dan Sendai.</dc:description>
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
  </spine>
</package>`
    );

    // 4. Add chapter with ~3200 characters (2 pages estimate)
    const sampleText = "Miyagi bersandar di tangga sekolah menatap senja. ".repeat(64);
    zip.file(
      "OEBPS/chapter1.xhtml",
      `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>Bab 1</title></head>
  <body>
    <h1>Bab 1</h1>
    <p>${sampleText}</p>
  </body>
</html>`
    );

    const blob = await zip.generateAsync({ type: "blob" });
    const metadata = await parseEpubFile(blob);

    assert.strictEqual(metadata.title, "Buying My Classmate Once a Week Vol 2");
    assert.strictEqual(metadata.author, "Fei");
    assert.strictEqual(metadata.description, "Kisah novel ringan tentang Miyagi dan Sendai.");
    assert.ok(metadata.totalEstimatedPages >= 2, "Estimated pages should be at least 2");
  });
});
