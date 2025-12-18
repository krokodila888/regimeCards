import React, { useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Settings } from 'lucide-react';

// Заглушки для UI компонентов
const Button = ({ children, onClick, size, variant, title }: any) => (
  <button
    onClick={onClick}
    title={title}
    className={`px-3 py-1 rounded border ${
      variant === 'outline' ? 'border-gray-300 bg-white hover:bg-gray-50' : ''
    }`}
  >
    {children}
  </button>
);

const Dialog = ({ open, onOpenChange, children }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{backgroundColor: '#000000a1'}}>
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children }: any) => <>{children}</>;
const DialogHeader = ({ children }: any) => <div className="mb-4">{children}</div>;
const DialogTitle = ({ children }: any) => <h2 className="text-xl font-semibold mb-2">{children}</h2>;
const DialogDescription = ({ children }: any) => <p className="text-sm text-gray-600">{children}</p>;

const Checkbox = ({ id, checked, onCheckedChange, disabled }: any) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    disabled={disabled}
    className="w-4 h-4 rounded border-gray-300 disabled:opacity-50"
  />
);

const Label = ({ htmlFor, children, className }: any) => (
  <label htmlFor={htmlFor} className={className}>
    {children}
  </label>
);

interface CanvasScreenshotProps {
  imageUrl: string;
  imageNoTopUrl: string;
  imageNoBottomUrl: string;
  imageSpeedOnlyUrl: string;
  imageNoRegimesUrl: string;
  imageNoProfileUrl: string;
  imageNoTopNoRegimesUrl: string;
  imageNoTopNoProfileUrl: string;
}

