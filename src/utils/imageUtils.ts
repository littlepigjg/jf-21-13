export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function imageDataToDataURL(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export function dataURLToImageData(dataUrl: string, width: number, height: number): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(ctx.getImageData(0, 0, width, height));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export function cloneImageData(imageData: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

export function resizeImageData(imageData: ImageData, newWidth: number, newHeight: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageData;
  ctx.putImageData(imageData, 0, 0);

  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = newWidth;
  resizedCanvas.height = newHeight;
  const resizedCtx = resizedCanvas.getContext('2d');
  if (!resizedCtx) return imageData;
  resizedCtx.imageSmoothingEnabled = true;
  resizedCtx.imageSmoothingQuality = 'high';
  resizedCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
  return resizedCtx.getImageData(0, 0, newWidth, newHeight);
}

export function cropImageData(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageData;
  ctx.putImageData(imageData, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = width;
  croppedCanvas.height = height;
  const croppedCtx = croppedCanvas.getContext('2d');
  if (!croppedCtx) return imageData;
  croppedCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
  return croppedCtx.getImageData(0, 0, width, height);
}

export function applyBrightness(imageData: ImageData, value: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  const factor = value / 100;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + 255 * factor));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + 255 * factor));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + 255 * factor));
  }
  return result;
}

export function applyContrast(imageData: ImageData, value: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  const factor = (259 * (value + 255)) / (255 * (259 - value));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
  }
  return result;
}

export function applyGrayscale(imageData: ImageData, value: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  const intensity = value / 100;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i] + (gray - data[i]) * intensity;
    data[i + 1] = data[i + 1] + (gray - data[i + 1]) * intensity;
    data[i + 2] = data[i + 2] + (gray - data[i + 2]) * intensity;
  }
  return result;
}

export function applySepia(imageData: ImageData, value: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  const intensity = value / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const sepiaR = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
    const sepiaG = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
    const sepiaB = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
    data[i] = r + (sepiaR - r) * intensity;
    data[i + 1] = g + (sepiaG - g) * intensity;
    data[i + 2] = b + (sepiaB - b) * intensity;
  }
  return result;
}

export function applyInvert(imageData: ImageData, value: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  const intensity = value / 100;

  for (let i = 0; i < data.length; i += 4) {
    const invR = 255 - data[i];
    const invG = 255 - data[i + 1];
    const invB = 255 - data[i + 2];
    data[i] = data[i] + (invR - data[i]) * intensity;
    data[i + 1] = data[i + 1] + (invG - data[i + 1]) * intensity;
    data[i + 2] = data[i + 2] + (invB - data[i + 2]) * intensity;
  }
  return result;
}

export function applyBlur(imageData: ImageData, radius: number): ImageData {
  if (radius <= 0) return cloneImageData(imageData);

  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return cloneImageData(imageData);
  ctx.putImageData(imageData, 0, 0);

  const blurredCanvas = document.createElement('canvas');
  blurredCanvas.width = imageData.width;
  blurredCanvas.height = imageData.height;
  const blurredCtx = blurredCanvas.getContext('2d');
  if (!blurredCtx) return cloneImageData(imageData);
  blurredCtx.filter = `blur(${radius}px)`;
  blurredCtx.drawImage(canvas, 0, 0);
  return blurredCtx.getImageData(0, 0, blurredCanvas.width, blurredCanvas.height);
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function imageElementToImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function createBlankImageData(width: number, height: number): ImageData {
  return new ImageData(width, height);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
