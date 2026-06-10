export type EditOperationType =
  | 'crop'
  | 'resize'
  | 'brightness'
  | 'contrast'
  | 'grayscale'
  | 'sepia'
  | 'invert'
  | 'blur';

export interface CropParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeParams {
  width: number;
  height: number;
}

export interface BrightnessParams {
  value: number;
}

export interface ContrastParams {
  value: number;
}

export interface GrayscaleParams {
  value: number;
}

export interface SepiaParams {
  value: number;
}

export interface InvertParams {
  value: number;
}

export interface BlurParams {
  radius: number;
}

export type EditParams =
  | CropParams
  | ResizeParams
  | BrightnessParams
  | ContrastParams
  | GrayscaleParams
  | SepiaParams
  | InvertParams
  | BlurParams;

export interface EditOperation {
  id: string;
  type: EditOperationType;
  params: EditParams;
  enabled: boolean;
  createdAt: number;
}

export interface Frame {
  id: string;
  imageData: ImageData;
  originalImageData: ImageData;
  delay: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  disposalMethod: number;
  editStack: EditOperation[];
}

export interface Caption {
  id: string;
  text: string;
  frameRange: [number, number];
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  align: 'left' | 'center' | 'right';
}

export interface CropConfig {
  enabled: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExportConfig {
  colors: number;
  quality: number;
  fps: number;
  dither: boolean;
  repeat: number;
  width: number;
  height: number;
}

export interface EditorState {
  frames: Frame[];
  selectedFrameIndex: number;
  captions: Caption[];
  crop: CropConfig;
  exportConfig: ExportConfig;
  isPlaying: boolean;
  playbackSpeed: number;
  currentFrameIndex: number;
  canvasWidth: number;
  canvasHeight: number;
}
