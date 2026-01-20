import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ZoomIn, ZoomOut, Settings } from 'lucide-react';
import React, { useRef, useState, useEffect, useCallback } from 'react';
// Color conversion helpers: convert CSS oklch(...) to sRGB rgb(...) to prevent html2canvas parsing errors
function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function oklabToLinearSRGB(L: number, a: number, b: number) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return [r, g, bl];
}

function linearToSRGBChannel(c: number) {
  if (c <= 0.0031308) return 12.92 * c;
  return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function oklchCssToRgb(css: string): string | null {
  try {
    const inside = css.substring(css.indexOf('(') + 1, css.lastIndexOf(')'));
    const parts = inside.split('/')[0].trim().split(/\s+/);
    if (parts.length < 3) return null;
    let Lstr = parts[0];
    let Cstr = parts[1];
    let Hstr = parts[2];

    const L = Lstr.includes('%') ? parseFloat(Lstr) / 100 : parseFloat(Lstr);
    const C = parseFloat(Cstr);
    const H = Hstr.endsWith('deg') ? parseFloat(Hstr) : parseFloat(Hstr);

    const hr = (H * Math.PI) / 180;
    const a = C * Math.cos(hr);
    const b = C * Math.sin(hr);

    const [rLin, gLin, bLin] = oklabToLinearSRGB(L, a, b);
    const r = clamp01(linearToSRGBChannel(rLin));
    const g = clamp01(linearToSRGBChannel(gLin));
    const bl = clamp01(linearToSRGBChannel(bLin));

    const R = Math.round(r * 255);
    const G = Math.round(g * 255);
    const B = Math.round(bl * 255);
    return `rgb(${R}, ${G}, ${B})`;
  } catch (e) {
    return null;
  }
}

// Collect custom properties declared in same-origin stylesheets into a map
function collectCustomProperties(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules || [];
      for (const rule of Array.from(rules)) {
        // Only CSSStyleRule and CSSStyleDeclaration-like rules have .style
        // @ts-ignore
        const style = rule.style;
        if (!style) continue;
        for (let i = 0; i < style.length; i++) {
          const name = style.item(i);
          if (name && name.startsWith('--')) {
            const val = style.getPropertyValue(name).trim();
            if (val) map[name] = val;
          }
        }
      }
    } catch (e) {
      // skip cross-origin stylesheets
      continue;
    }
  }
  return map;
}

// Replace any oklch/oklab(...) occurrences in a CSS value string with rgb(...) via converter
function replaceOklchInString(v: string): string {
  const regex = /(oklch\([^)]*\))|(oklab\([^)]*\))/g;
  return v.replace(regex, (match) => {
    const conv = oklchCssToRgb(match);
    return conv || match;
  });
}

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCurrentChartData } from '../store/workflowSlice';
import { ChartData } from '../types/chart-data';
import type { TrackBounds, PlacedObject, layers } from '../types/types';

import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { getPaletteObjectById } from '@/utils/visioObjectPaletteUtils';

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПРЕОБРАЗОВАНИЯ КООРДИНАТ
// ============================================================================

/**
 * Преобразование позиции X в пикселях в километровую отметку
 * Учитывает отступы на изображении и ОБРАТНЫЙ порядок координат
 */
function pixelsToKilometers(
  pixelX: number,
  bounds: TrackBounds,
  marginLeft: number,
  marginRight: number
): number {
  const { startKm, endKm, imageWidth } = bounds;

  // Вычисляем область с координатной шкалой
  const totalImageKm = Math.abs(endKm - startKm) + marginLeft + marginRight;
  const scaleStartPx = (marginLeft / totalImageKm) * imageWidth;
  const scaleEndPx = imageWidth - (marginRight / totalImageKm) * imageWidth;
  const scaleWidthPx = scaleEndPx - scaleStartPx;

  // Если клик в отступе - возвращаем ближайшую границу
  if (pixelX < scaleStartPx) {
    return startKm;
  }
  if (pixelX > scaleEndPx) {
    return endKm;
  }

  // Преобразуем позицию в координату (ОБРАТНЫЙ отсчет!)
  const positionInScale = (pixelX - scaleStartPx) / scaleWidthPx; // 0..1
  const km = startKm - positionInScale * Math.abs(startKm - endKm);

  // Округляем до 1 знака после запятой
  return Math.round(km * 10) / 10;
}

/**
 * Преобразование километровой отметки в позицию X в пикселях
 */
export function kilometersToPixels(
  km: number,
  bounds: TrackBounds,
  marginLeft: number,
  marginRight: number
): number {
  const { startKm, endKm, imageWidth } = bounds;

  // Вычисляем область с координатной шкалой
  const totalImageKm = Math.abs(endKm - startKm) + marginLeft + marginRight;
  const scaleStartPx = (marginLeft / totalImageKm) * imageWidth;
  const scaleEndPx = imageWidth - (marginRight / totalImageKm) * imageWidth;
  const scaleWidthPx = scaleEndPx - scaleStartPx;

  // Преобразуем километр в позицию (ОБРАТНЫЙ отсчет!)
  const kmRange = Math.abs(startKm - endKm);
  const positionInScale = (startKm - km) / kmRange; // 0..1

  return scaleStartPx + positionInScale * scaleWidthPx;
}

// ============================================================================
// КОМПОНЕНТ
// ============================================================================

