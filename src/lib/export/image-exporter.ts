import { toPng } from "html-to-image";

/**
 * Export a DOM element as PNG blob.
 * Handles font loading and CORS for external images.
 */
export async function exportAsPng(element: HTMLElement): Promise<Blob> {
  // Wait for fonts to load
  await document.fonts.ready;

  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 2,
    cacheBust: true,
    skipAutoScale: true,
    style: {
      transform: "scale(1)",
      transformOrigin: "top left",
    },
  });

  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Trigger download of a blob as file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Share blob via Web Share API if available, fallback to download.
 */
export async function shareOrDownload(
  blob: Blob,
  filename: string,
  title: string
): Promise<"shared" | "downloaded"> {
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        files: [file],
      });
      return "shared";
    }
  }

  downloadBlob(blob, filename);
  return "downloaded";
}
