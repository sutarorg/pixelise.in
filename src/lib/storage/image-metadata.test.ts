import { describe, expect, it } from "vitest";

import { extensionFor, sniffImage } from "@/lib/storage/image-metadata";

/** Builds a minimal PNG header: signature + IHDR up to the dimensions. */
function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(33);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13); // IHDR length
  bytes.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

/** Builds a baseline JPEG header with a single SOF0 segment. */
function jpegHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array([
    0xff, 0xd8, // SOI
    0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, // APP0 (length 4)
    0xff, 0xc0, 0x00, 0x11, 0x08, // SOF0, length 17, precision 8
    (height >> 8) & 0xff, height & 0xff,
    (width >> 8) & 0xff, width & 0xff,
    0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
  ]);
  return bytes;
}

describe("image sniffing", () => {
  it("reads PNG dimensions from the IHDR chunk", () => {
    expect(sniffImage(pngHeader(1024, 768))).toEqual({
      mimeType: "image/png",
      width: 1024,
      height: 768,
    });
  });

  it("reads JPEG dimensions from the SOF marker", () => {
    expect(sniffImage(jpegHeader(1200, 1600))).toEqual({
      mimeType: "image/jpeg",
      width: 1200,
      height: 1600,
    });
  });

  it("refuses bytes that are not one of the three accepted formats", () => {
    const html = new TextEncoder().encode("<svg onload=alert(1)></svg>");
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    expect(sniffImage(html)).toBeNull();
    expect(sniffImage(zip)).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });

  it("does not trust a PNG signature without a valid header", () => {
    const truncated = pngHeader(10, 10).slice(0, 12);
    expect(sniffImage(truncated)).toBeNull();
  });

  it("derives the extension from the sniffed type, not a filename", () => {
    expect(extensionFor("image/png")).toBe("png");
    expect(extensionFor("image/webp")).toBe("webp");
    expect(extensionFor("image/jpeg")).toBe("jpg");
    expect(extensionFor("application/pdf")).toBe("jpg"); // never reached: type is validated first
  });
});