export default function CanvasScreenshot({ 
  imageUrl, imageNoTopUrl,
  imageNoBottomUrl,
  imageSpeedOnlyUrl,
  imageNoRegimesUrl,
  imageNoProfileUrl,
  imageNoTopNoRegimesUrl,
  imageNoTopNoProfileUrl,
}: CanvasScreenshotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);

  // Процентные параметры областей изображения
  const GRADIENT_HEIGHT_PERCENT = 15; // Верхняя область (Динамика реализованная) - увеличено
  const REGIME_HEIGHT_PERCENT = 8;    // Средняя область (Ленты режимов тяги)
  const PROFILE_HEIGHT_PERCENT = 15;  // Нижняя область (Профиль пути)

  // Настройки отображения слоёв - три активных
  const [visibleLayers, setVisibleLayers] = useState({
    gradientCurve: true,   // Динамика реализованная (верхняя область)
    regimeMarkers: true,   // Ленты режимов тяги (средняя область)
    profileCurve: true,    // Профиль пути (нижняя область)
  });

  // Обработчик изменения Лент режимов тяги
  const handleRegimeMarkersChange = (checked: boolean) => {
    if (!checked) {
      // Отключаем и Ленты режимов, и Профиль пути
      setVisibleLayers({
        ...visibleLayers,
        regimeMarkers: false,
        //profileCurve: false,
      });
    } else {
        // Иначе просто включаем ленты режимов
        setVisibleLayers({
          ...visibleLayers,
          regimeMarkers: true,
        });
    }
  };

  // Обработчик изменения Профиля пути
  const handleProfileCurveChange = (checked: boolean) => {
    if (!checked) {
      // Отключаем профиль (ленты режимов остаются как есть)
      setVisibleLayers({
        ...visibleLayers,
        profileCurve: false,
      });
    } else {
      // Включаем профиль
      setVisibleLayers({
        ...visibleLayers,
        profileCurve: true,
      });
    }
  };

  // Вычисление параметров отображения на основе видимых слоёв
  const getDisplayParams = () => {
    let clipTop = 0;
    let clipBottom = 0;

    // Если скрыта динамика - обрезаем сверху
    if (!visibleLayers.gradientCurve) {
      clipTop = GRADIENT_HEIGHT_PERCENT;
    }
    
    // Если скрыты ленты режимов - обрезаем средне-нижнюю область
    if (!visibleLayers.regimeMarkers) {
      clipBottom += REGIME_HEIGHT_PERCENT;
    }

    // Если скрыт профиль - обрезаем самую нижнюю область
    if (!visibleLayers.profileCurve) {
      clipBottom += PROFILE_HEIGHT_PERCENT;
    }

    // Вычисляем оставшийся процент видимой высоты
    const visibleHeightPercent = 100 - clipTop - clipBottom;
    
    // Коэффициент масштабирования по Y для заполнения контейнера
    const scaleY = 100 / visibleHeightPercent;

    return {
      clipTop,
      clipBottom,
      scaleY,
      // Смещение для компенсации обрезанной верхней части
      translateY: -clipTop
    };
  };

  const displayParams = getDisplayParams();

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
      <div className="bg-white rounded-lg shadow-sm p-6 flex-1 flex flex-col overflow-hidden">
        
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
          <div className="flex items-center gap-4 mt-2">
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
          <div style={{ paddingLeft: 10 }} className="mt-2">
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
            marginTop: 50,
            cursor: isDragging ? 'grabbing' : 'grab',
            height: 'auto !important',
            overflowY: 'hidden'

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
              //minHeight: '100%',
              position: 'relative',
              height: '100%',
              overflowY: 'hidden'
            }}
          >
            {/* Изображение с динамическим масштабированием */}
            <img
              ref={imageRef}
              src={visibleLayers.gradientCurve && visibleLayers.profileCurve && visibleLayers.regimeMarkers ? imageUrl 
                : visibleLayers.regimeMarkers && visibleLayers.profileCurve && !visibleLayers.gradientCurve ? imageNoTopUrl
                : visibleLayers.regimeMarkers && !visibleLayers.profileCurve && !visibleLayers.gradientCurve ? imageNoTopNoProfileUrl
                : !visibleLayers.regimeMarkers && visibleLayers.profileCurve && !visibleLayers.gradientCurve ? imageNoTopNoRegimesUrl
                : !visibleLayers.regimeMarkers && !visibleLayers.profileCurve && !visibleLayers.gradientCurve ? imageNoBottomUrl
                : !visibleLayers.regimeMarkers && !visibleLayers.profileCurve && !visibleLayers.gradientCurve ? imageSpeedOnlyUrl
                : !visibleLayers.regimeMarkers && visibleLayers.profileCurve && visibleLayers.gradientCurve ? imageNoRegimesUrl
                : visibleLayers.regimeMarkers && !visibleLayers.profileCurve && visibleLayers.gradientCurve ? imageNoProfileUrl : imageUrl}
              alt="Режимная карта"
              onLoad={() => setImageLoaded(true)}
              style={{
                display: 'block',
                // Масштабируем высоту, чтобы заполнить контейнер после обрезки
                height: `${100/* * displayParams.scaleY*/}%`,
                width: 'auto',
                // Применяем горизонтальный zoom и вертикальное смещение
                /*transform: `scaleX(${zoom}) translateY(${displayParams.translateY}%)`,*/
                transformOrigin: 'left top',
                transition: isDragging ? 'none' : 'transform 0.3s ease-out, height 0.3s ease-out',
                userSelect: 'none',
                pointerEvents: 'none',
                maxWidth: "fit-content",
                objectFit: 'cover',
                objectPosition: 'left top'
              }}
            />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройки отображения</DialogTitle>
            <DialogDescription>
              Выберите элементы для отображения на холсте
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Активные чекбоксы */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="gradientCurve"
                checked={visibleLayers.gradientCurve}
                onCheckedChange={(checked: boolean) =>
                  setVisibleLayers({
                    ...visibleLayers,
                    gradientCurve: checked,
                  })
                }
              />
              <Label htmlFor="gradientCurve" className="text-sm cursor-pointer">
                Динамика реализованная
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="regimeMarkers"
                checked={visibleLayers.regimeMarkers}
                onCheckedChange={handleRegimeMarkersChange}
              />
              <Label htmlFor="regimeMarkers" className="text-sm cursor-pointer">
                Ленты режимов тяги
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="profileCurve"
                checked={visibleLayers.profileCurve}
                onCheckedChange={handleProfileCurveChange}
                disabled={!visibleLayers.regimeMarkers}
              />
              <Label 
                htmlFor="profileCurve" 
                className={`text-sm ${!visibleLayers.regimeMarkers ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                Профиль пути
              </Label>
            </div>

            {/* Заблокированные чекбоксы */}
            <div className="flex items-center space-x-3 opacity-50">
              <Checkbox
                id="limitCurve"
                checked={true}
                disabled={true}
              />
              <Label htmlFor="limitCurve" className="text-sm cursor-not-allowed">
                Ограничения скорости
              </Label>
            </div>

            <div className="flex items-center space-x-3 opacity-50">
              <Checkbox
                id="speedCurve"
                checked={true}
                disabled={true}
              />
              <Label htmlFor="speedCurve" className="text-sm cursor-not-allowed">
                Кривая скорости
              </Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}