import type { Frame, Caption, CropConfig, EditOperation } from '@/types';
import {
  cloneImageData,
  cropImageData,
  resizeImageData,
  applyBrightness,
  applyContrast,
  applyGrayscale,
  applySepia,
  applyInvert,
  applyBlur,
} from './imageUtils';

export function applyEditOperation(imageData: ImageData, operation: EditOperation): ImageData {
  if (!operation.enabled) return imageData;

  switch (operation.type) {
    case 'crop': {
      const params = operation.params as { x: number; y: number; width: number; height: number };
      return cropImageData(imageData, params.x, params.y, params.width, params.height);
    }
    case 'resize': {
      const params = operation.params as { width: number; height: number };
      return resizeImageData(imageData, params.width, params.height);
    }
    case 'brightness': {
      const params = operation.params as { value: number };
      return applyBrightness(imageData, params.value);
    }
    case 'contrast': {
      const params = operation.params as { value: number };
      return applyContrast(imageData, params.value);
    }
    case 'grayscale': {
      const params = operation.params as { value: number };
      return applyGrayscale(imageData, params.value);
    }
    case 'sepia': {
      const params = operation.params as { value: number };
      return applySepia(imageData, params.value);
    }
    case 'invert': {
      const params = operation.params as { value: number };
      return applyInvert(imageData, params.value);
    }
    case 'blur': {
      const params = operation.params as { radius: number };
      return applyBlur(imageData, params.radius);
    }
    default:
      return imageData;
  }
}

export function applyEditStack(imageData: ImageData, editStack: EditOperation[]): ImageData {
  let result = cloneImageData(imageData);
  for (const operation of editStack) {
    result = applyEditOperation(result, operation);
  }
  return result;
}

export function renderCaptionOnImageData(
  imageData: ImageData,
  captions: Caption[],
  frameIndex: number
): ImageData {
  const relevantCaptions = captions.filter(
    (c) => frameIndex >= c.frameRange[0] && frameIndex <= c.frameRange[1]
  );

  if (relevantCaptions.length === 0) return imageData;

  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageData;

  ctx.putImageData(imageData, 0, 0);

  for (const caption of relevantCaptions) {
    ctx.font = `${caption.fontSize}px ${caption.fontFamily}`;
    ctx.textAlign = caption.align;
    ctx.textBaseline = 'top';

    if (caption.strokeWidth > 0) {
      ctx.strokeStyle = caption.strokeColor;
      ctx.lineWidth = caption.strokeWidth;
      ctx.strokeText(caption.text, caption.x, caption.y);
    }

    ctx.fillStyle = caption.color;
    ctx.fillText(caption.text, caption.x, caption.y);
  }

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function getProcessedFrameSize(frame: Frame): { width: number; height: number } {
  let width = frame.originalWidth;
  let height = frame.originalHeight;

  for (const op of frame.editStack) {
    if (!op.enabled) continue;
    if (op.type === 'crop') {
      const params = op.params as { width: number; height: number };
      width = params.width;
      height = params.height;
    } else if (op.type === 'resize') {
      const params = op.params as { width: number; height: number };
      width = params.width;
      height = params.height;
    }
  }

  return { width, height };
}

export function processFrame(
  frame: Frame,
  captions: Caption[],
  frameIndex: number,
  crop: CropConfig,
  exportWidth?: number,
  exportHeight?: number
): ImageData {
  let result = applyEditStack(frame.originalImageData, frame.editStack);

  result = renderCaptionOnImageData(result, captions, frameIndex);

  if (crop.enabled && crop.width > 0 && crop.height > 0) {
    result = cropImageData(result, crop.x, crop.y, crop.width, crop.height);
  }

  if (exportWidth && exportHeight && (result.width !== exportWidth || result.height !== exportHeight)) {
    result = resizeImageData(result, exportWidth, exportHeight);
  }

  return result;
}

export function processFrameForPreview(
  frame: Frame,
  captions: Caption[],
  frameIndex: number,
  crop: CropConfig
): ImageData {
  let result = applyEditStack(frame.originalImageData, frame.editStack);
  result = renderCaptionOnImageData(result, captions, frameIndex);

  if (crop.enabled && crop.width > 0 && crop.height > 0) {
    result = cropImageData(result, crop.x, crop.y, crop.width, crop.height);
  }

  return result;
}

export function processFrameForThumbnail(frame: Frame): ImageData {
  return applyEditStack(frame.originalImageData, frame.editStack);
}

export function processAllFrames(
  frames: Frame[],
  captions: Caption[],
  crop: CropConfig,
  exportWidth?: number,
  exportHeight?: number
): { imageData: ImageData; delay: number }[] {
  return frames.map((frame, index) => ({
    imageData: processFrame(frame, captions, index, crop, exportWidth, exportHeight),
    delay: frame.delay,
  }));
}
