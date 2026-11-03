export interface EnhancementOptions {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  autoEnhance: boolean;
  sharpen: boolean;
}

export const DEFAULT_ENHANCEMENT_OPTIONS: EnhancementOptions = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  autoEnhance: true,
  sharpen: true,
};

export type AspectRatioType = '4:3' | '1:1' | '16:9' | 'free';

/**
 * Applies pixel-level auto-enhancements, brightness, contrast,
 * saturation, and sharpening directly to ImageData via Canvas API.
 */
export function processImageData(
  imageData: ImageData,
  options: EnhancementOptions
): ImageData {
  const data = imageData.data;
  const len = data.length;

  let brightness = options.brightness;
  let contrast = options.contrast;
  let saturation = options.saturation;

  // Auto-enhancement calculations
  if (options.autoEnhance) {
    // 1. Analyze histogram to detect under-exposed or flat images (common in campus photos)
    let minLum = 255;
    let maxLum = 0;
    let totalLum = 0;
    const step = 4 * 8; // sample every 8th pixel for speed

    for (let i = 0; i < len; i += step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
      totalLum += lum;
    }

    const avgLum = totalLum / (len / step);

    // If dark photo (e.g. under a library desk or night campus), lift shadows
    if (avgLum < 110) {
      brightness += 15;
    }
    // If washed out or flat contrast, boost contrast
    if (maxLum - minLum < 180) {
      contrast += 18;
    }
    // Boost vibrancy slightly for color recognition
    saturation += 14;
  }

  // Pre-calculate contrast factor
  const contrastFactor =
    contrast === 0
      ? 1
      : (259 * (contrast + 255)) / (255 * (259 - contrast));

  // Pre-calculate saturation multiplier
  const satMultiplier = (saturation + 100) / 100;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    if (brightness !== 0) {
      r += brightness * 1.5;
      g += brightness * 1.5;
      b += brightness * 1.5;
    }

    // Contrast
    if (contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Saturation
    if (saturation !== 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + satMultiplier * (r - gray);
      g = gray + satMultiplier * (g - gray);
      b = gray + satMultiplier * (b - gray);
    }

    // Clamp values 0-255
    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }

  // Sharpen pass (highlights text, serial numbers, serial tags, and logos)
  if (options.sharpen) {
    return applySharpenKernel(imageData);
  }

  return imageData;
}

/**
 * Applies a 3x3 unsharp convolution kernel to enhance text, edges, and serial numbers
 */
function applySharpenKernel(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;

  // Create clean copy for destination
  const output = new ImageData(
    new Uint8ClampedArray(src),
    width,
    height
  );
  const dst = output.data;

  // Lightweight 3x3 sharpen kernel:
  // [ 0, -0.3, 0 ]
  // [-0.3, 2.2, -0.3 ]
  // [ 0, -0.3, 0 ]
  const kWeight = 2.2;
  const kEdge = -0.3;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const topIdx = ((y - 1) * width + x) * 4;
      const btmIdx = ((y + 1) * width + x) * 4;
      const leftIdx = (y * width + (x - 1)) * 4;
      const rightIdx = (y * width + (x + 1)) * 4;

      for (let c = 0; c < 3; c++) {
        const val =
          kWeight * src[idx + c] +
          kEdge * (src[topIdx + c] + src[btmIdx + c] + src[leftIdx + c] + src[rightIdx + c]);

        dst[idx + c] = val < 0 ? 0 : val > 255 ? 255 : val;
      }
    }
  }

  return output;
}

/**
 * Crops, scales, rotates, and enhances an image onto an HTML5 Canvas,
 * returning a normalized high-quality JPEG Data URL.
 */
export async function cropAndEnhanceImage(
  imageSource: HTMLImageElement,
  cropArea: { x: number; y: number; width: number; height: number },
  rotation: number, // 0, 90, 180, 270
  options: EnhancementOptions,
  targetWidth: number = 800,
  targetHeight: number = 600
): Promise<string> {
  // Offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // Smooth scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill with clean background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  ctx.save();
  ctx.translate(targetWidth / 2, targetHeight / 2);
  ctx.rotate((rotation * Math.PI) / 180);

  // Calculate destination draw dimensions depending on rotation
  const isRotated90or270 = rotation % 180 !== 0;
  const destW = isRotated90or270 ? targetHeight : targetWidth;
  const destH = isRotated90or270 ? targetWidth : targetHeight;

  ctx.drawImage(
    imageSource,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    -destW / 2,
    -destH / 2,
    destW,
    destH
  );
  ctx.restore();

  // Apply auto-enhancement, brightness, contrast, saturation & sharpen
  const rawImageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const enhancedImageData = processImageData(rawImageData, options);
  ctx.putImageData(enhancedImageData, 0, 0);

  // Return standard 85% JPEG Data URL
  return canvas.toDataURL('image/jpeg', 0.85);
}
