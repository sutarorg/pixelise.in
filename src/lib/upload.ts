import { uploadConstraints, isAcceptedMimeType } from "@/config/studio";
import { formatBytes } from "@/lib/format";

export type FileValidation =
  | { ok: true; width: number; height: number }
  | { ok: false; message: string };

/**
 * Client-side pre-flight for a product photo.
 *
 * The same rules are enforced again by the service when it signs the upload
 * URL, and by object storage when the bytes arrive. This check exists so the
 * customer gets an answer immediately, in their own words, before anything is
 * uploaded.
 */
export async function validateImageFile(file: File): Promise<FileValidation> {
  if (!isAcceptedMimeType(file.type)) {
    return {
      ok: false,
      message: `${file.type || "That file"} isn't a supported image. ${uploadConstraints.acceptedLabel}.`,
    };
  }

  if (file.size > uploadConstraints.maxBytes) {
    return {
      ok: false,
      message: `That photo is ${formatBytes(file.size)}. The limit is ${formatBytes(
        uploadConstraints.maxBytes,
      )} — try a smaller export.`,
    };
  }

  if (file.size === 0) {
    return { ok: false, message: "That file is empty. Choose a different photo." };
  }

  const dimensions = await readDimensions(file);
  if (!dimensions) {
    return {
      ok: false,
      message: "We couldn't read that image. Try exporting it again as a JPG, PNG or WebP.",
    };
  }

  if (
    dimensions.width < uploadConstraints.minDimension ||
    dimensions.height < uploadConstraints.minDimension
  ) {
    return {
      ok: false,
      message: `That photo is ${dimensions.width}×${dimensions.height}px. Use at least ${uploadConstraints.minDimension}px on the short edge so the studio has detail to work with.`,
    };
  }

  return { ok: true, width: dimensions.width, height: dimensions.height };
}

function readDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    image.src = url;
  });
}
