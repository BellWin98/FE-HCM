const MAX_WIDTH = 1440;
const JPEG_QUALITY = 0.85;

export const fitToMaxWidth = (
  width: number,
  height: number,
  maxWidth: number = MAX_WIDTH,
): { width: number; height: number } => {
  if (width <= maxWidth) return { width, height };
  const ratio = maxWidth / width;
  return { width: maxWidth, height: Math.round(height * ratio) };
};

/** JPEG 는 투명을 못 담아 검게 나오므로 먼저 흰 바탕을 깐다. */
const fillWhite = (
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  width: number,
  height: number,
): void => {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
};

const encodeJpeg = async (bitmap: ImageBitmap, width: number, height: number): Promise<Blob | null> => {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    fillWhite(ctx, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  fillWhite(ctx, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
};

/** 업로드 전에 기기에서 이미지를 줄인다. GIF이거나 실패하거나 더 커지면 원본을 그대로 돌려준다. */
export const compressImage = async (file: File): Promise<File> => {
  if (file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const { width, height } = fitToMaxWidth(bitmap.width, bitmap.height);
      const blob = await encodeJpeg(bitmap, width, height);
      if (!blob || blob.size >= file.size) return file;
      const baseName = file.name.replace(/\.[^./\\]+$/, '');
      return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
    } finally {
      bitmap.close?.();
    }
  } catch {
    return file;
  }
};
