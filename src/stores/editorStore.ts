import { create } from 'zustand';
import type {
  Frame,
  Caption,
  CropConfig,
  ExportConfig,
  EditOperation,
  EditOperationType,
  EditParams,
} from '@/types';
import { generateId, cloneImageData, createBlankImageData } from '@/utils/imageUtils';
import { processFrameForPreview } from '@/utils/frameProcessor';

interface EditorStore {
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
  showImportDialog: boolean;
  showExportDialog: boolean;

  setFrames: (frames: Frame[]) => void;
  setSelectedFrameIndex: (index: number) => void;
  setCurrentFrameIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setShowImportDialog: (show: boolean) => void;
  setShowExportDialog: (show: boolean) => void;

  addFrame: (imageData?: ImageData, afterIndex?: number) => void;
  deleteFrame: (index: number) => void;
  duplicateFrame: (index: number) => void;
  moveFrame: (fromIndex: number, toIndex: number) => void;
  setFrameDelay: (index: number, delay: number) => void;
  setAllFrameDelays: (delay: number) => void;

  addCaption: (caption?: Partial<Caption>) => void;
  updateCaption: (id: string, updates: Partial<Caption>) => void;
  deleteCaption: (id: string) => void;

  setCrop: (crop: Partial<CropConfig>) => void;
  setExportConfig: (config: Partial<ExportConfig>) => void;

  addEditOperation: (frameIndex: number, type: EditOperationType, params?: Partial<EditParams>) => void;
  addEditOperationToAll: (type: EditOperationType, params?: Partial<EditParams>) => void;
  updateEditOperation: (frameIndex: number, operationId: string, updates: Partial<EditOperation>) => void;
  updateEditOperationParams: (frameIndex: number, operationId: string, params: Partial<EditParams>) => void;
  toggleEditOperation: (frameIndex: number, operationId: string, enabled: boolean) => void;
  removeEditOperation: (frameIndex: number, operationId: string) => void;
  removeEditOperationFromAll: (operationId: string) => void;
  moveEditOperation: (frameIndex: number, fromIndex: number, toIndex: number) => void;
  clearEditStack: (frameIndex: number) => void;
  clearAllEditStacks: () => void;

  clearAll: () => void;
}

function createFrame(imageData: ImageData, delay = 100): Frame {
  const original = cloneImageData(imageData);
  return {
    id: generateId(),
    imageData: cloneImageData(imageData),
    originalImageData: original,
    delay,
    width: imageData.width,
    height: imageData.height,
    originalWidth: imageData.width,
    originalHeight: imageData.height,
    disposalMethod: 2,
    editStack: [],
  };
}

function getDefaultParams(type: EditOperationType, width: number, height: number): EditParams {
  switch (type) {
    case 'crop':
      return { x: 0, y: 0, width, height };
    case 'resize':
      return { width, height };
    case 'brightness':
      return { value: 0 };
    case 'contrast':
      return { value: 0 };
    case 'grayscale':
      return { value: 100 };
    case 'sepia':
      return { value: 100 };
    case 'invert':
      return { value: 100 };
    case 'blur':
      return { radius: 3 };
    default:
      return { value: 0 };
  }
}

function refreshFrameImageData(frame: Frame, captions: Caption[], frameIndex: number, crop: CropConfig): Frame {
  const processed = processFrameForPreview(frame, captions, frameIndex, crop);
  return {
    ...frame,
    imageData: processed,
    width: processed.width,
    height: processed.height,
  };
}