interface CanvasScreenshotProps {
  imageUrl: string;
  imageNoTopUrl: string;
  imageNoBottomUrl: string;
  imageSpeedOnlyUrl: string;
  imageNoRegimesUrl: string;
  imageNoProfileUrl: string;
  imageNoTopNoRegimesUrl: string;
  imageNoTopNoProfileUrl: string;
  imageOptUrl: string;
  imageOptNoTopUrl: string;
  imageOptNoBottomUrl: string;
  imageOptSpeedOnlyUrl: string;
  imageOptNoRegimesUrl: string;
  imageOptNoProfileUrl: string;
  imageOptNoTopNoRegimesUrl: string;
  imageOptNoTopNoProfileUrl: string;
  imageRealUrl: string;
  imageRealNoTopUrl: string;
  imageRealNoBottomUrl: string;
  imageRealSpeedOnlyUrl: string;
  imageRealNoRegimesUrl: string;
  imageRealNoProfileUrl: string;
  imageRealNoTopNoRegimesUrl: string;
  imageRealNoTopNoProfileUrl: string;
  imageDemaEmptyProfile: string;
  placedObjects: PlacedObject[];
  onPlacedObjectsChange: (objects: PlacedObject[]) => void;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  visibleLayers: layers;
  setVisibleLayers: React.Dispatch<React.SetStateAction<layers>>;
  chosenAction: string;
  emptyField: string;
  demaStartWithBoardsNoProfile: string;
  demaStartWithBoardsAndProfile: string;
  activeChart: ChartData;
  availableLayers: layers;
  setAvailableLayers: React.Dispatch<React.SetStateAction<layers>>;
}

