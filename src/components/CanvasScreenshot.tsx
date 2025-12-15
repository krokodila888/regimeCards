// src/components/CanvasScreenshot.tsx
import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import ObjectPalette from './ObjectPalette';
import VisioObjectPalette from './VisioObjectPalette';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface CanvasScreenshotProps {
  imageUrl: string;
  visibleLayers?: {
    speedCurve?: boolean;      // Зелёная кривая скорости
    limitCurve?: boolean;       // Красная кривая ограничений
    profileCurve?: boolean;     // Синяя кривая профиля
    gradientCurve?: boolean;    // Красная верхняя кривая уклонов
    regimeMarkers?: boolean;    // Цветные маркеры режимов (внизу)
    stationMarkers?: boolean;   // Подписи станций
  };
}

export default function CanvasScreenshot({ 
  imageUrl,
  visibleLayers = {
    speedCurve: true,
    limitCurve: true,
    profileCurve: true,
    gradientCurve: true,
    regimeMarkers: true,
    stationMarkers: true,
  }
}: CanvasScreenshotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteCollapsed, setPaletteCollapsed] = useState(true);
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [localDisplaySettings, setLocalDisplaySettings] = useState(() => ({
    speedCurve: visibleLayers.speedCurve ?? true,
    limitCurve: visibleLayers.limitCurve ?? true,
    profileCurve: visibleLayers.profileCurve ?? true,
    gradientCurve: visibleLayers.gradientCurve ?? true,
    regimeMarkers: visibleLayers.regimeMarkers ?? true,
    stationMarkers: visibleLayers.stationMarkers ?? true,
  }));

  // Сброс к начальному состоянию
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom функции
  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.3));
  };

  // Обработка колёсика мыши для зума
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  // Начало перетаскивания
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Перетаскивание
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  // Конец перетаскивания
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Автоматическая подгонка при загрузке
  useEffect(() => {
    if (imageLoaded && containerRef.current && imageRef.current) {
      const container = containerRef.current;
      const image = imageRef.current;
      
      // Подгоняем по высоте контейнера
      const scaleToFit = container.clientHeight / image.naturalHeight;
      setScale(scaleToFit * 0.95); // 95% чтобы был небольшой отступ
      
      // Центрируем по вертикали
      setPosition({ x: 0, y: 0 });
    }
  }, [imageLoaded]);

  return (
    <div className="flex-1 p-6 overflow-hidden flex flex-col">
      <div className="bg-white rounded-lg shadow-sm p-6 flex-1 flex flex-col" 
      style={{ overflowY: 'scroll', position: 'relative', overflowX: 'scroll !important' }}>
        {/* Панель управления */}
        <div className="absolute top-4 right-4 z-10 flex gap-2 bg-white rounded-lg shadow-lg p-2">
        <Button
          size="icon"
          variant="outline"
          onClick={zoomIn}
          title="Увеличить (или колёсико мыши вверх)"
          className="h-9 w-9"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={zoomOut}
          title="Уменьшить (или колёсико мыши вниз)"
          className="h-9 w-9"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={resetView}
          title="Сбросить вид"
          className="h-9 w-9"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setShowDisplaySettings(true)}
          title="Настройки отображения"
          className="h-9 w-9"
        >
          ⚙️
        </Button>
        <div className="flex items-center px-3 text-sm text-gray-600 border-l ml-1 pl-3">
          {Math.round(scale * 100)}%
        </div>
      </div>

        {/* Canvas-контейнер с горизонтальным скроллом */}
        <div
          ref={containerRef}
          className="w-full h-full cursor-move overflow-x-auto"
          style={{ position: 'relative' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
          style={{
            display: 'inline-block',
            minWidth: imageRef.current?.naturalWidth || 2000,
            height: '100%',
            position: 'relative',
          }}
        >
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'top left',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              width: 'fit-content',
              height: 'fit-content',
              position: 'relative',
            }}
          >
            {/* Основное изображение */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Режимная карта"
              onLoad={() => setImageLoaded(true)}
              className="block"
              style={{
                display: 'block',
                maxWidth: 'none',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />

            {/* Маски для скрытия слоёв (если нужно) */}
            {imageLoaded && (
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: imageRef.current?.naturalWidth,
                  height: imageRef.current?.naturalHeight,
                  pointerEvents: 'none',
                }}
              >
                {/* Пример: скрыть зелёную кривую скорости */}
                {!visibleLayers.speedCurve && (
                  <rect
                    x="0"
                    y="220"
                    width="100%"
                    height="350"
                    fill="white"
                    opacity="0.9"
                  />
                )}
                {/* ... остальные маски ... */}
                {!visibleLayers.limitCurve && (
                  <rect x="0" y="220" width="100%" height="90" fill="white" opacity="0.9" />
                )}
                {!visibleLayers.profileCurve && (
                  <rect x="0" y="130" width="100%" height="90" fill="white" opacity="0.9" />
                )}
                {!visibleLayers.gradientCurve && (
                  <rect x="0" y="60" width="100%" height="70" fill="white" opacity="0.9" />
                )}
                {!visibleLayers.regimeMarkers && (
                  <rect x="0" y="570" width="100%" height="80" fill="white" opacity="0.9" />
                )}
                {!visibleLayers.stationMarkers && (
                  <rect x="0" y="650" width="100%" height="100" fill="white" opacity="0.9" />
                )}
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Индикатор загрузки */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка режимной карты...</p>
          </div>
        </div>
      )}
      {/* Object Palette */}
      <ObjectPalette
        isOpen={showPalette}
        onSelect={(objectType: any, label?: string) => {
          // Простая интеграция: закрываем палитру при выборе
          setShowPalette(false);
          (window as any).__placingObjectLabel = label;
        }}
        onClose={() => setShowPalette(false)}
      />

      {/* Display Settings Dialog */}
      <Dialog open={showDisplaySettings} onOpenChange={setShowDisplaySettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Настройки отображения</DialogTitle>
            <DialogDescription>
              Выберите элементы для отображения на холсте
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="speedCurve"
                checked={localDisplaySettings.speedCurve}
                onCheckedChange={(checked) =>
                  setLocalDisplaySettings({
                    ...localDisplaySettings,
                    speedCurve: !!checked,
                  })
                }
              />
              <Label htmlFor="speedCurve" className="text-sm cursor-pointer">Кривая скорости</Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="limitCurve"
                checked={localDisplaySettings.limitCurve}
                onCheckedChange={(checked) =>
                  setLocalDisplaySettings({
                    ...localDisplaySettings,
                    limitCurve: !!checked,
                  })
                }
              />
              <Label htmlFor="limitCurve" className="text-sm cursor-pointer">Ограничения скорости</Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="profileCurve"
                checked={localDisplaySettings.profileCurve}
                onCheckedChange={(checked) =>
                  setLocalDisplaySettings({
                    ...localDisplaySettings,
                    profileCurve: !!checked,
                  })
                }
              />
              <Label htmlFor="profileCurve" className="text-sm cursor-pointer">Профиль пути</Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visio-like Object Palette - Right Sidebar */}
      <VisioObjectPalette
        collapsed={paletteCollapsed}
        onToggleCollapse={() => setPaletteCollapsed(!paletteCollapsed)}
      />
      {/* Закрывающие div для оболочек */}
    </div>
  </div>
  );
}