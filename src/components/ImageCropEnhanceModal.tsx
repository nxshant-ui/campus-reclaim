import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sliders,
  Check,
  RefreshCw,
  Crop,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import {
  EnhancementOptions,
  DEFAULT_ENHANCEMENT_OPTIONS,
  AspectRatioType,
  cropAndEnhanceImage,
  processImageData,
} from '../utils/imageEnhancer';

interface ImageCropEnhanceModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onApply: (processedDataUrl: string) => void;
}

export const ImageCropEnhanceModal: React.FC<ImageCropEnhanceModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onApply,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Crop & Transform state
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('4:3');
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Enhancement options state
  const [options, setOptions] = useState<EnhancementOptions>({
    ...DEFAULT_ENHANCEMENT_OPTIONS,
  });
  const [showSliders, setShowSliders] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load image object when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      setPanX(0);
      setPanY(0);
      setZoom(1);
      setRotation(0);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Render preview canvas whenever transform or options change
  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport preview dimensions
    const previewWidth = 520;
    let previewHeight = 390; // Default 4:3

    if (aspectRatio === '1:1') previewHeight = 520;
    else if (aspectRatio === '16:9') previewHeight = 292;
    else if (aspectRatio === 'free') {
      const ratio = imageObj.width / imageObj.height;
      previewHeight = Math.round(previewWidth / ratio);
    }

    canvas.width = previewWidth;
    canvas.height = previewHeight;

    // Clear background
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, previewWidth, previewHeight);

    ctx.save();

    // Center pivot
    ctx.translate(previewWidth / 2 + panX, previewHeight / 2 + panY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Calculate base draw dimensions to cover container
    const isRotated = rotation % 180 !== 0;
    const imgW = isRotated ? imageObj.height : imageObj.width;
    const imgH = isRotated ? imageObj.width : imageObj.height;

    const scale = Math.max(previewWidth / imgW, previewHeight / imgH);
    const drawW = imageObj.width * scale;
    const drawH = imageObj.height * scale;

    ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // If NOT holding to view original, apply canvas enhancements
    if (!showOriginal) {
      const raw = ctx.getImageData(0, 0, previewWidth, previewHeight);
      const enhanced = processImageData(raw, options);
      ctx.putImageData(enhanced, 0, 0);
    }
  }, [imageObj, aspectRatio, zoom, rotation, panX, panY, options, showOriginal]);

  if (!isOpen) return null;

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanX(e.touches[0].clientX - dragStart.x);
    setPanY(e.touches[0].clientY - dragStart.y);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPanX(0);
    setPanY(0);
    setOptions({ ...DEFAULT_ENHANCEMENT_OPTIONS });
  };

  const handleApply = async () => {
    if (!imageObj) return;

    try {
      setIsProcessing(true);

      // Determine final standard output dimensions
      let targetW = 800;
      let targetH = 600; // 4:3 default

      if (aspectRatio === '1:1') {
        targetW = 800;
        targetH = 800;
      } else if (aspectRatio === '16:9') {
        targetW = 800;
        targetH = 450;
      } else if (aspectRatio === 'free') {
        targetW = Math.min(800, imageObj.width);
        targetH = Math.round(targetW * (imageObj.height / imageObj.width));
      }

      // Compute crop region in image space
      const isRotated = rotation % 180 !== 0;
      const effectiveW = isRotated ? imageObj.height : imageObj.width;
      const effectiveH = isRotated ? imageObj.width : imageObj.height;

      const baseScale = Math.max(targetW / effectiveW, targetH / effectiveH);
      const scaledW = effectiveW * baseScale * zoom;
      const scaledH = effectiveH * baseScale * zoom;

      // Reverse pan & zoom into source pixel crop rectangle
      const cropW = Math.round(imageObj.width / zoom);
      const cropH = Math.round(imageObj.height / zoom);
      const cropX = Math.max(0, Math.round((imageObj.width - cropW) / 2 - (panX / scaledW) * imageObj.width));
      const cropY = Math.max(0, Math.round((imageObj.height - cropH) / 2 - (panY / scaledH) * imageObj.height));

      const processedDataUrl = await cropAndEnhanceImage(
        imageObj,
        {
          x: cropX,
          y: cropY,
          width: Math.min(imageObj.width - cropX, cropW),
          height: Math.min(imageObj.height - cropY, cropH),
        },
        rotation,
        options,
        targetW,
        targetH
      );

      onApply(processedDataUrl);
      onClose();
    } catch (err) {
      console.error('Error applying enhancements:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Editor Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-3xl shadow-2xl border border-white/80 overflow-hidden z-10 my-4 text-left">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#D8F5E5] via-[#DDF0FF] to-[#E8E2F8] border-b border-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white p-2 shadow-xs border border-white flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#059669]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B]">
                Crop & Enhance Item Photo
              </h3>
              <p className="text-[11px] text-[#64748B] font-medium">
                Standardize framing and auto-enhance clarity for campus catalog recognition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/70 hover:bg-white text-[#475569] shadow-xs transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Canvas Viewport Box with Rule-of-Thirds Grid */}
          <div className="relative w-full flex items-center justify-center bg-slate-900/5 rounded-2xl p-2 border border-[#E2E8F0] overflow-hidden select-none">
            <div
              className="relative rounded-xl overflow-hidden cursor-move shadow-md"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[360px] object-contain block bg-slate-100"
              />

              {/* Rule-of-Thirds Crop Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/40">
                <div className="border-r border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-b border-white/30"></div>
                <div className="border-r border-white/30"></div>
                <div className="border-r border-white/30"></div>
                <div></div>
              </div>

              {/* Drag Hint Tag */}
              <div className="absolute bottom-2 left-2 pointer-events-none px-2 py-0.5 rounded-md bg-black/50 text-white text-[10px] font-semibold backdrop-blur-xs">
                Drag to Pan
              </div>

              {/* Original toggle indicator */}
              {showOriginal && (
                <div className="absolute top-2 right-2 pointer-events-none px-2.5 py-1 rounded-md bg-[#EA580C] text-white text-[10px] font-extrabold shadow-sm">
                  ORIGINAL
                </div>
              )}
            </div>
          </div>

          {/* Quick Toolbar: Aspect Ratio & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* Aspect Ratio Pills */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setAspectRatio('4:3')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  aspectRatio === '4:3'
                    ? 'bg-[#D1FAE5] text-[#065F46] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                4:3 Standard
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  aspectRatio === '1:1'
                    ? 'bg-[#D1FAE5] text-[#065F46] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                1:1 Square
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  aspectRatio === '16:9'
                    ? 'bg-[#D1FAE5] text-[#065F46] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                16:9 Wide
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('free')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  aspectRatio === 'free'
                    ? 'bg-[#D1FAE5] text-[#065F46] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Full
              </button>
            </div>

            {/* Transform Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRotate}
                title="Rotate 90 degrees"
                className="p-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#FAF8F5] text-[#475569] hover:text-[#1E293B] shadow-xs text-xs font-semibold flex items-center gap-1"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>90°</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Reset zoom and crop"
                className="p-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#FAF8F5] text-[#475569] shadow-xs text-xs font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              {/* Before/After Peek Button */}
              <button
                type="button"
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] text-xs font-bold flex items-center gap-1 select-none"
              >
                <Eye className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="hidden sm:inline">Hold for Original</span>
                <span className="sm:hidden">Original</span>
              </button>
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-[#E2E8F0] text-xs">
            <ZoomOut className="w-4 h-4 text-[#94A3B8]" />
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-[#059669] cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-[11px] font-bold text-[#64748B] w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Auto-Enhancement & Sliders Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* One-Tap Auto Enhance Button */}
              <button
                type="button"
                onClick={() =>
                  setOptions((prev) => ({
                    ...prev,
                    autoEnhance: !prev.autoEnhance,
                  }))
                }
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 border ${
                  options.autoEnhance
                    ? 'bg-gradient-to-r from-[#D1FAE5] to-[#A3E7C3] text-[#065F46] border-[#6EE7B7] ring-2 ring-[#059669]/20'
                    : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-50'
                }`}
              >
                <Sparkles
                  className={`w-4 h-4 ${
                    options.autoEnhance ? 'text-[#059669] animate-spin' : 'text-[#94A3B8]'
                  }`}
                />
                <span>
                  {options.autoEnhance ? 'Auto-Enhancement: ON' : 'One-Tap Auto Enhance'}
                </span>
              </button>

              {/* Detail Sharpen Toggle */}
              <button
                type="button"
                onClick={() =>
                  setOptions((prev) => ({
                    ...prev,
                    sharpen: !prev.sharpen,
                  }))
                }
                className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all border ${
                  options.sharpen
                    ? 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]'
                    : 'bg-white text-[#64748B] border-[#E2E8F0]'
                }`}
              >
                <span>🔍 Sharpen Details {options.sharpen ? '✓' : ''}</span>
              </button>

              {/* Toggle manual fine-tuning sliders */}
              <button
                type="button"
                onClick={() => setShowSliders(!showSliders)}
                className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showSliders ? 'Hide Sliders' : 'Fine-Tune Sliders'}</span>
              </button>
            </div>

            {/* Optional Manual Sliders */}
            {showSliders && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-[#64748B] mb-1">
                    <span>Brightness</span>
                    <span>{options.brightness > 0 ? `+${options.brightness}` : options.brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={options.brightness}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        brightness: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-[#7C3AED]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-[#64748B] mb-1">
                    <span>Contrast</span>
                    <span>{options.contrast > 0 ? `+${options.contrast}` : options.contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={options.contrast}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        contrast: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-[#7C3AED]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-[#64748B] mb-1">
                    <span>Color Saturation</span>
                    <span>{options.saturation > 0 ? `+${options.saturation}` : options.saturation}</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={options.saturation}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        saturation: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-[#7C3AED]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-2xl bg-white border border-[#CBD5E1] text-[#475569] text-xs font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#7C3AED] hover:from-[#047857] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-102 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Canvas...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Apply & Use Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
