/**
 * Utility to compress and resize an image (base64 or File) to prevent exceeding
 * localStorage / database size quotas.
 */

export function compressImage(
  base64Str: string,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    // If it's already empty or extremely small, return as is
    if (!base64Str || base64Str.length < 200) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate perfect scale constraints
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // "image/jpeg" leads to much higher compression rates than png
        const compressed = canvas.toDataURL("image/jpeg", quality);
        
        // If for some reason the output is larger (rare), fallback to original
        if (compressed.length < base64Str.length) {
          resolve(compressed);
        } else {
          resolve(base64Str);
        }
      } catch (e) {
        console.warn("Canvas compression failed, falling back to original:", e);
        resolve(base64Str);
      }
    };

    img.onerror = () => {
      resolve(base64Str);
    };
  });
}
