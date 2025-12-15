// src/components/CanvasScreenshot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Settings } from 'lucide-react';
import { Button } from './ui/button';

interface CanvasScreenshotProps {
  imageUrl: string;
  visibleLayers?: {
    speedCurve?: boolean;      // Зелёная кривая скорости
    optimalCurve?: boolean;    // Красная оптимальная
    profileCurve?: boolean;    // Синяя профиль пути
    regimeBars?: boolean;      // Полосы режимов (внизу)
    gradientMarks?: boolean;   // Уклоны (самый низ)
  };
  onOpenSettings?: () => void;
}

export default function CanvasScreenshot({
  imageUrl,
  visibleLayers = {
    speedCurve: true,
    optimalCurve: true,
    profileCurve: true,
    regimeBars: true,
    gradientMarks: true,
  },
  onOpenSettings,
}: CanvasScreenshotProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Загрузка и отрисовка изображения
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      // Устанавливаем размер canvas равным изображению
      canvas.width = img.width;
      canvas.height = img.height;

      // Очищаем canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Рисуем изображение
      ctx.drawImage(img, 0, 0);

      // Применяем маски для скрытия слоёв
      applyLayerMasks(ctx, canvas.width, canvas.height);
    };
  }, [imageUrl, visibleLayers]);

  // Применение масок для скрытия слоёв
  const applyLayerMasks = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Примерные координаты областей (нужно будет подстроить под реальное изображение)
    const regions = {
      speedCurve: { y: height * 0.15, h: height * 0.35 },      // Зелёная кривая
      optimalCurve: { y: height * 0.15, h: height * 0.35 },    // Красная кривая
      profileCurve: { y: 0, h: height * 0.15 },                // Синяя профиль (верх)
      regimeBars: { y: height * 0.70, h: height * 0.15 },      // Полосы режимов
      gradientMarks: { y: height * 0.85, h: height * 0.15 },   // Уклоны (низ)
    };

    // Для каждого скрытого слоя накладываем белый прямоугольник
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';

    if (!visibleLayers.speedCurve && !visibleLayers.optimalCurve) {
      // Скрываем всю область кривых скорости
      ctx.fillRect(0, regions.speedCurve.y, width, regions.speedCurve.h);
    }

    if (!visibleLayers.profileCurve) {
      ctx.fillRect(0, regions.profileCurve.y, width, regions.profileCurve.h);
    }

    if (!visibleLayers.regimeBars) {
      ctx.fillRect(0, regions.regimeBars.y, width, regions.regimeBars.h);
    }

    if (!visibleLayers.gradientMarks) {
      ctx.fillRect(0, regions.gradientMarks.y, width, regions.gradientMarks.h);
    }
  };

  // Управление масштабом
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleFitToScreen = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Управление перетаскиванием
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden">
      {/* Панель инструментов */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 bg-white rounded-lg shadow-lg p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          title="Увеличить"
          className="hover:bg-gray-100"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          title="Уменьшить"
          className="hover:bg-gray-100"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFitToScreen}
          title="По размеру экрана"
          className="hover:bg-gray-100"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
        {onOpenSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            title="Настройки отображения"
            className="hover:bg-gray-100"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Индикатор масштаба */}
      <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg px-3 py-2 text-sm">
        {Math.round(zoom * 100)}%
      </div>

      {/* Контейнер для canvas */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <canvas
            ref={canvasRef}
            className="block"
            style={{
              maxWidth: 'none',
              imageRendering: 'crisp-edges',
            }}
          />
        </div>
      </div>

      {/* Подсказка при первой загрузке */}
      {zoom === 1 && pan.x === 0 && pan.y === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
            Используйте колёсико мыши для масштабирования и перетаскивание для навигации
          </div>
        </div>
      )}
    </div>
  );
}