// src/components/CanvasScreenshot.tsx
import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Settings } from 'lucide-react';
import { Button } from './ui/button';
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
import { LOCOMOTIVES } from '../types/consts';

interface CanvasScreenshotProps {
  imageUrl: string;
}

export default function CanvasScreenshot({ 
  imageUrl,
}: CanvasScreenshotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [paletteCollapsed, setPaletteCollapsed] = useState(true);
  
  // Используем локомотив с id: "loc1"
  const locomotive = LOCOMOTIVES.find(loc => loc.id === "loc1") || LOCOMOTIVES[0];

  // Настройки отображения слоёв
  const [visibleLayers, setVisibleLayers] = useState({
    speedCurve: true,
    limitCurve: true,
    profileCurve: true,
    gradientCurve: true,
    regimeMarkers: true,
    stationMarkers: true,
  });

  // Сброс к начальному состоянию
  const handleResetZoom = () => {
    setZoom(1);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  };

  // Начало перетаскивания
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setDragStartX(e.clientX + containerRef.current.scrollLeft);
    e.preventDefault();
  };

  // Перетаскивание
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const newScrollX = dragStartX - e.clientX;
    containerRef.current.scrollLeft = newScrollX;
  };

  // Конец перетаскивания
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Обработка колёсика мыши (горизонтальный скролл)
  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    
    e.preventDefault();
    containerRef.current.scrollLeft += e.deltaY;
  };

  return (
    <div className="flex-1 p-6 overflow-hidden flex flex-col">
      <div className="bg-white rounded-lg shadow-sm p-6 flex-1 flex flex-col overflow-hidden" style={{overflowX: "scroll"}}>
        
        {/* Панель управления */}
        <div
          className="mb-4 flex items-center justify-between flex-shrink-0"
          style={{
            paddingLeft: 10,
            paddingRight: 10,
            zIndex: 30,
            position: "absolute"
          }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
              <span className="text-sm">Zoom:</span>
              <span className="text-sm font-mono">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom((prev) => Math.min(4, prev * 1.2))}
              title="Увеличить"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom((prev) => Math.max(0.25, prev / 1.2))}
              title="Уменьшить"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetZoom}
              title="Сбросить масштаб"
            >
              Начальный масштаб
            </Button>
          </div>
          <div style={{ paddingLeft: 10 }}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDisplaySettings(true)}
              title="Настройки отображения"
              
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Canvas-контейнер с горизонтальным скроллом */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative bg-gray-50"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Wrapper для обеспечения ширины, больше контейнера (для скролла) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: '100%',
              position: 'relative',
            }}
          >
            {/* Изображение */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Режимная карта"
              onLoad={() => setImageLoaded(true)}
              style={{
                display: 'block',
                height: '100%',
                width: 'auto',
                transform: `scaleX(${zoom})`,
                transformOrigin: 'left center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                userSelect: 'none',
                pointerEvents: 'none',
                maxWidth: "fit-content"
              }}
            />

            {/* SVG маски для скрытия слоёв */}
            {imageLoaded && imageRef.current && (
              <svg
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  height: '100%',
                  width: imageRef.current.naturalWidth * zoom,
                  pointerEvents: 'none',
                }}
                viewBox={`0 0 ${imageRef.current.naturalWidth} ${imageRef.current.naturalHeight}`}
                preserveAspectRatio="none"
              >
                {/* Скрыть красную верхнюю кривую уклонов */}
                {!visibleLayers.gradientCurve && (
                  <rect
                    x="0"
                    y="0"
                    width={imageRef.current.naturalWidth}
                    height={imageRef.current.naturalHeight * 0.15}
                    fill="white"
                    opacity="0.95"
                  />
                )}
                
                {/* Скрыть синюю кривую профиля */}
                {!visibleLayers.profileCurve && (
                  <rect
                    x="0"
                    y={imageRef.current.naturalHeight * 0.15}
                    width={imageRef.current.naturalWidth}
                    height={imageRef.current.naturalHeight * 0.15}
                    fill="white"
                    opacity="0.95"
                  />
                )}
                
                {/* Скрыть красную кривую ограничений */}
                {!visibleLayers.limitCurve && (
                  <rect
                    x="0"
                    y={imageRef.current.naturalHeight * 0.27}
                    width={imageRef.current.naturalWidth}
                    height={imageRef.current.naturalHeight * 0.08}
                    fill="white"
                    opacity="0.95"
                  />
                )}
                
                {/* Скрыть зелёную кривую скорости */}
                {!visibleLayers.speedCurve && (
                  <rect
                    x="0"
                    y={imageRef.current.naturalHeight * 0.27}
                    width={imageRef.current.naturalWidth}
                    height={imageRef.current.naturalHeight * 0.45}
                    fill="white"
                    opacity="0.95"
                  />
                )}
                
                {/* Скрыть цветные маркеры режимов */}
                {!visibleLayers.regimeMarkers && (
                  <rect
                    x="0"
                    y={imageRef.current.naturalHeight * 0.73}
                    width={imageRef.current.naturalWidth}
                    height={imageRef.current.naturalHeight * 0.10}
                    fill="white"
                    opacity="0.95"
                  />
                )}
                
                {/* Скрыть подписи станций */}
                {!visibleLayers.stationMarkers && (
                  <rect
                    x="0"
                    y={imageRef.current.naturalHeight * 0.83}
                    width={imageRef.current.naturalWidth}
                    height={imageRef.current.naturalHeight * 0.17}
                    fill="white"
                    opacity="0.95"
                  />
                )}
              </svg>
            )}
          </div>
        </div>

        {/* Индикатор загрузки */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка режимной карты...</p>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно настроек отображения */}
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
                id="gradientCurve"
                checked={visibleLayers.gradientCurve}
                onCheckedChange={(checked) =>
                  setVisibleLayers({
                    ...visibleLayers,
                    gradientCurve: !!checked,
                  })
                }
              />
              <Label htmlFor="gradientCurve" className="text-sm cursor-pointer">
                Динамика реализованная 
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="profileCurve"
                checked={visibleLayers.profileCurve}
                onCheckedChange={(checked) =>
                  setVisibleLayers({
                    ...visibleLayers,
                    profileCurve: !!checked,
                  })
                }
              />
              <Label htmlFor="profileCurve" className="text-sm cursor-pointer">
                Профиль пути
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="limitCurve"
                checked={visibleLayers.limitCurve}
                onCheckedChange={(checked) =>
                  setVisibleLayers({
                    ...visibleLayers,
                    limitCurve: !!checked,
                  })
                }
              />
              <Label htmlFor="limitCurve" className="text-sm cursor-pointer">
                Ограничения скорости
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="speedCurve"
                checked={visibleLayers.speedCurve}
                onCheckedChange={(checked) =>
                  setVisibleLayers({
                    ...visibleLayers,
                    speedCurve: !!checked,
                  })
                }
              />
              <Label htmlFor="speedCurve" className="text-sm cursor-pointer">
                Кривая скорости
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="regimeMarkers"
                checked={visibleLayers.regimeMarkers}
                onCheckedChange={(checked) =>
                  setVisibleLayers({
                    ...visibleLayers,
                    regimeMarkers: !!checked,
                  })
                }
              />
              <Label htmlFor="regimeMarkers" className="text-sm cursor-pointer">
                Ленты режимов тяги
              </Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visio-like Object Palette - Right Sidebar с данными локомотива */}
      <VisioObjectPalette
        collapsed={paletteCollapsed}
        onToggleCollapse={() => setPaletteCollapsed(!paletteCollapsed)}
        selectedLocomotive={locomotive}
      />
    </div>
  );
}