const defaultCrop: CropConfig = {
  enabled: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

const defaultExportConfig: ExportConfig = {
  colors: 256,
  quality: 80,
  fps: 15,
  dither: true,
  repeat: 0,
  width: 0,
  height: 0,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  frames: [],
  selectedFrameIndex: -1,
  captions: [],
  crop: defaultCrop,
  exportConfig: defaultExportConfig,
  isPlaying: false,
  playbackSpeed: 1,
  currentFrameIndex: 0,
  canvasWidth: 640,
  canvasHeight: 480,
  showImportDialog: false,
  showExportDialog: false,

  setFrames: (frames) => {
    if (frames.length > 0) {
      const firstFrame = frames[0];
      const exportCfg = get().exportConfig;
      set({
        frames,
        selectedFrameIndex: 0,
        currentFrameIndex: 0,
        canvasWidth: firstFrame.width,
        canvasHeight: firstFrame.height,
        crop: {
          ...get().crop,
          width: firstFrame.width,
          height: firstFrame.height,
        },
        exportConfig: {
          ...exportCfg,
          width: exportCfg.width || firstFrame.width,
          height: exportCfg.height || firstFrame.height,
        },
      });
    } else {
      set({ frames, selectedFrameIndex: -1, currentFrameIndex: 0 });
    }
  },

  setSelectedFrameIndex: (index) => set({ selectedFrameIndex: index }),
  setCurrentFrameIndex: (index) => set({ currentFrameIndex: index }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setShowImportDialog: (show) => set({ showImportDialog: show }),
  setShowExportDialog: (show) => set({ showExportDialog: show }),

  addFrame: (imageData, afterIndex) => {
    const state = get();
    const width = state.canvasWidth;
    const height = state.canvasHeight;
    const newFrame = createFrame(imageData || createBlankImageData(width, height));

    const newFrames = [...state.frames];
    if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < newFrames.length) {
      newFrames.splice(afterIndex + 1, 0, newFrame);
      set({ frames: newFrames, selectedFrameIndex: afterIndex + 1 });
    } else {
      newFrames.push(newFrame);
      set({ frames: newFrames, selectedFrameIndex: newFrames.length - 1 });
    }
  },

  deleteFrame: (index) => {
    const state = get();
    if (state.frames.length <= 1) {
      set({ frames: [], selectedFrameIndex: -1, currentFrameIndex: 0 });
      return;
    }
    const newFrames = state.frames.filter((_, i) => i !== index);
    const newSelected = index >= newFrames.length ? newFrames.length - 1 : index;
    set({
      frames: newFrames,
      selectedFrameIndex: newSelected,
      currentFrameIndex: Math.min(state.currentFrameIndex, newFrames.length - 1),
    });
  },

  duplicateFrame: (index) => {
    const state = get();
    const frame = state.frames[index];
    if (!frame) return;

    const newFrame: Frame = {
      ...frame,
      id: generateId(),
      originalImageData: cloneImageData(frame.originalImageData),
      imageData: cloneImageData(frame.imageData),
      editStack: frame.editStack.map((op) => ({ ...op, id: generateId() })),
    };

    const newFrames = [...state.frames];
    newFrames.splice(index + 1, 0, newFrame);
    set({ frames: newFrames, selectedFrameIndex: index + 1 });
  },

  moveFrame: (fromIndex, toIndex) => {
    const state = get();
    if (fromIndex === toIndex) return;
    const newFrames = [...state.frames];
    const [removed] = newFrames.splice(fromIndex, 1);
    newFrames.splice(toIndex, 0, removed);
    set({ frames: newFrames, selectedFrameIndex: toIndex });
  },

  setFrameDelay: (index, delay) => {
    const state = get();
    const newFrames = [...state.frames];
    if (newFrames[index]) {
      newFrames[index] = { ...newFrames[index], delay: Math.max(10, delay) };
      set({ frames: newFrames });
    }
  },

  setAllFrameDelays: (delay) => {
    const state = get();
    const newFrames = state.frames.map((f) => ({ ...f, delay: Math.max(10, delay) }));
    set({ frames: newFrames });
  },

  addCaption: (caption) => {
    const state = get();
    const maxFrames = Math.max(0, state.frames.length - 1);
    const newCaption: Caption = {
      id: generateId(),
      text: caption?.text || '新字幕',
      frameRange: caption?.frameRange || [0, maxFrames],
      x: caption?.x ?? state.canvasWidth / 2,
      y: caption?.y ?? state.canvasHeight - 60,
      fontSize: caption?.fontSize || 32,
      fontFamily: caption?.fontFamily || 'Arial, sans-serif',
      color: caption?.color || '#FFFFFF',
      strokeColor: caption?.strokeColor || '#000000',
      strokeWidth: caption?.strokeWidth ?? 2,
      align: caption?.align || 'center',
    };
    set({ captions: [...state.captions, newCaption] });
  },

  updateCaption: (id, updates) => {
    const state = get();
    const newCaptions = state.captions.map((c) => (c.id === id ? { ...c, ...updates } : c));
    set({ captions: newCaptions });
  },

  deleteCaption: (id) => {
    const state = get();
    set({ captions: state.captions.filter((c) => c.id !== id) });
  },

  setCrop: (crop) => set({ crop: { ...get().crop, ...crop } }),
  setExportConfig: (config) => set({ exportConfig: { ...get().exportConfig, ...config } }),

  addEditOperation: (frameIndex, type, params) => {
    const state = get();
    const frame = state.frames[frameIndex];
    if (!frame) return;

    const defaultP = getDefaultParams(type, frame.originalWidth, frame.originalHeight);
    const newOp: EditOperation = {
      id: generateId(),
      type,
      params: { ...defaultP, ...(params || {}) } as EditParams,
      enabled: true,
      createdAt: Date.now(),
    };

    const newFrames = [...state.frames];
    newFrames[frameIndex] = {
      ...frame,
      editStack: [...frame.editStack, newOp],
    };

    const refreshed = refreshFrameImageData(
      newFrames[frameIndex],
      state.captions,
      frameIndex,
      state.crop
    );
    newFrames[frameIndex] = refreshed;

    set({ frames: newFrames });
  },

  addEditOperationToAll: (type, params) => {
    const state = get();
    if (state.frames.length === 0) return;

    const newFrames = state.frames.map((frame, index) => {
      const defaultP = getDefaultParams(type, frame.originalWidth, frame.originalHeight);
      const newOp: EditOperation = {
        id: generateId(),
        type,
        params: { ...defaultP, ...(params || {}) } as EditParams,
        enabled: true,
        createdAt: Date.now(),
      };

      const updated = {
        ...frame,
        editStack: [...frame.editStack, newOp],
      };
      return refreshFrameImageData(updated, state.captions, index, state.crop);
    });

    set({ frames: newFrames });
  },

  updateEditOperation: (frameIndex, operationId, updates) => {
    const state = get();
    const frame = state.frames[frameIndex];
    if (!frame) return;

    const newStack = frame.editStack.map((op) =>
      op.id === operationId ? { ...op, ...updates } : op
    );

    const newFrames = [...state.frames];
    newFrames[frameIndex] = {
      ...frame,
      editStack: newStack,
    };

    const refreshed = refreshFrameImageData(
      newFrames[frameIndex],
      state.captions,
      frameIndex,
      state.crop
    );
    newFrames[frameIndex] = refreshed;

    set({ frames: newFrames });
  },

  updateEditOperationParams: (frameIndex, operationId, params) => {
    const state = get();
    const frame = state.frames[frameIndex];
    if (!frame) return;

    const newStack = frame.editStack.map((op) =>
      op.id === operationId ? { ...op, params: { ...op.params, ...params } } : op
    );

    const newFrames = [...state.frames];
    newFrames[frameIndex] = {
      ...frame,
      editStack: newStack,
    };

    const refreshed = refreshFrameImageData(
      newFrames[frameIndex],
      state.captions,
      frameIndex,
      state.crop
    );
    newFrames[frameIndex] = refreshed;

    set({ frames: newFrames });
  },

  toggleEditOperation: (frameIndex, operationId, enabled) => {
    const state = get();
    const frame = state.frames[frameIndex];
    if (!frame) return;

    const newStack = frame.editStack.map((op) =>
      op.id === operationId ? { ...op, enabled } : op
    );

    const newFrames = [...state.frames];
    newFrames[frameIndex] = {
      ...frame,
      editStack: newStack,
    };

    const refreshed = refreshFrameImageData(
      newFrames[frameIndex],
      state.captions,
      frameIndex,
      state.crop
    );
    newFrames[frameIndex] = refreshed;

    set({ frames: newFrames });
  },

  removeEditOperation: (frameIndex, operationId) => {
    const state = get();
    const frame = state.frames[frameIndex];
    if (!frame) return;

    const newStack = frame.editStack.filter((op) => op.id !== operationId);

    const newFrames = [...state.frames];
    newFrames[frameIndex] = {
      ...frame,
      editStack: newStack,
    };

    const refreshed = refreshFrameImageData(
      newFrames[frameIndex],
      state.captions,
      frameIndex,
      state.crop
    );
    newFrames[frameIndex] = refreshed;

    set({ frames: newFrames });
  },

  removeEditOperationFromAll: (operationId) => {
    const state = get();
    const newFrames = state.frames.map((frame, index) => {
      const updated = {
        ...frame,
        editStack: frame.editStack.filter((op) => op.id !== operationId),
      };
      return refreshFrameImageData(updated, state.captions, index, state.crop);
    });
    set({ frames: newFrames });
  },

  moveEditOperation: (frameIndex, fromIndex, toIndex) => {
    const state = get();
    const frame = state.frames[frameIndex];
    if (!frame) return;
    if (fromIndex === toIndex) return;

    const newStack = [...frame.editStack];
    const [removed] = newStack.splice(fromIndex, 1);
    newStack.splice(toIndex, 0, removed);

    const newFrames = [...state.frames];
    newFrames[frameIndex] = {
      ...frame,
      editStack: newStack,
    };

    const refreshed = refreshFrameImageData(
      newFrames[frameIndex],
      state.captions,
      frameIndex,
      state.crop
    );
    newFrames[frameIndex] = refreshed;

    set({ frames: newFrames });
  },

  clearEditStack: (frameIndex) => {
    const state = get();
    const frame = state.frames[frameIndex];
    if (!frame) return;

    const newFrames = [...state.frames];
    newFrames[frameIndex] = {
      ...frame,
      editStack: [],
    };

    const refreshed = refreshFrameImageData(
      newFrames[frameIndex],
      state.captions,
      frameIndex,
      state.crop
    );
    newFrames[frameIndex] = refreshed;

    set({ frames: newFrames });
  },

  clearAllEditStacks: () => {
    const state = get();
    const newFrames = state.frames.map((frame, index) => {
      const updated = { ...frame, editStack: [] };
      return refreshFrameImageData(updated, state.captions, index, state.crop);
    });
    set({ frames: newFrames });
  },

  clearAll: () =>
    set({
      frames: [],
      selectedFrameIndex: -1,
      captions: [],
      crop: defaultCrop,
      isPlaying: false,
      currentFrameIndex: 0,
      showImportDialog: false,
      showExportDialog: false,
    }),
}));
