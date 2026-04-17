export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Extracts a perceptually-saturated color from an image URL by sampling a 32x32
 * downsampled bitmap and scoring pixels by saturation × mid-luminance.
 *
 * Returns null if the image fails to load or the canvas becomes tainted (CORS).
 */
export async function extractDominantColor(url: string): Promise<RGB | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';

    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        let bestR = 0;
        let bestG = 0;
        let bestB = 0;
        let bestScore = -1;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] ?? 0;
          const g = data[i + 1] ?? 0;
          const b = data[i + 2] ?? 0;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          const lum = (r + g + b) / 3;
          // Prefer saturated, mid-bright pixels over muddy darks/blown highlights.
          const lumScore = 1 - Math.abs(lum - 140) / 140;
          const score = sat * Math.max(0, lumScore);
          if (score > bestScore) {
            bestScore = score;
            bestR = r;
            bestG = g;
            bestB = b;
          }
        }

        // If nothing scored (pure greyscale), fall back to average.
        if (bestScore <= 0) {
          let sumR = 0;
          let sumG = 0;
          let sumB = 0;
          let n = 0;
          for (let i = 0; i < data.length; i += 4) {
            sumR += data[i] ?? 0;
            sumG += data[i + 1] ?? 0;
            sumB += data[i + 2] ?? 0;
            n += 1;
          }
          bestR = Math.round(sumR / n);
          bestG = Math.round(sumG / n);
          bestB = Math.round(sumB / n);
        }

        resolve({ r: bestR, g: bestG, b: bestB });
      } catch {
        // CORS-tainted canvas, etc.
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = url;
  });
}