export default function CanvasScreenshot({
  imageUrl,
  imageNoTopUrl,
  imageNoBottomUrl,
  imageSpeedOnlyUrl,
  imageNoRegimesUrl,
  imageNoProfileUrl,
  imageNoTopNoRegimesUrl,
  imageNoTopNoProfileUrl,
  imageOptUrl,
  imageOptNoTopUrl,
  imageOptNoBottomUrl,
  imageOptSpeedOnlyUrl,
  imageOptNoRegimesUrl,
  imageOptNoProfileUrl,
  imageOptNoTopNoRegimesUrl,
  imageOptNoTopNoProfileUrl,
  imageRealUrl,
  imageRealNoTopUrl,
  imageRealNoBottomUrl,
  imageRealSpeedOnlyUrl,
  imageRealNoRegimesUrl,
  imageRealNoProfileUrl,
  imageRealNoTopNoRegimesUrl,
  imageRealNoTopNoProfileUrl,
  imageDemaEmptyProfile,
  placedObjects,
  onPlacedObjectsChange,
  selectedObjectId,
  onSelectObject,
  visibleLayers,
  setVisibleLayers,
  chosenAction,
  emptyField,
  demaStartWithBoardsNoProfile,
  demaStartWithBoardsAndProfile,
  activeChart,
  availableLayers,
  setAvailableLayers,
}: CanvasScreenshotProps): JSX.Element {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const storeChart = useAppSelector((s) => s.workflow.currentChartData);
  const chart = activeChart ?? storeChart;

  useEffect(() => {
    const win = window as unknown as {
      __exportCanvasScreenshotToPdf?: (filename?: string) => Promise<void> | undefined;
    };

    win.__exportCanvasScreenshotToPdf = async (filename = 'screenshot.pdf') => {
      try {
        const img = imageRef.current;
        const container = containerRef.current;
        if (!img || !container) throw new Error('Image or container not available');

        console.log('[PDF Export] 🚀 Начало экспорта PDF...');

        // Используем естественные размеры изображения
        const imgNaturalWidth = img.naturalWidth;
        const imgNaturalHeight = img.naturalHeight;

        console.log('[PDF Export] 📐 Размеры:', {
          natural: `${imgNaturalWidth}x${imgNaturalHeight}`,
          client: `${img.clientWidth}x${img.clientHeight}`,
          placedObjects: placedObjects.length,
        });

        // ================================================================
        // СОЗДАНИЕ CANVAS С ИЗОБРАЖЕНИЕМ И ИКОНКАМИ
        // ================================================================
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = imgNaturalWidth;
        fullCanvas.height = imgNaturalHeight;

        const ctx = fullCanvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');

        // Рисуем базовое изображение
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, fullCanvas.width, fullCanvas.height);
        ctx.drawImage(img, 0, 0, imgNaturalWidth, imgNaturalHeight);

        console.log('[PDF Export] 🎨 Отрисовка иконок...');

        // Рисуем размещенные иконки
        const scaleX = imgNaturalWidth / img.clientWidth;
        const scaleY = imgNaturalHeight / img.clientHeight;

        for (const obj of placedObjects) {
          try {
            // Масштабируем позицию и размер иконки
            const x = obj.position.x * scaleX;
            const y = obj.position.y * scaleY;
            
            const fullObject = getPaletteObjectById(obj.objectType.id);
            const canvasIcon = fullObject?.canvasIcon || fullObject?.icon || obj.objectType.icon;
            
            const isRectangularIcon =
              obj.objectType.id === 'neutral-insert' || obj.objectType.id === 'auto-brake-test';
            
            const iconSize = obj.iconSize || getIconSize();
            const baseIconWidth = (isRectangularIcon ? getRectangularIconWidth() : iconSize) * scaleX;
            const baseIconHeight = (isRectangularIcon ? getRectangularIconHeight() : iconSize) * scaleY;
            
            // Создаем временный div для рендеринга React-элемента в SVG
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-99999px';
            tempDiv.style.width = `${baseIconWidth}px`;
            tempDiv.style.height = `${baseIconHeight}px`;
            document.body.appendChild(tempDiv);

            // Рендерим иконку
            const iconElement = React.cloneElement(canvasIcon as React.ReactElement, {
              style: { width: '100%', height: '100%' },
            });
            
            const root = (await import('react-dom/client')).createRoot(tempDiv);
            await new Promise<void>((resolve) => {
              root.render(iconElement);
              setTimeout(resolve, 50);
            });

            // Конвертируем SVG в изображение
            const svgElement = tempDiv.querySelector('svg');
            if (svgElement) {
              // Получаем оригинальные размеры SVG из viewBox или атрибутов
              const viewBox = svgElement.getAttribute('viewBox');
              let svgAspectRatio = 1;
              
              if (viewBox) {
                const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
                svgAspectRatio = vbWidth / vbHeight;
              } else {
                const svgWidth = parseFloat(svgElement.getAttribute('width') || '1');
                const svgHeight = parseFloat(svgElement.getAttribute('height') || '1');
                svgAspectRatio = svgWidth / svgHeight;
              }

              // Вычисляем финальные размеры с сохранением пропорций
              let finalIconWidth = baseIconWidth;
              let finalIconHeight = baseIconHeight;

              if (svgAspectRatio > 1) {
                // Широкая иконка
                finalIconHeight = baseIconWidth / svgAspectRatio;
              } else if (svgAspectRatio < 1) {
                // Высокая иконка
                finalIconWidth = baseIconHeight * svgAspectRatio;
              }

              // Клонируем SVG для модификации
              const svgClone = svgElement.cloneNode(true) as SVGElement;
              
              // Получаем computed color из className (например, text-red-600)
              const computedColor = window.getComputedStyle(svgElement).color;
              
              // Заменяем currentColor на конкретный цвет во всех элементах
              const replaceCurrentColor = (element: Element) => {
                ['stroke', 'fill'].forEach(attr => {
                  if (element.getAttribute(attr) === 'currentColor') {
                    element.setAttribute(attr, computedColor);
                  }
                });
                Array.from(element.children).forEach(child => replaceCurrentColor(child));
              };
              
              replaceCurrentColor(svgClone);

              const svgData = new XMLSerializer().serializeToString(svgClone);
              const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
              const url = URL.createObjectURL(svgBlob);
              
              const iconImg = new Image();
              await new Promise<void>((resolve, reject) => {
                iconImg.onload = () => resolve();
                iconImg.onerror = reject;
                iconImg.src = url;
              });

              // Рисуем иконку на canvas с правильными пропорциями (центрируем по x, y)
              ctx.drawImage(iconImg, x - finalIconWidth / 2, y - finalIconHeight / 2, finalIconWidth, finalIconHeight);
              
              URL.revokeObjectURL(url);
            }

            root.unmount();
            document.body.removeChild(tempDiv);

            // Рисуем дополнительную ножку если нужна
            const extraLegHeight = getExtraLegHeight() * scaleY;
            if (extraLegHeight > 0) {
              const legWidth = Math.max(1.5, iconSize * 0.06) * scaleX;
              ctx.fillStyle = '#000';
              ctx.fillRect(x - legWidth / 2, y + baseIconHeight / 2, legWidth, extraLegHeight);
            }

            // Рисуем название станции
            const isStation = obj.objectType.id === 'station';
            if (isStation && obj.stationName) {
              ctx.fillStyle = '#000';
              ctx.font = `bold ${iconSize * 0.36 * scaleY}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.fillText(obj.stationName, x, y - baseIconHeight / 2 - 5 * scaleY);
            }
          } catch (err) {
            console.error('[PDF Export] ⚠️ Ошибка при отрисовке иконки:', obj.objectType.id, err);
          }
        }

        console.log('[PDF Export] ✅ Все иконки отрисованы');

        // ================================================================
        // ГЕНЕРАЦИЯ PDF
        // ================================================================
        const pdf = new jsPDF({
          unit: 'px',
          format: 'a4',
          orientation: 'landscape',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const availableHeight = pageHeight - margin * 2;
        const availableWidth = pageWidth - margin * 2;

        // Масштабируем по высоте
        const scale = availableHeight / imgNaturalHeight;
        const scaledWidth = imgNaturalWidth * scale;

        // Название участка
        const trackSectionName =
          chart?.workflow?.trackSection?.name ??
          (typeof chart?.workflow?.trackSection === 'string' ||
          typeof chart?.workflow?.trackSection === 'number'
            ? String(chart?.workflow?.trackSection)
            : undefined);

        const headerPx = trackSectionName ? 24 : 0;

        // ================================================================
        // ОДНОСТРАНИЧНЫЙ PDF (если помещается)
        // ================================================================
        if (scaledWidth <= availableWidth) {
          const canvasWithHeader = document.createElement('canvas');
          canvasWithHeader.width = fullCanvas.width;
          canvasWithHeader.height = fullCanvas.height + headerPx;

          const ctxHeader = canvasWithHeader.getContext('2d');
          if (!ctxHeader) throw new Error('Failed to get canvas context');

          ctxHeader.fillStyle = '#ffffff';
          ctxHeader.fillRect(0, 0, canvasWithHeader.width, canvasWithHeader.height);

          if (trackSectionName) {
            ctxHeader.fillStyle = '#000000';
            ctxHeader.font = '16px sans-serif';
            ctxHeader.fillText(trackSectionName, 8, 16);
          }

          ctxHeader.drawImage(fullCanvas, 0, headerPx);

          const imgData = canvasWithHeader.toDataURL('image/png', 1.0);
          const drawW = canvasWithHeader.width * scale;
          const drawH = canvasWithHeader.height * scale;
          const x = margin + (availableWidth - drawW) / 2;

          pdf.addImage(imgData, 'PNG', x, margin, drawW, drawH);
          pdf.setFontSize(10);
          pdf.text('Page 1 of 1', pageWidth / 2, pageHeight - margin / 2, { align: 'center' });

          pdf.save(filename);
          console.log('[PDF Export] ✅ Single page exported');
          return;
        }

        // ================================================================
        // МНОГОСТРАНИЧНЫЙ PDF (с перекрытием 20%)
        // ================================================================
        const overlapPercent = 0.2;
        const cropWidthPx = availableWidth / scale;
        const overlapPx = cropWidthPx * overlapPercent;
        const stepPx = cropWidthPx - overlapPx;
        const pages = Math.ceil((imgNaturalWidth - cropWidthPx) / stepPx) + 1;

        console.log('[PDF Export] 📄 Многостраничный экспорт:', {
          pages,
          totalWidth: imgNaturalWidth,
          cropWidth: Math.round(cropWidthPx),
          overlap: Math.round(overlapPx),
          step: Math.round(stepPx),
        });

        for (let i = 0; i < pages; i++) {
          const sx = Math.round(i * stepPx);
          let sw = Math.round(cropWidthPx);

          // Последняя страница - до конца
          if (sx + sw > imgNaturalWidth) {
            sw = imgNaturalWidth - sx;
          }

          // Создаём canvas для фрагмента
          const pageCanvas = document.createElement('canvas');
          const finalHeight = imgNaturalHeight + (i === 0 && trackSectionName ? headerPx : 0);
          pageCanvas.width = sw;
          pageCanvas.height = finalHeight;

          const pageCtx = pageCanvas.getContext('2d');
          if (!pageCtx) throw new Error('Failed to get canvas context');

          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

          // Первая страница - с заголовком
          if (i === 0 && trackSectionName) {
            pageCtx.fillStyle = '#000000';
            pageCtx.font = '16px sans-serif';
            pageCtx.fillText(trackSectionName, 8, 16);
            pageCtx.drawImage(fullCanvas, sx, 0, sw, imgNaturalHeight, 0, headerPx, sw, imgNaturalHeight);
          } else {
            pageCtx.drawImage(fullCanvas, sx, 0, sw, imgNaturalHeight, 0, 0, sw, imgNaturalHeight);
          }

          if (i > 0) pdf.addPage();

          const imgData = pageCanvas.toDataURL('image/png', 1.0);
          const drawW = sw * scale;
          const drawH = finalHeight * scale;
          const x = margin + (availableWidth - drawW) / 2;

          pdf.addImage(imgData, 'PNG', x, margin, drawW, drawH);

          // Номер страницы
          pdf.setFontSize(10);
          pdf.text(`Page ${i + 1} of ${pages}`, pageWidth / 2, pageHeight - margin / 2, {
            align: 'center',
          });
        }

        pdf.save(filename);
        console.log(`[PDF Export] ✅ Экспортировано ${pages} страниц: ${filename}`);
      } catch (err) {
        console.error('[PDF Export] ❌ Ошибка экспорта:', err);
        alert('Не удалось экспортировать PDF. Проверьте консоль для деталей.');
        throw err;
      }
    };

    return () => {
      try {
        win.__exportCanvasScreenshotToPdf = undefined;
      } catch {
        /* ignore */
      }
    };
  }, [imageRef, containerRef, chart, placedObjects, visibleLayers]);

  const [zoom, setZoom] = useState(1);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);

  // Состояние для перетаскивания объектов
  const [draggingObjectId, setDraggingObjectId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);

  // ========================================================================
  // ПАРАМЕТРЫ УЧАСТКА И КООРДИНАТ
  // ========================================================================

  // ВАЖНО: На скрине координаты идут ОБРАТНО - слева больше, справа меньше
  const TRACK_BOUNDS: TrackBounds = {
    startKm: 1782, // Левый край (начало)
    endKm: 1611, // Правый край (конец)
    imageWidth: 0, // Будет установлено после загрузки изображения
  };

  // Отступы на изображении (в километрах)
  const MARGIN_LEFT_KM = 1.3; // Отступ слева до начала шкалы
  const MARGIN_RIGHT_KM = 0.19; // Отступ справа после конца шкалы

  // Обновляем ширину изображения после загрузки
  useEffect(() => {
    if (imageLoaded && imageRef.current) {
      TRACK_BOUNDS.imageWidth = imageRef.current.naturalWidth;
    }
  }, [imageLoaded]);

  // Процентные параметры высоты для разных комбинаций слоев
  // Рассчитано на основе реальных размеров изображений
  const PLACEMENT_HEIGHT_CONFIGS = {
    // gradientCurve, regimeMarkers, profileCurve
    true_true_true: 72.5, // Все слои видны: 714/967
    false_true_true: 64.3, // Без верхнего слоя: 497/752
    false_true_false: 79.2, // Без верхнего и профиля: 497/611
    false_false_true: 74.3, // Без верхнего и режимов: 497/651
    true_false_false: 95.9, // Без профиля и режимов: 712/731
    false_false_false: 93.8, // Только скорость: 497/516
    true_false_true: 80.6, // Без режимов: 712/871
    true_true_false: 84.8, // Без профиля: 712/828
  };

  const PLACEMENT_ICON_RATIO_CONFIGS = {
    // Формула: (22 / высота_холста) × 100%
    true_true_true: 2.8, // (22 / 967) × 100 = 2.276% ≈ 2.28%
    false_true_true: 3.6, // (22 / 752) × 100 = 2.926% ≈ 2.93%
    false_true_false: 4.7, // (22 / 601) × 100 = 3.661% ≈ 3.66%
    false_false_true: 4.4, // (22 / 651) × 100 = 3.380% ≈ 3.38%
    true_false_false: 3.8, // (22 / 731) × 100 = 3.010% ≈ 3.01%
    false_false_false: 5.2, // (22 / 511) × 100 = 4.305% ≈ 4.31%
    true_false_true: 3.4, // (22 / 871) × 100 = 2.526% ≈ 2.53%
    true_true_false: 3.5, // (22 / 828) × 100 = 2.657% ≈ 2.66%
  };

  const RECTANGULAR_ICON_WIDTH_RATIO_CONFIGS = {
    // Ширина прямоугольных иконок (нейтральная вставка, место проверки тормозов)
    // Формула: (ширина_иконки / высота_холста) × 100%
    // Подгоните эти значения вручную для каждой комбинации
    true_true_true: 4.5, // Подгонка под вашу картинку
    false_true_true: 6.2, // Подгонка под вашу картинку
    false_true_false: 7.7, // Подгонка под вашу картинку
    false_false_true: 5.9, // Подгонка под вашу картинку
    true_false_false: 5.6, // Подгонка под вашу картинку
    false_false_false: 6.4, // Подгонка под вашу картинку
    true_false_true: 5.2, // Подгонка под вашу картинку
    true_true_false: 5.3, // Подгонка под вашу картинку
  };

  const RECTANGULAR_ICON_HEIGHT_RATIO_CONFIGS = {
    // Высота прямоугольных иконок (нейтральная вставка, место проверки тормозов)
    // Формула: (высота_иконки / высота_холста) × 100%
    // Подгоните эти значения вручную для каждой комбинации
    true_true_true: 4.8, // Подгонка под вашу картинку
    false_true_true: 3.4, // Подгонка под вашу картинку
    false_true_false: 3.9, // Подгонка под вашу картинку
    false_false_true: 3.9, // Подгонка под вашу картинку
    true_false_false: 3.6, // Подгонка под вашу картинку
    false_false_false: 5.7, // Подгонка под вашу картинку
    true_false_true: 3.6, // Подгонка под вашу картинку
    true_true_false: 3.7, // Подгонка под вашу картинку
  };

  const EXTRA_LEG_HEIGHT_CONFIGS = {
    // Дополнительная высота ножки в процентах от высоты изображения
    // Формула: (желаемая_высота_ножки / высота_холста) × 100%
    // Подгоните эти значения вручную для каждой комбинации
    true_true_true: 0.2, // Нет дополнительной ножки
    false_true_true: 0.3, // Нет дополнительной ножки
    false_true_false: 0.4, // 0.5% от высоты изображения
    false_false_true: 0.4, // 0.5% от высоты изображения
    true_false_false: 0.3, // 0.3% от высоты изображения
    false_false_false: 0.4, // 1.0% от высоты изображения
    true_false_true: 0.1, // 0.2% от высоты изображения
    true_true_false: 0.2, // 0.2% от высоты изображения
  };

  /*const [visibleLayers, setVisibleLayers] = useState({
    gradientCurve: true,
    regimeMarkers: true,
    profileCurve: true,
    optSpeedCurve: true,
    regimes2: false,
  });*/

  // ========================================================================
  // ОБРАБОТЧИКИ СОБЫТИЙ
  // ========================================================================

  // Вычисление позиции Y для размещения объектов на основе видимых слоев
  const getObjectPlacementY = () => {
    if (!imageRef.current) return 0;
    const imageHeight = imageRef.current.clientHeight;

    const { gradientCurve, regimeMarkers, profileCurve } = visibleLayers;
    const configKey = `${gradientCurve}_${regimeMarkers}_${profileCurve}`;
    const heightPercent =
      PLACEMENT_HEIGHT_CONFIGS[configKey as keyof typeof PLACEMENT_HEIGHT_CONFIGS] || 73.8;
    return imageHeight * (heightPercent / 100);
  };

  // Вычисление размера иконки на основе видимых слоев
  const getIconSize = () => {
    if (!imageRef.current) return 22;
    const imageHeight = imageRef.current.clientHeight;

    const { gradientCurve, regimeMarkers, profileCurve } = visibleLayers;
    const configKey = `${gradientCurve}_${regimeMarkers}_${profileCurve}`;
    const iconSizePercent =
      PLACEMENT_ICON_RATIO_CONFIGS[configKey as keyof typeof PLACEMENT_ICON_RATIO_CONFIGS] || 2.28;

    return (imageHeight * iconSizePercent) / 100;
  };

  // Вычисление ширины прямоугольной иконки на основе видимых слоев
  const getRectangularIconWidth = () => {
    if (!imageRef.current) return 29;
    const imageHeight = imageRef.current.clientHeight;

    const { gradientCurve, regimeMarkers, profileCurve } = visibleLayers;
    const configKey = `${gradientCurve}_${regimeMarkers}_${profileCurve}`;
    const widthPercent =
      RECTANGULAR_ICON_WIDTH_RATIO_CONFIGS[
        configKey as keyof typeof RECTANGULAR_ICON_WIDTH_RATIO_CONFIGS
      ] || 3.5;

    return (imageHeight * widthPercent) / 100;
  };

  // Вычисление высоты прямоугольной иконки на основе видимых слоев
  const getRectangularIconHeight = () => {
    if (!imageRef.current) return 21;
    const imageHeight = imageRef.current.clientHeight;

    const { gradientCurve, regimeMarkers, profileCurve } = visibleLayers;
    const configKey = `${gradientCurve}_${regimeMarkers}_${profileCurve}`;
    const heightPercent =
      RECTANGULAR_ICON_HEIGHT_RATIO_CONFIGS[
        configKey as keyof typeof RECTANGULAR_ICON_HEIGHT_RATIO_CONFIGS
      ] || 2.2;

    return (imageHeight * heightPercent) / 100;
  };

  // Вычисление высоты дополнительной ножки на основе видимых слоев
  const getExtraLegHeight = () => {
    if (!imageRef.current) return 0;
    const imageHeight = imageRef.current.clientHeight;

    const { gradientCurve, regimeMarkers, profileCurve } = visibleLayers;
    const configKey = `${gradientCurve}_${regimeMarkers}_${profileCurve}`;
    const extraLegPercent =
      EXTRA_LEG_HEIGHT_CONFIGS[configKey as keyof typeof EXTRA_LEG_HEIGHT_CONFIGS] || 0;

    return (imageHeight * extraLegPercent) / 100;
  };

  // Синхронизация позиций объектов при изменении видимых слоев или загрузке изображения
  useEffect(() => {
    if (!imageRef.current || !imageLoaded || placedObjects.length === 0) return;

    const newY = getObjectPlacementY();
    const newIconSize = getIconSize();
    const imageWidth = imageRef.current.naturalWidth;

    // Обновляем Y-позиции всех объектов и пересчитываем X из координат
    const updatedObjects = placedObjects.map((obj) => {
      const newX = kilometersToPixels(
        obj.coordinate,
        { ...TRACK_BOUNDS, imageWidth },
        MARGIN_LEFT_KM,
        MARGIN_RIGHT_KM
      );

      // Для прямоугольных иконок не сохраняем iconSize, они вычисляются динамически
      const isRectangularIcon =
        obj.objectType.id === 'neutral-insert' || obj.objectType.id === 'auto-brake-test';

      return {
        ...obj,
        position: { x: newX, y: newY },
        iconSize: isRectangularIcon ? undefined : newIconSize,
      };
    });

    onPlacedObjectsChange(updatedObjects);
  }, [visibleLayers, imageLoaded]);

  // Отдельный useEffect для синхронизации позиций при изменении координат
  useEffect(() => {
    if (!imageRef.current || !imageLoaded || placedObjects.length === 0) return;

    const imageWidth = imageRef.current.naturalWidth;
    const currentY = getObjectPlacementY();
    const currentIconSize = getIconSize();
    let needsUpdate = false;

    // Проверяем, нужно ли обновить позиции X на основе координат
    const updatedObjects = placedObjects.map((obj) => {
      const expectedX = kilometersToPixels(
        obj.coordinate,
        { ...TRACK_BOUNDS, imageWidth },
        MARGIN_LEFT_KM,
        MARGIN_RIGHT_KM
      );

      // Проверяем, отличается ли текущая позиция от ожидаемой
      if (Math.abs(obj.position.x - expectedX) > 1) {
        needsUpdate = true;

        // Для прямоугольных иконок не сохраняем iconSize
        const isRectangularIcon =
          obj.objectType.id === 'neutral-insert' || obj.objectType.id === 'auto-brake-test';

        return {
          ...obj,
          position: { x: expectedX, y: currentY },
          iconSize: isRectangularIcon ? undefined : currentIconSize,
        };
      }
      return obj;
    });

    // Обновляем только если действительно нужно
    if (needsUpdate) {
      onPlacedObjectsChange(updatedObjects);
    }
  }, [placedObjects.map((obj) => obj.coordinate).join(','), imageLoaded]);

  // Обработчик drop для размещения объекта из палитры
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!imageRef.current || !containerRef.current) return;

    try {
      const objectId = e.dataTransfer.getData('application/x-palette-object-id');
      const objectDataJson = e.dataTransfer.getData('application/x-palette-object-data');

      if (!objectId || !objectDataJson) {
        console.error('No object data in drop event');
        return;
      }

      const objectData = JSON.parse(objectDataJson);

      // Получаем полный объект с иконками из палитры
      const fullObjectData = getPaletteObjectById(objectId);

      // Получаем позицию относительно изображения
      const rect = imageRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;

      const x = e.clientX - rect.left + scrollLeft;
      const y = getObjectPlacementY();

      // Преобразуем X в километры с учетом отступов
      const coordinate = pixelsToKilometers(
        x,
        { ...TRACK_BOUNDS, imageWidth: imageRef.current.naturalWidth },
        MARGIN_LEFT_KM,
        MARGIN_RIGHT_KM
      );

      // Создаем новый размещенный объект
      const isRectangularIcon = objectId === 'neutral-insert' || objectId === 'auto-brake-test';

      const newObject: PlacedObject = {
        id: `placed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        objectType: fullObjectData || objectData,
        coordinate,
        position: { x, y },
        iconSize: isRectangularIcon ? undefined : getIconSize(),
      };

      onPlacedObjectsChange([...placedObjects, newObject]);
      onSelectObject(newObject.id);
    } catch (error) {
      console.error('Error placing object:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Обработчик начала перетаскивания размещенного объекта
  const handleObjectMouseDown = (e: React.MouseEvent, objectId: string) => {
    e.stopPropagation();

    const object = placedObjects.find((obj) => obj.id === objectId);
    if (!object || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - object.position.x;

    setDraggingObjectId(objectId);
    setDragOffset({ x: offsetX, y: 0 });
    onSelectObject(objectId);
  };

  // Обработчик движения мыши (для перетаскивания объектов и канваса)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingObjectId && imageRef.current && containerRef.current) {
      e.preventDefault();

      const rect = imageRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;

      let newX = e.clientX - rect.left - dragOffset.x + scrollLeft;

      // Ограничиваем перемещение в пределах изображения
      newX = Math.max(0, Math.min(newX, imageRef.current.naturalWidth));

      // Обновляем позицию и координату объекта
      const updatedObjects = placedObjects.map((obj) => {
        if (obj.id === draggingObjectId) {
          const newCoordinate = pixelsToKilometers(
            newX,
            { ...TRACK_BOUNDS, imageWidth: imageRef.current!.naturalWidth },
            MARGIN_LEFT_KM,
            MARGIN_RIGHT_KM
          );

          return {
            ...obj,
            position: { ...obj.position, x: newX },
            coordinate: newCoordinate,
          };
        }
        return obj;
      });

      onPlacedObjectsChange(updatedObjects);
    } else if (isDraggingCanvas && containerRef.current) {
      const newScrollX = dragStartX - e.clientX;
      containerRef.current.scrollLeft = newScrollX;
    }
  };

  const handleMouseUp = () => {
    setDraggingObjectId(null);
    setIsDraggingCanvas(false);
  };

  // Обработчик клика по канвасу (для снятия выделения)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || draggingObjectId) return;
    setIsDraggingCanvas(true);
    setDragStartX(e.clientX + containerRef.current.scrollLeft);
    onSelectObject(null);
    e.preventDefault();
  };

  const handleResetZoom = () => {
    setZoom(1);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    containerRef.current.scrollLeft += e.deltaY;
  };
  // Получение текущего изображения на основе видимых слоёв
  const getCurrentImage = useCallback(() => {
    const { gradientCurve, regimeMarkers, profileCurve, optSpeedCurve, regimes2, borders } =
      visibleLayers;
    if (
      chosenAction === 'createNew_profile' &&
      chart?.workflow?.arrivalStation &&
      chart?.workflow?.departureStation &&
      profileCurve
    )
      return imageDemaEmptyProfile;

    if (
      chosenAction === 'createNew_profile' &&
      chart?.workflow?.arrivalStation &&
      chart?.workflow?.departureStation &&
      !regimes2 &&
      !gradientCurve &&
      !regimeMarkers &&
      !profileCurve &&
      !borders
    )
      return emptyField;

    if (
      chosenAction === 'createNew_boards' &&
      chart?.workflow?.arrivalStation &&
      chart?.workflow?.departureStation &&
      !regimes2 &&
      !gradientCurve &&
      !regimeMarkers &&
      !profileCurve &&
      borders
    )
      return demaStartWithBoardsNoProfile;

    if (
      chosenAction === 'createNew_boards' &&
      chart?.workflow?.arrivalStation &&
      chart?.workflow?.departureStation &&
      !regimes2 &&
      !gradientCurve &&
      !regimeMarkers &&
      profileCurve &&
      borders
    )
      return demaStartWithBoardsAndProfile;

    if (regimes2 && gradientCurve && regimeMarkers && profileCurve) return imageRealUrl;
    if (regimes2 && !gradientCurve && regimeMarkers && profileCurve) return imageRealNoTopUrl;
    if (regimes2 && !gradientCurve && regimeMarkers && !profileCurve)
      return imageRealNoTopNoProfileUrl;
    if (regimes2 && !gradientCurve && !regimeMarkers && profileCurve)
      return imageRealNoTopNoRegimesUrl;
    if (regimes2 && gradientCurve && !regimeMarkers && !profileCurve) return imageRealNoBottomUrl;
    if (regimes2 && !gradientCurve && !regimeMarkers && !profileCurve) return imageRealSpeedOnlyUrl;
    if (regimes2 && gradientCurve && !regimeMarkers && profileCurve) return imageRealNoRegimesUrl;
    if (regimes2 && gradientCurve && regimeMarkers && !profileCurve) return imageRealNoProfileUrl;

    if (optSpeedCurve && !regimes2 && gradientCurve && regimeMarkers && profileCurve)
      return imageOptUrl;
    if (optSpeedCurve && !regimes2 && !gradientCurve && regimeMarkers && profileCurve)
      return imageOptNoTopUrl;
    if (optSpeedCurve && !regimes2 && !gradientCurve && regimeMarkers && !profileCurve)
      return imageOptNoTopNoProfileUrl;
    if (optSpeedCurve && !regimes2 && !gradientCurve && !regimeMarkers && profileCurve)
      return imageOptNoTopNoRegimesUrl;
    if (optSpeedCurve && !regimes2 && gradientCurve && !regimeMarkers && !profileCurve)
      return imageOptNoBottomUrl;
    if (optSpeedCurve && !regimes2 && !gradientCurve && !regimeMarkers && !profileCurve)
      return imageOptSpeedOnlyUrl;
    if (optSpeedCurve && !regimes2 && gradientCurve && !regimeMarkers && profileCurve)
      return imageOptNoRegimesUrl;
    if (optSpeedCurve && !regimes2 && gradientCurve && regimeMarkers && !profileCurve)
      return imageOptNoProfileUrl;

    if (!optSpeedCurve && !regimes2 && gradientCurve && regimeMarkers && profileCurve)
      return imageUrl;
    if (!optSpeedCurve && !regimes2 && !gradientCurve && regimeMarkers && profileCurve)
      return imageNoTopUrl;
    if (!optSpeedCurve && !regimes2 && !gradientCurve && regimeMarkers && !profileCurve)
      return imageNoTopNoProfileUrl;
    if (!optSpeedCurve && !regimes2 && !gradientCurve && !regimeMarkers && profileCurve)
      return imageNoTopNoRegimesUrl;
    if (!optSpeedCurve && !regimes2 && gradientCurve && !regimeMarkers && !profileCurve)
      return imageNoBottomUrl;
    if (!optSpeedCurve && !regimes2 && !gradientCurve && !regimeMarkers && !profileCurve)
      return imageSpeedOnlyUrl;
    if (!optSpeedCurve && !regimes2 && gradientCurve && !regimeMarkers && profileCurve)
      return imageNoRegimesUrl;
    if (!optSpeedCurve && !regimes2 && gradientCurve && regimeMarkers && !profileCurve)
      return imageNoProfileUrl;

    return imageUrl;
  }, [activeChart, visibleLayers]);

  // ========================================================================
  // RENDER
  // ========================================================================

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
            position: 'absolute',
          }}
        >
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
              <span className="text-sm">Zoom:</span>
              <span className="text-sm font-mono">{Math.round(zoom * 100)}%</span>
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
            <Button size="sm" variant="outline" onClick={handleResetZoom} title="Сбросить масштаб">
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

        {/* Canvas-контейнер */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative bg-gray-50"
          style={{
            marginTop: 50,
            cursor: isDraggingCanvas ? 'grabbing' : draggingObjectId ? 'grabbing' : 'grab',
            height: 'auto !important',
            overflowY: 'hidden',
          }}
          onWheel={handleWheel}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              position: 'relative',
              height: '100%',
              overflowY: 'hidden',
            }}
          >
            {/* Изображение */}
            <img
              ref={imageRef}
              src={getCurrentImage()}
              alt="Режимная карта"
              onLoad={() => setImageLoaded(true)}
              style={{
                display: 'block',
                height: '100%',
                width: 'auto',
                transformOrigin: 'left top',
                transition: 'none',
                userSelect: 'none',
                pointerEvents: 'none',
                maxWidth: 'fit-content',
                objectFit: 'cover',
                objectPosition: 'left top',
              }}
            />

            {/* Размещенные объекты */}
            {imageLoaded &&
              placedObjects.map((obj) => {
                const isSelected = obj.id === selectedObjectId;
                const isHovered = obj.id === hoveredObjectId;
                const isDragging = obj.id === draggingObjectId;
                const isStation = obj.objectType.id === 'station';

                // Получаем полный объект с иконками
                const fullObject = getPaletteObjectById(obj.objectType.id);
                const canvasIcon =
                  fullObject?.canvasIcon || fullObject?.icon || obj.objectType.icon;
                const iconSize = obj.iconSize || getIconSize();

                // Проверяем, является ли объект прямоугольным (нейтральная вставка или место проверки тормозов)
                const isRectangularIcon =
                  obj.objectType.id === 'neutral-insert' || obj.objectType.id === 'auto-brake-test';

                // Для прямоугольных иконок используем отдельные размеры, для остальных (включая станции) - обычный iconSize
                const iconWidth = isRectangularIcon ? getRectangularIconWidth() : iconSize;
                const iconHeight = isRectangularIcon ? getRectangularIconHeight() : iconSize;

                return (
                  <div
                    key={obj.id}
                    style={{
                      position: 'absolute',
                      left: `${obj.position.x}px`,
                      top: `${obj.position.y}px`,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'move',
                      zIndex: isDragging ? 1000 : isSelected ? 100 : 50,
                      pointerEvents: 'auto',
                    }}
                    onMouseDown={(e) => handleObjectMouseDown(e, obj.id)}
                    onMouseEnter={() => setHoveredObjectId(obj.id)}
                    onMouseLeave={() => setHoveredObjectId(null)}
                  >
                    {/* Название станции (если есть) */}
                    {isStation && obj.stationName && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: `${iconSize}px`,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          border: 'none',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: `${iconSize * 0.36}px`,
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                        }}
                      >
                        {obj.stationName}
                      </div>
                    )}

                    {/* Иконка объекта из canvasIcon */}
                    <div
                      style={{
                        width: `${iconWidth}px`,
                        height: `${iconHeight}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        filter: isSelected
                          ? 'drop-shadow(0 0 7px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                          : isHovered
                            ? 'drop-shadow(0 0 7px rgba(96, 165, 250, 0.7)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                            : 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                        transition: 'filter 0.2s',
                        outline: isSelected ? '2px solid #3b82f6' : 'none',
                        outlineOffset: '2px',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {React.cloneElement(canvasIcon as React.ReactElement, {
                          style: {
                            width: '100%',
                            height: '100%',
                          },
                        })}
                      </div>
                    </div>

                    {/* Дополнительная ножка (на основе конфигурации) */}
                    {(() => {
                      const extraLegHeight = getExtraLegHeight();

                      if (extraLegHeight > 0) {
                        return (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: `-${extraLegHeight}px`,
                              left: '47%',
                              transform: 'translateX(-30%)',
                              width: `${Math.max(1.5, iconSize * 0.06)}px`,
                              height: `${extraLegHeight}px`,
                              backgroundColor: isSelected
                                ? '#3b82f6'
                                : isHovered
                                  ? '#60a5fa'
                                  : '#000',
                              pointerEvents: 'none',
                              transition: 'background-color 0.2s',
                              boxShadow: isSelected
                                ? '0 0 7px rgba(59, 130, 246, 0.8)'
                                : isHovered
                                  ? '0 0 7px rgba(96, 165, 250, 0.7)'
                                  : 'none',
                            }}
                          />
                        );
                      }
                      return null;
                    })()}

                    {/* Tooltip при наведении */}
                    {isHovered && !isDragging && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom:
                            isStation && obj.stationName
                              ? `${iconSize * 2.8}px`
                              : `${iconSize * 1.8}px`,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          color: 'white',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          zIndex: 1001,
                        }}
                      >
                        <div style={{ fontWeight: 'bold' }}>{obj.objectType.nameRu}</div>
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>
                          км {obj.coordinate.toFixed(1)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
        <DialogContent className="max-w-[520px] max-h-[75vh] w-[80%]">
          <DialogHeader>
            <DialogTitle>Настройки отображения</DialogTitle>
            <DialogDescription>Выберите элементы для отображения на холсте</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="regimeMarkers"
                disabled={
                  chosenAction === 'createNew_profile' || chosenAction === 'createNew_profile'
                    ? true
                    : false
                }
                checked={visibleLayers.regimeMarkers}
                onCheckedChange={(checked: boolean) =>
                  setVisibleLayers({ ...visibleLayers, regimeMarkers: checked })
                }
              />
              <Label htmlFor="regimeMarkers" className="text-sm cursor-pointer">
                Ленты режимов управления
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="profileCurve"
                checked={visibleLayers.profileCurve}
                onCheckedChange={(checked: boolean) =>
                  setVisibleLayers({ ...visibleLayers, profileCurve: checked })
                }
              />
              <Label htmlFor="profileCurve" className="text-sm cursor-pointer">
                Профиль пути
              </Label>
            </div>

            <div
              className={`flex items-center space-x-3 ${chosenAction === 'createNew' ? 'opacity-50' : ''}`}
            >
              <Checkbox
                id="limitCurve"
                checked={chosenAction === 'createNew' ? false : visibleLayers.borders}
                disabled={chosenAction === 'createNew'}
              />
              <Label
                htmlFor="limitCurve"
                className={`text-sm ${chosenAction === 'createNew' ? 'cursor-not-allowed' : ''}`}
              >
                Ограничения скорости
              </Label>
            </div>

            <div className="flex items-center space-x-3 opacity-50">
              <Checkbox
                id="speedCurve"
                checked={
                  chosenAction === 'createNew_profile' || chosenAction === 'createNew_profile'
                    ? false
                    : true
                }
                disabled={true}
              />
              <Label htmlFor="speedCurve" className="text-sm cursor-not-allowed">
                Оптимальная кривая скорости
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="optSpeedCurve"
                checked={visibleLayers.optSpeedCurve}
                disabled={
                  chosenAction === 'createNew_profile' || chosenAction === 'createNew_profile'
                    ? true
                    : false
                }
                onCheckedChange={(checked: boolean) =>
                  setVisibleLayers({ ...visibleLayers, optSpeedCurve: checked })
                }
              />
              <Label htmlFor="optSpeedCurve" className="text-sm">
                Кривая скорости
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="gradientCurve"
                checked={visibleLayers.gradientCurve}
                disabled={
                  chosenAction === 'createNew_profile' || chosenAction === 'createNew_profile'
                    ? true
                    : false
                }
                onCheckedChange={(checked: boolean) =>
                  setVisibleLayers({
                    ...visibleLayers,
                    gradientCurve: checked,
                    regimes2: checked === false ? false : visibleLayers.regimes2,
                  })
                }
              />
              <Label htmlFor="gradientCurve" className="text-sm cursor-pointer">
                Динамика оптимальная
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="regimes2"
                checked={visibleLayers.regimes2}
                disabled={
                  chosenAction === 'createNew_profile' || chosenAction === 'createNew_profile'
                    ? true
                    : false
                }
                onCheckedChange={(checked: boolean) =>
                  setVisibleLayers({
                    ...visibleLayers,
                    regimes2: checked,
                    gradientCurve: checked === true ? true : visibleLayers.gradientCurve,
                  })
                }
              />
              <Label htmlFor="regimes2" className="text-sm">
                Динамика реализованная
              </Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
