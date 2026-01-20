import { jsPDF } from 'jspdf';
import { GitBranch, ZoomIn, ZoomOut, Settings } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

// Color conversion helpers
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

function replaceOklchInString(v: string): string {
  const regex = /(oklch\([^)]*\))|(oklab\([^)]*\))/g;
  return v.replace(regex, (match) => {
    const conv = oklchCssToRgb(match);
    return conv || match;
  });
}

function replaceVarsInSvg(svg: string): string {
  try {
    const rootComputed = getComputedStyle(document.documentElement);
    return svg.replace(/var\((--[a-zA-Z0-9-_]+)(?:,[^)]+)?\)/g, (full, varName) => {
      const fallbackName = `${varName}-fallback`;
      let resolved = '';
      const rc = rootComputed.getPropertyValue(fallbackName).trim();
      if (rc) resolved = rc;
      if (!resolved) {
        const rc2 = rootComputed.getPropertyValue(varName).trim();
        if (rc2) resolved = rc2;
      }
      return resolved || full;
    });
  } catch {
    return svg;
  }
}

// Data imports
import { longitudinalForces } from '../data/longitudinal_forces';
import { optimalRegimes, regimesV2 } from '../data/regimes';
import { speedLimits } from '../data/speed-limits';
import { speedCurves } from '../data/speedCurves';
import { trainForceData } from '../data/trainForceData';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCurrentChartData } from '../store/workflowSlice';
import type {
  ChartData,
  CanvasObject,
  OperationModeSegment,
  OperationMode,
  SpeedLimit,
} from '../types/chart-data';

import ObjectPalette from './ObjectPalette';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { ContextMenu, ContextMenuContent, ContextMenuItem } from './ui/context-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { getPaletteObjectById } from '@/utils/visioObjectPaletteUtils';

interface ChartEditorProps {
  chartData: ChartData;
  onUpdateChartData: (updates: Partial<ChartData>) => void;
  selectedObjectId?: string | null;
  onSelectObject?: (id: string | null) => void;
}

// ИСПРАВЛЕНИЕ: Вынесли функции ДО использования в компоненте
// Функция для отрисовки fallback иконки (синий кружок)
const drawFallbackIcon = (
  ctx: CanvasRenderingContext2D,
  obj: any,
  iconSize: number,
  zoom: number
) => {
  const dotSize = 12;
  ctx.fillStyle = '#3b82f6';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, dotSize / zoom, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (obj.label) {
    ctx.fillStyle = '#1f2937';
    ctx.font = `${11 / zoom}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(obj.label, obj.x, obj.y + (dotSize + 4) / zoom);
  }
};

// Helper function to calculate kmToX conversion
const createKmToXConverter = (chart: ChartData, marginLeft: number = 80, pixelsPerKm: number) => {
  if (!chart.workflow?.trackSection) {
    return (km: number) => marginLeft;
  }

  const trackSection = chart.workflow.trackSection;
  const trackLength = trackSection.length;

  let actualStartCoord = 0;
  let actualEndCoord = trackLength;

  if (trackSection.stations && trackSection.stations.length > 0) {
    actualStartCoord = trackSection.stations[0].startCoord;
    actualEndCoord = trackSection.stations[trackSection.stations.length - 1].endCoord;
  }

  const isReversed = true;
  const displayStartCoord = 1782;
  const displayEndCoord = 1610;

  return (km: number) => {
    if (!isFinite(km)) {
      return marginLeft;
    }

    const normalizedKm = isReversed ? displayEndCoord - km : km;
    const x = marginLeft + (normalizedKm - displayStartCoord) * pixelsPerKm;

    if (!isFinite(x)) {
      return marginLeft;
    }

    return x;
  };
};

export default function ChartEditor({
  chartData,
  onUpdateChartData,
  selectedObjectId,
  onSelectObject,
}: ChartEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgIconCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [pixelsPerKm, setPixelsPerKm] = useState(40);

  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const [redrawTrigger, setRedrawTrigger] = useState(0);
  const triggerRedraw = React.useCallback(() => {
    setRedrawTrigger((prev) => prev + 1);
  }, []);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const dispatch = useAppDispatch();
  const storeChart = useAppSelector((s) => s.workflow.currentChartData);

  useEffect(() => {
    if (chartData) dispatch(setCurrentChartData(chartData));
  }, [chartData, dispatch]);

  const updateChartData = (updates: Partial<ChartData>) => {
    // Log every call with stack trace to track duplication source
    const updateSource = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
    console.debug('[ChartEditor] updateChartData ENTRY', {
      source: updateSource,
      isPanning,
      draggedObject: draggedObject?.id,
      draggedArrow: draggedArrow?.arrowId,
      hasCanvasObjects: !!updates.canvasObjects,
      canvasObjectsCount: updates.canvasObjects ? (updates.canvasObjects as any).length : undefined,
      currentCount: chart.canvasObjects?.length,
    });

    // DEFENSIVE CHECK: Prevent object modifications during pan-only operations
    if (isPanning && !draggedObject && !draggedArrow && updates.canvasObjects) {
      console.error(
        '[BUG PREVENTED] Attempting to modify canvasObjects during pan-only operation!',
        {
          isPanning,
          draggedObject: !!draggedObject,
          draggedArrow: !!draggedArrow,
          objectCount: updates.canvasObjects.length,
          currentCount: chart.canvasObjects?.length,
          timestamp: Date.now(),
          stack: new Error().stack,
        }
      );
      return; // Prevent the update
    }

    // Prefer informing parent (single source of truth). During interactive
    // operations (dragging/panning) debounce rapid updates to avoid
    // duplicate creations caused by multiple update paths.
    if (onUpdateChartData) {
      const interactive = !!(draggedObject || draggedArrow || isPanning);
      console.debug('[ChartEditor] updateChartData called', {
        interactive,
        updates,
        pending: !!pendingUpdatesRef.current,
        hasCanvasObjects: !!updates.canvasObjects,
        canvasObjectsLength: updates.canvasObjects
          ? (updates.canvasObjects as any).length
          : undefined,
        timestamp: Date.now(),
      });
      if (interactive) {
        pendingUpdatesRef.current = { ...(pendingUpdatesRef.current || {}), ...updates };
        if (updateTimerRef.current) clearTimeout(updateTimerRef.current as number);
        updateTimerRef.current = window.setTimeout(() => {
          if (pendingUpdatesRef.current) {
            console.debug('[ChartEditor] flushing pending updates', {
              pending: pendingUpdatesRef.current,
              timestamp: Date.now(),
            });
            onUpdateChartData(pendingUpdatesRef.current as Partial<ChartData>);
            pendingUpdatesRef.current = null;
          }
          updateTimerRef.current = null;
        }, 50) as unknown as number;
        return;
      }

      console.debug('[ChartEditor] calling onUpdateChartData immediate', { updates });
      onUpdateChartData(updates);
      return;
    }

    const current = chartData ?? storeChart;
    if (current) {
      const merged = { ...current, ...updates };
      console.debug('[ChartEditor] no parent handler - dispatching to store', {
        updatesSummary: Object.keys(updates),
        canvasObjects_before: current.canvasObjects ? current.canvasObjects.length : 0,
        canvasObjects_after: (updates as any).canvasObjects
          ? (updates as any).canvasObjects.length
          : undefined,
        timestamp: Date.now(),
      });
      dispatch(setCurrentChartData(merged));
    }
  };

  // ============================================
  // КЭШ ИКОНОК ДЛЯ СИНХРОННОЙ ОТРИСОВКИ
  // ============================================

  // Кэш готовых изображений иконок
  const iconImageCache = useRef<Map<string, HTMLImageElement | 'loading'>>(new Map());

  // Набор иконок, которые не удалось загрузить (чтобы не пытаться снова)
  const failedIconsRef = useRef<Set<string>>(new Set());

  /**
   * Асинхронно загружает SVG иконку в кэш как растровое изображение.
   * После загрузки вызывает triggerRedraw() для перерисовки canvas.
   */
  const loadIconToCache = React.useCallback(
    async (objectType: string, iconSize: number) => {
      const cacheKey = `${objectType}_${Math.round(iconSize)}`;

      // Проверяем, не загружается ли уже или не загружена
      if (iconImageCache.current.has(cacheKey) || failedIconsRef.current.has(cacheKey)) {
        return;
      }

      // Получаем объект из палитры
      const fullObj = getPaletteObjectById(objectType);
      if (!fullObj?.canvasIcon) {
        failedIconsRef.current.add(cacheKey);
        return;
      }

      // Помечаем как "загружается"
      iconImageCache.current.set(cacheKey, 'loading');

      try {
        // Создаем временный div для рендеринга React SVG компонента
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-99999px';
        tempDiv.style.width = `${iconSize}px`;
        tempDiv.style.height = `${iconSize}px`;
        document.body.appendChild(tempDiv);

        // Динамический импорт react-dom/client
        const { createRoot } = await import('react-dom/client');
        const root = createRoot(tempDiv);

        // Клонируем иконку с нужными размерами
        const iconElement = React.cloneElement(fullObj.canvasIcon as React.ReactElement, {
          style: { width: '100%', height: '100%' },
        });

        // Рендерим и ждём
        await new Promise<void>((resolve) => {
          root.render(iconElement);
          // Даём время на рендеринг
          setTimeout(resolve, 50);
        });

        // Получаем SVG элемент
        const svgElement = tempDiv.querySelector('svg');

        if (!svgElement) {
          throw new Error('SVG element not found after render');
        }

        // Получаем размеры из viewBox для сохранения пропорций
        const viewBox = svgElement.getAttribute('viewBox');
        let finalWidth = iconSize;
        let finalHeight = iconSize;

        if (viewBox) {
          const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
          const aspectRatio = vbWidth / vbHeight;
          if (aspectRatio > 1) {
            finalHeight = iconSize / aspectRatio;
          } else if (aspectRatio < 1) {
            finalWidth = iconSize * aspectRatio;
          }
        }

        // Клонируем SVG для модификации
        const svgClone = svgElement.cloneNode(true) as SVGElement;

        // Устанавливаем размеры
        svgClone.setAttribute('width', String(finalWidth));
        svgClone.setAttribute('height', String(finalHeight));

        // Получаем computed color
        const computedColor = window.getComputedStyle(svgElement).color || '#000000';

        // Рекурсивно заменяем currentColor
        const replaceCurrentColor = (element: Element) => {
          ['stroke', 'fill'].forEach((attr) => {
            const value = element.getAttribute(attr);
            if (value === 'currentColor') {
              element.setAttribute(attr, computedColor);
            }
          });
          // Также проверяем style атрибут
          const style = element.getAttribute('style');
          if (style && style.includes('currentColor')) {
            element.setAttribute('style', style.replace(/currentColor/g, computedColor));
          }
          Array.from(element.children).forEach((child) => replaceCurrentColor(child));
        };

        replaceCurrentColor(svgClone);

        // Убираем xmlns если отсутствует
        if (!svgClone.getAttribute('xmlns')) {
          svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }

        // Сериализуем SVG
        const svgData = new XMLSerializer().serializeToString(svgClone);

        // Заменяем CSS переменные и oklch цвета
        let sanitizedSvg = replaceVarsInSvg(svgData);
        sanitizedSvg = replaceOklchInString(sanitizedSvg);

        // Создаём data URL
        const svgBlob = new Blob([sanitizedSvg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        // Загружаем как Image
        const img = new Image();

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
          };
          img.src = url;
        });

        // Сохраняем в кэш
        iconImageCache.current.set(cacheKey, img);

        // Очищаем временные элементы
        root.unmount();
        document.body.removeChild(tempDiv);

        // Перерисовываем canvas
        triggerRedraw();

        console.debug('[loadIconToCache] Successfully cached icon:', cacheKey);
      } catch (error) {
        console.error('[loadIconToCache] Failed to load icon:', objectType, error);
        // Помечаем как неудачную загрузку
        failedIconsRef.current.add(cacheKey);
        iconImageCache.current.delete(cacheKey);
      }
    },
    [triggerRedraw]
  );

  const chart = chartData ?? storeChart;

  /**
   * Синхронная отрисовка объектов на canvas.
   * Использует кэшированные изображения или fallback к кругу.
   */
  const drawCanvasObjectsSync = React.useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvasObjects: CanvasObject[],
      zoom: number,
      options?: {
        skipObjectId?: string; // ID объекта для пропуска (перетаскиваемый)
        highlightObjectId?: string; // ID объекта для подсветки (выбранный)
      }
    ) => {
      if (!canvasObjects || canvasObjects.length === 0) return;

      const baseIconSize = 24;
      const iconSize = baseIconSize / (zoom || 1);
      const { skipObjectId, highlightObjectId } = options || {};

      for (const obj of canvasObjects) {
        // Пропускаем перетаскиваемый объект (он рисуется отдельно)
        if (skipObjectId && obj.id === skipObjectId) continue;

        ctx.save();

        const cacheKey = `${obj.subtype || obj.type}_${Math.round(iconSize)}`;
        const cachedItem = iconImageCache.current.get(cacheKey);

        let iconDrawn = false;

        if (cachedItem && cachedItem !== 'loading' && cachedItem.complete) {
          // Используем закэшированное изображение
          try {
            const imgWidth = cachedItem.naturalWidth || iconSize;
            const imgHeight = cachedItem.naturalHeight || iconSize;

            // Масштабируем с сохранением пропорций
            const scale = Math.min(iconSize / imgWidth, iconSize / imgHeight);
            const drawWidth = imgWidth * scale;
            const drawHeight = imgHeight * scale;

            ctx.drawImage(
              cachedItem,
              obj.x - drawWidth / 2,
              obj.y - drawHeight / 2,
              drawWidth,
              drawHeight
            );
            iconDrawn = true;
          } catch (e) {
            console.warn('[drawCanvasObjectsSync] Failed to draw cached image:', cacheKey);
          }
        }

        if (!iconDrawn) {
          // Fallback: рисуем круг
          const dotSize = 12 / (zoom || 1);
          ctx.fillStyle = '#3b82f6';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / (zoom || 1);
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, dotSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Запускаем загрузку иконки в фоне (если ещё не загружается)
          if (!cachedItem && !failedIconsRef.current.has(cacheKey)) {
            loadIconToCache(obj.subtype || obj.type, iconSize);
          }
        }

        // Подсветка выбранного объекта
        if (highlightObjectId && obj.id === highlightObjectId) {
          ctx.strokeStyle = '#f59e0b'; // Amber
          ctx.lineWidth = 3 / (zoom || 1);
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, (iconSize / 2 + 4) / (zoom || 1), 0, Math.PI * 2);
          ctx.stroke();
        }

        // Label
        if (obj.label) {
          ctx.fillStyle = '#1f2937';
          ctx.font = `${11 / (zoom || 1)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(obj.label, obj.x, obj.y + iconSize / 2 + 4 / (zoom || 1));
        }

        ctx.restore();
      }
    },
    [loadIconToCache]
  );

  /**
   * Синхронная отрисовка перетаскиваемого объекта поверх всех.
   */
  const drawDraggedObject = React.useCallback(
    (
      ctx: CanvasRenderingContext2D,
      obj: CanvasObject,
      position: { x: number; y: number },
      zoom: number
    ) => {
      ctx.save();

      const baseIconSize = 24;
      const iconSize = baseIconSize / (zoom || 1);
      const dotSize = iconSize / 2;

      // Тень для визуального отделения
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const objectType = obj.subtype || obj.type;

      // ============================================
      // ОТЛАДКА: Проверяем что приходит и что в кэше
      // ============================================
      console.debug('[drawDraggedObject] DEBUG', {
        objectId: obj.id,
        objectType,
        subtype: obj.subtype,
        type: obj.type,
        iconSize: Math.round(iconSize),
        cacheSize: iconImageCache.current.size,
        cacheKeys: Array.from(iconImageCache.current.keys()),
        failedKeys: Array.from(failedIconsRef.current),
      });

      // Пытаемся использовать кэшированную иконку
      const cacheKey = `${obj.subtype || obj.type}_${Math.round(iconSize)}`;
      const cachedItem = iconImageCache.current.get(cacheKey);

      let iconDrawn = false;

      if (cachedItem && cachedItem !== 'loading' && cachedItem.complete) {
        try {
          const imgWidth = cachedItem.naturalWidth || iconSize;
          const imgHeight = cachedItem.naturalHeight || iconSize;
          const scale = Math.min(iconSize / imgWidth, iconSize / imgHeight);
          const drawWidth = imgWidth * scale;
          const drawHeight = imgHeight * scale;

          ctx.drawImage(
            cachedItem,
            position.x - drawWidth / 2,
            position.y - drawHeight / 2,
            drawWidth,
            drawHeight
          );
          iconDrawn = true;
        } catch (e) {
          // Fallback to circle
        }
      }

      if (!iconDrawn) {
        // Fallback: круг
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / (zoom || 1);
        ctx.beginPath();
        ctx.arc(position.x, position.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Сбрасываем тень для текста
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Label
      if (obj.label) {
        ctx.fillStyle = '#1f2937';
        ctx.font = `${11 / (zoom || 1)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(obj.label, position.x, position.y + dotSize + 4 / (zoom || 1));
      }

      // Обводка выделения при перетаскивании
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2 / (zoom || 1);
      ctx.setLineDash([4 / (zoom || 1), 4 / (zoom || 1)]);
      ctx.beginPath();
      ctx.arc(position.x, position.y, (iconSize / 2 + 6) / (zoom || 1), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    },
    []
  );

  // PDF Export function
  useEffect(() => {
    const win = window as any;
    win.__exportChartEditorToPdf = async (filename = 'chart.pdf') => {
      try {
        const srcCanvas = canvasRef.current;
        if (!srcCanvas) throw new Error('Canvas not found');

        const srcW = srcCanvas.width;
        const srcH = srcCanvas.height;

        const pdf = new jsPDF({ unit: 'px', format: 'a4', orientation: 'landscape' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const availableHeight = pageHeight - margin * 2;
        const availableWidth = pageWidth - margin * 2;

        // Scale to fit page height
        const scale = availableHeight / srcH;
        const scaledWidth = srcW * scale;
        const overlapPercent = 0.2;

        // Helper to obtain track section name
        const trackSectionName =
          chart?.workflow?.trackSection?.name ??
          (typeof chart?.workflow?.trackSection === 'string' ||
          typeof chart?.workflow?.trackSection === 'number'
            ? String(chart?.workflow?.trackSection)
            : undefined);

        if (scaledWidth <= availableWidth) {
          // single page
          const imgData = srcCanvas.toDataURL('image/png');
          const drawW = srcW * scale;
          const drawH = srcH * scale;
          const x = margin + (availableWidth - drawW) / 2;
          const y = margin;

          // Render trackSectionName into the image canvas to preserve Cyrillic rendering
          const headerPx = 24;
          const canvasWithHeader = document.createElement('canvas');
          canvasWithHeader.width = srcW;
          canvasWithHeader.height = srcH + headerPx;
          const ctxHeader = canvasWithHeader.getContext('2d');
          if (!ctxHeader) throw new Error('Failed to get canvas context');
          ctxHeader.fillStyle = '#ffffff';
          ctxHeader.fillRect(0, 0, canvasWithHeader.width, canvasWithHeader.height);
          if (trackSectionName) {
            ctxHeader.fillStyle = '#000000';
            ctxHeader.font = '16px sans-serif';
            ctxHeader.fillText(trackSectionName, 8, 16);
          }
          ctxHeader.drawImage(srcCanvas, 0, headerPx);
          const imgDataWithHeader = canvasWithHeader.toDataURL('image/png');
          const drawWWithHeader = canvasWithHeader.width * scale;
          const drawHWithHeader = canvasWithHeader.height * scale;
          const xWithHeader = margin + (availableWidth - drawWWithHeader) / 2;
          const yWithHeader = margin;
          pdf.addImage(
            imgDataWithHeader,
            'PNG',
            xWithHeader,
            yWithHeader,
            drawWWithHeader,
            drawHWithHeader
          );
          pdf.setFontSize(10);
          pdf.text(`Page 1 of 1`, pageWidth / 2, pageHeight - margin / 2, { align: 'center' });
          pdf.save(filename);
          return;
        }

        // Multi-page: split horizontally
        const cropWidthOriginal = availableWidth / scale;
        const overlapOriginal = cropWidthOriginal * overlapPercent;
        const step = cropWidthOriginal - overlapOriginal;
        const pages = Math.ceil((srcW - cropWidthOriginal) / step) + 1;

        for (let i = 0; i < pages; i++) {
          const sx = Math.round(i * step);
          let sw = Math.round(cropWidthOriginal);
          if (sx + sw > srcW) sw = srcW - sx;

          // Draw slice from source canvas into temporary canvas
          const canvas = document.createElement('canvas');
          canvas.width = sw;
          canvas.height = srcH;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(srcCanvas, sx, 0, sw, srcH, 0, 0, sw, srcH);

          const imgData = canvas.toDataURL('image/png');
          const drawW = sw * scale;
          const drawH = srcH * scale;
          const x = margin + (availableWidth - drawW) / 2;
          const y = margin;

          if (i > 0) pdf.addPage();

          if (i === 0 && trackSectionName) {
            const headerPx = 24;
            const canvasWithHeader = document.createElement('canvas');
            canvasWithHeader.width = canvas.width;
            canvasWithHeader.height = canvas.height + headerPx;
            const ctxHeader = canvasWithHeader.getContext('2d');
            if (!ctxHeader) throw new Error('Failed to get canvas context');
            ctxHeader.fillStyle = '#ffffff';
            ctxHeader.fillRect(0, 0, canvasWithHeader.width, canvasWithHeader.height);
            ctxHeader.fillStyle = '#000000';
            ctxHeader.font = '16px sans-serif';
            ctxHeader.fillText(trackSectionName, 8, 16);
            ctxHeader.drawImage(canvas, 0, headerPx);
            const imgDataWithHeader = canvasWithHeader.toDataURL('image/png');
            const drawWWithHeader = canvasWithHeader.width * scale;
            const drawHWithHeader = canvasWithHeader.height * scale;
            pdf.addImage(imgDataWithHeader, 'PNG', x, y, drawWWithHeader, drawHWithHeader);
          } else {
            pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);
          }

          pdf.setFontSize(10);
          pdf.text(`Page ${i + 1} of ${pages}`, pageWidth / 2, pageHeight - margin / 2, {
            align: 'center',
          });
        }

        pdf.save(filename);
      } catch (err) {
        console.error('Export to PDF failed', err);
        throw err;
      }
    };

    return () => {
      win.__exportChartEditorToPdf = undefined;
    };
  }, [canvasRef, chart]);

  const [isMarqueeZoom, setIsMarqueeZoom] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);

  const [hoveredObject, setHoveredObject] = useState<CanvasObject | null>(null);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const [draggedObject, setDraggedObject] = useState<CanvasObject | null>(null);
  const [draggingObjectPosition, setDraggingObjectPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hasDragMoved, setHasDragMoved] = useState(false);
  const placementCooldownRef = useRef<number>(0);
  // Pending update debounce refs for interactive updates
  const pendingUpdatesRef = useRef<Partial<ChartData> | null>(null);
  const updateTimerRef = useRef<number | null>(null);

  const flushPendingUpdates = () => {
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current as number);
      updateTimerRef.current = null;
    }
    if (pendingUpdatesRef.current && onUpdateChartData) {
      onUpdateChartData(pendingUpdatesRef.current);
      pendingUpdatesRef.current = null;
    }
  };
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [screenMousePos, setScreenMousePos] = useState({ x: 0, y: 0 });

  const [showPalette, setShowPalette] = useState(false);
  const [placingObject, setPlacingObject] = useState<string | null>(null);

  const [selectedArrow, setSelectedArrow] = useState<string | null>(null);
  const [draggedArrow, setDraggedArrow] = useState<{
    arrowId: string;
    handle: 'start' | 'end';
  } | null>(null);
  const [hoveredArrow, setHoveredArrow] = useState<{
    arrowId: string;
    handle?: 'start' | 'end';
  } | null>(null);
  const [resizeLimitReached, setResizeLimitReached] = useState<boolean>(false);

  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [displaySettings, setDisplaySettings] = useState({
    trackProfile: true,
    optimalSpeedCurve: true,
    speedLimits: true,
    actualSpeedCurve: true,
    regimeBands: true,
    objectMarkers: true,
  });

  const [baseWidth, setBaseWidth] = useState(2400);
  const [baseHeight] = useState(800);

  const dividerY = baseHeight * 0.4;
  const xAxisY = dividerY + 250;
  const slopeAreaTop = 450;
  const slopeAreaBottom = 550;

  // Track canvasObjects changes for debugging duplication issues
  const prevObjectsLengthRef = useRef<number>(0);
  const prevObjectsIdsRef = useRef<string[]>([]);
  useEffect(() => {
    if (chart.canvasObjects) {
      const currentLength = chart.canvasObjects.length;
      const currentIds = chart.canvasObjects.map((o) => o.id);

      if (
        prevObjectsLengthRef.current !== currentLength ||
        JSON.stringify(prevObjectsIdsRef.current) !== JSON.stringify(currentIds)
      ) {
        console.warn('[ChartEditor] ⚠️ canvasObjects CHANGED', {
          from: prevObjectsLengthRef.current,
          to: currentLength,
          previousIds: prevObjectsIdsRef.current,
          currentIds: currentIds,
          isPanning,
          draggedObject: draggedObject?.id,
          draggedArrow: draggedArrow?.arrowId,
          placingObject: !!placingObject,
          hasDragMoved,
          stack: new Error().stack?.split('\n').slice(1, 5).join('\n'),
        });
        prevObjectsLengthRef.current = currentLength;
        prevObjectsIdsRef.current = currentIds;
      }
    }
  }, [chart.canvasObjects, isPanning, draggedObject, draggedArrow, placingObject, hasDragMoved]);

  useEffect(() => {
    const trackLength = chart.workflow?.trackSection?.length || 200;

    if (!isFinite(trackLength) || trackLength <= 0 || trackLength > 10000) {
      if (baseWidth !== 2400) {
        setBaseWidth(2400);
      }
      return;
    }

    const marginLeft = 100;
    const marginRight = 100;
    const calculatedWidth = Math.max(2400, marginLeft + trackLength * pixelsPerKm + marginRight);

    if (calculatedWidth !== baseWidth) {
      setBaseWidth(calculatedWidth);
    }
  }, [chart.workflow?.trackSection?.length, baseWidth, pixelsPerKm]);

  const lineWidth = (base: number) => base;
  const fontSize = (base: number) => `${base}px sans-serif`;

  // ОСНОВНАЯ ОТРИСОВКА WORKFLOW-ГРАФИКА
  const drawWorkflowCanvas = React.useCallback(
    async (ctx: CanvasRenderingContext2D, baseWidth: number, baseHeight: number, zoom: number) => {
      try {
        const trackSection = chartData.workflow?.trackSection;
        const trackLength = trackSection?.length ?? 0;

        // VALIDATION: Check track length
        if (!isFinite(trackLength) || trackLength <= 0 || trackLength > 10000) {
          throw new Error(`Invalid track length: ${trackLength} km`);
        }
        let actualStartCoord = 0;
        let actualEndCoord = trackLength;

        if (trackSection && trackSection.stations && trackSection.stations.length > 0) {
          actualStartCoord = trackSection.stations[0].startCoord;
          actualEndCoord = trackSection.stations[trackSection.stations.length - 1].endCoord;
        }

        const isReversed = /*actualStartCoord > actualEndCoord*/ true;
        const displayStartCoord = /*isReversed ? actualEndCoord : actualStartCoord*/ 1782;
        const displayEndCoord = /*isReversed ? actualStartCoord : actualEndCoord*/ 1610;
        const displayTrackLength = displayEndCoord - displayStartCoord;

        // Фон (без трансформаций)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, baseWidth, baseHeight);

        // ЕДИНАЯ СИСТЕМА КООРДИНАТ ДЛЯ ВСЕГО КОНТЕНТА:
        // 1) ОДИН translate(panX, panY)
        // 2) ОДИН scale(zoom, 1) — вертикальное масштабирование заблокировано
        ctx.save();
        ctx.translate(panX, panY);
        ctx.scale(1, 1);

        // ==============
        // LAYER DEFINITIONS (4 layers, total 800px)
        // ==============
        const LAYER1_TOP = 0; // Force Dynamics Layer
        const LAYER1_HEIGHT = 180;
        const LAYER1_CENTER = 90;
        const LAYER2_TOP = 180; // Speed Curves Layer
        const LAYER2_HEIGHT = 300;
        const LAYER3_TOP = 480; // Track Profile Layer
        const LAYER3_HEIGHT = 140;
        const LAYER4_TOP = 630; // Regime Bands Layer
        const LAYER4_HEIGHT = 210;

        const marginLeft = 80;
        const marginRight = 50;
        const chartWidth = baseWidth - marginLeft - marginRight;

        // Преобразование координаты (км → X) with validation
        const kmToX = (km: number) => {
          if (!isFinite(km)) {
            return marginLeft;
          }

          const normalizedKm = isReversed ? displayEndCoord - km : km;

          // ФИКСИРОВАННЫЙ МАСШТАБ: 40px на 1 км
          const x = marginLeft + (normalizedKm + displayStartCoord) * pixelsPerKm;

          return x;
        };
        const kmToX1 = (km: number) => {
          // Простое преобразование БЕЗ реверса
          const normalized =
            (displayStartCoord - km) / Math.abs(displayEndCoord - displayStartCoord);
          return marginLeft + normalized * chartWidth;
        };

        const kmToX2 = (km: number) => {
          // Нормализуем координату в диапазон [0, 1]
          const normalized = (displayStartCoord - km) / (displayStartCoord - displayEndCoord);

          // Преобразуем в пиксели
          const x = marginLeft + normalized * chartWidth;

          return x;
        };

        // ====================================
        // ====================================
        // ====================================
        // LAYER 1: TENSION/COMPRESSION FORCE DYNAMICS (0-160px)
        // ====================================
        if (displaySettings.trackProfile) {
          // Using trackProfile setting to show/hide force layer
          const layer1Top = LAYER1_TOP + 25;
          const layer1Bottom = LAYER1_TOP + LAYER1_HEIGHT - 25;
          const layer1Center = (layer1Top + layer1Bottom) / 2;
          const layer1Height = layer1Bottom - layer1Top;

          // Draw layer border
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = lineWidth(1);
          ctx.strokeRect(marginLeft, LAYER1_TOP, chartWidth, LAYER1_HEIGHT);

          // Draw baseline (blue)
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = lineWidth(1);
          ctx.beginPath();
          ctx.moveTo(marginLeft, layer1Center);
          ctx.lineTo(marginLeft + chartWidth, layer1Center);
          ctx.stroke();

          // Y-СКАЛА от -100 до 100 кН
          ctx.save();
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = lineWidth(1);
          ctx.fillStyle = '#6b7280';
          ctx.font = fontSize(11);
          ctx.textAlign = 'right';

          // Горизонтальные пунктирные линии для каждой десятки
          for (let force = -125; force <= 125; force += 25) {
            // Преобразование силы в координату Y
            const y = layer1Center - force * (layer1Height / 2 / 100);

            // Пунктирная линия через весь слой
            ctx.setLineDash([1, 3]); // Пунктирный стиль
            ctx.beginPath();
            ctx.moveTo(marginLeft, y);
            ctx.lineTo(marginLeft + chartWidth, y);
            ctx.stroke();

            // Подписи слева (только для круглых значений -100, -50, 0, 50, 100)
            if (force % 25 === 0 || force === 0 || force === 125) {
              ctx.setLineDash([]); // Сброс пунктира
              ctx.fillText(`${force}`, marginLeft - 5, y + 4);

              // Толще линия для основных значений
              ctx.lineWidth = lineWidth(0.5);
              ctx.beginPath();
              ctx.moveTo(marginLeft, y);
              //ctx.lineTo(marginLeft + chartWidth, y);
              //ctx.stroke();
              ctx.lineWidth = lineWidth(0.5);
            }
          }

          ctx.setLineDash([]); // Сброс пунктира
          ctx.restore();

          // Draw force curves from longitudinalForces
          if (longitudinalForces && longitudinalForces.length > 0) {
            // Проверяем, попадают ли данные в диапазон отображения
            const firstDataKm = longitudinalForces[0].distance;
            const lastDataKm = longitudinalForces[longitudinalForces.length - 1].distance;

            const dataInRange = longitudinalForces.filter(
              (point) => point.distance <= displayStartCoord && point.distance >= displayEndCoord
            );

            // Если данных в диапазоне нет — возможно проблема с координатами
            if (dataInRange.length === 0) {
              console.error('[LAYER 1] Нет данных в видимом диапазоне! Возможные причины:', {
                данныеНачинаютсяС: firstDataKm,
                данныеЗаканчиваются: lastDataKm,
                отображаемыйДиапазон: `${displayStartCoord} - ${displayEndCoord}`,
                разницаСНачалом: firstDataKm - displayStartCoord,
                разницаСКонцом: lastDataKm - displayEndCoord,
              });
            }

            // Find max absolute force for scaling (учитываем оба значения)
            const maxTension = /**Math.max(...longitudinalForces.map(d => Math.abs(d.tension)), 1) */ 125;
            const maxCompression = /*Math.max(...longitudinalForces.map(d => Math.abs(d.compression)), 1)*/ 125;
            const maxForce = Math.max(maxTension, maxCompression);

            const forceScale = LAYER1_HEIGHT / 2 / maxForce;

            // 1. Рисуем КРАСНУЮ кривую (растяжение/tension)
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = lineWidth(2);
            ctx.beginPath();
            let tensionStarted = false;
            let tensionPointsDrawn = 0;

            longitudinalForces.forEach((point, index) => {
              // Данные уже в километрах с правильной привязкой
              const distanceKm = point.distance;

              if (distanceKm <= displayStartCoord && distanceKm >= displayEndCoord) {
                const x = kmToX1(distanceKm);
                const y = LAYER1_CENTER - point.tension * forceScale; // Положительное значение - выше базовой линии
                ctx.lineTo(x, y);
                ctx.moveTo(x, y);

                /*if (!tensionStarted) {
                  ctx.moveTo(x, y);
                  tensionStarted = true;
                } else {
                  ctx.lineTo(x, y);
                }*/
                tensionPointsDrawn++;

                // Логирование для отладки
                /*if (index < 3 || index === longitudinalForces.length - 1) {
                  console.log('[LAYER 1] Точка растяжения:', {
                    index,
                    distanceKm,
                    tension: point.tension,
                    x,
                    y,
                  });
                }*/
              }
            });

            ctx.stroke();

            // 2. Рисуем СИНЮЮ кривую (сжатие/compression)
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = lineWidth(2);
            ctx.beginPath();
            let compressionStarted = false;
            let compressionPointsDrawn = 0;

            longitudinalForces.forEach((point, index) => {
              const distanceKm = point.distance;

              if (distanceKm <= displayStartCoord && distanceKm >= displayEndCoord) {
                const x = kmToX1(distanceKm);
                // Сжатие отображаем как отрицательное значение (ниже базовой линии)
                const y = LAYER1_CENTER + point.compression * forceScale;
                ctx.lineTo(x, y);
                ctx.moveTo(x, y);

                /*if (!compressionStarted) {
                  ctx.moveTo(x, y);
                  compressionStarted = true;
                } else {
                  ctx.lineTo(x, y);
                }*/
                compressionPointsDrawn++;
              }
            });

            ctx.stroke();

            /*console.log('[LAYER 1] Статистика отрисовки:', {
              totalPoints: longitudinalForces.length,
              tensionPointsDrawn,
              compressionPointsDrawn,
            });*/

            // Если данных нет в видимом диапазоне
            if (tensionPointsDrawn === 0 && compressionPointsDrawn === 0) {
              console.warn('[LAYER 1] Нет данных longitudinalForces в видимом диапазоне!', {
                displayStartCoord,
                displayEndCoord,
                dataRangeStart: longitudinalForces[0]?.distance,
                dataRangeEnd: longitudinalForces[longitudinalForces.length - 1]?.distance,
              });
            }

            // ЛЕГЕНДА
            ctx.save();
            const legendX = marginLeft + chartWidth - 120;
            const legendY = LAYER1_TOP + 25;

            // Легенда для растяжения (красный)
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(legendX, legendY, 12, 12);
            ctx.fillStyle = '#374151';
            ctx.font = fontSize(11);
            ctx.textAlign = 'left';
            ctx.fillText('Растяжение', legendX + 18, legendY + 9);

            // Легенда для сжатия (синий)
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(legendX, legendY + 20, 12, 12);
            ctx.fillStyle = '#374151';
            ctx.fillText('Сжатие', legendX + 18, legendY + 29);

            ctx.restore();
          } else {
            console.warn('[LAYER 1] longitudinalForces пуст или не определен');
          }
        }

        // ====================================
        // LAYER 2: SPEED CURVES (160-480px)
        // ====================================
        // ====================================
        // ====================================
        const layer2Top = LAYER2_TOP + 20;
        const layer2Bottom = LAYER2_TOP + LAYER2_HEIGHT - 20;
        const layer2Height = layer2Bottom - layer2Top;

        // Координаты для блока подписей справа
        const legendX = marginLeft + chartWidth - 150 - 56; // 150px от правого края
        const legendStartY = LAYER2_TOP + 25;

        // Draw layer border
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = lineWidth(1);
        ctx.strokeRect(marginLeft, LAYER2_TOP, chartWidth, LAYER2_HEIGHT);

        // Преобразование скорости (км/ч → Y) for Layer 2
        const speedToY = (speed: number) => {
          if (!isFinite(speed)) {
            return layer2Bottom;
          }
          const maxSpeed = 90;
          const y = layer2Top + layer2Height - (speed / maxSpeed) * layer2Height;

          if (!isFinite(y)) {
            return layer2Bottom;
          }
          return y;
        };

        // Сетка по Y (скорость 0–90)
        ctx.save();
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = lineWidth(1);
        ctx.fillStyle = '#9ca3af';
        ctx.font = fontSize(11);
        ctx.textAlign = 'right';
        ctx.save();

        for (let speed = 0; speed <= 90; speed += 5) {
          const y = speedToY(speed);
          ctx.beginPath();
          ctx.setLineDash([1, 3]);
          ctx.moveTo(marginLeft, y);
          ctx.lineTo(marginLeft + chartWidth, y);
          ctx.stroke();
          ctx.fillText(`${speed}`, marginLeft - 10, y + 4);
        }

        // Сетка по X (км) с адаптивным шагом
        ctx.textAlign = 'center';
        ctx.fillStyle = '#9ca3af';

        // ФИКСИРОВАННАЯ СЕТКА (зум отключен)
        let gridInterval = 1; // сетка каждые 1 км
        let labelInterval = 2; // подписи каждые 2 км

        // Если участок короткий, уменьшаем шаг
        if (displayTrackLength <= 50) {
          gridInterval = 5;
          labelInterval = 10;
        }
        if (displayTrackLength <= 20) {
          gridInterval = 2;
          labelInterval = 5;
        }
        if (displayTrackLength <= 10) {
          gridInterval = 1;
          labelInterval = 2;
        }

        const generateDisplayCoordinates = () => {
          const coordinates: number[] = [];
          let current = displayStartCoord;

          while (current <= displayEndCoord) {
            coordinates.push(current);
            current += gridInterval;
          }

          if (coordinates[coordinates.length - 1] < displayEndCoord) {
            coordinates.push(displayEndCoord);
          }

          return coordinates;
        };

        const displayCoordinates = generateDisplayCoordinates();

        for (const coord of displayCoordinates) {
          const x = kmToX(coord);
          ctx.strokeStyle = '#e5e7eb';
          ctx.beginPath();
          ctx.moveTo(x, layer2Top);
          ctx.lineTo(x, layer2Bottom);
          ctx.stroke();

          const displayValue = isReversed ? displayEndCoord - (coord - displayStartCoord) : coord;
          if (
            Math.round(displayValue) % labelInterval === 0 ||
            coord === displayStartCoord ||
            coord === displayEndCoord
          ) {
            ctx.fillText(`${displayValue.toFixed(coord % 1 === 0 ? 0 : 1)}`, x, layer2Bottom + 18);
          }
        }

        // Axes
        ctx.setLineDash([]);
        //ctx.strokeStyle = '#374151';
        ctx.lineWidth = lineWidth(2);

        // X axis
        ctx.beginPath();
        ctx.moveTo(marginLeft, layer2Bottom);
        ctx.lineTo(marginLeft + chartWidth, layer2Bottom);
        ctx.stroke();

        // Y axis
        ctx.beginPath();
        ctx.moveTo(marginLeft, layer2Top);
        ctx.lineTo(marginLeft, layer2Bottom);
        ctx.stroke();

        // Axis labels
        ctx.fillStyle = '#374151';
        ctx.font = fontSize(12);
        ctx.textAlign = 'center';
        ctx.fillText('Координата (км)', marginLeft + chartWidth / 2, layer2Bottom + 40);

        ctx.save();
        ctx.translate(marginLeft - 50, layer2Top + layer2Height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Скорость (км/ч)', 0, 0);
        ctx.restore();
        ctx.setLineDash([]);

        ctx.translate(marginLeft - 50, layer2Top - 110);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Динамика оптимальная', 0, 0);
        ctx.restore();

        // Кривая скоростных ограничений
        // Кривая скоростных ограничений (КРАСНАЯ ЛИНИЯ)

        if (displaySettings.speedLimits && speedLimits && speedLimits.length > 0) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = lineWidth(2.5);
          ctx.beginPath();

          // Фильтруем ограничения, которые попадают в видимый диапазон
          // ВАЖНО: координаты идут в ОБРАТНОМ порядке (1782 → 1610)
          const relevantLimits = speedLimits.filter(
            (limit) => limit.start >= displayEndCoord && limit.end <= displayStartCoord
          );

          if (relevantLimits.length > 0) {
            let started = false;
            let lastSpeed = relevantLimits[0].limit;

            relevantLimits.forEach((limit, index) => {
              const segmentStart = Math.max(
                displayEndCoord,
                Math.min(displayStartCoord, limit.start)
              );
              const segmentEnd = Math.max(displayEndCoord, Math.min(displayStartCoord, limit.end));

              // Используем kmToX1 для правильного преобразования координат (справа налево)
              const startX = kmToX1(segmentStart);
              const endX = kmToX1(segmentEnd);
              const y = speedToY(limit.limit);

              if (!started) {
                // Первая точка
                ctx.moveTo(startX, y);
                started = true;
              } else {
                // Проверяем, изменилась ли скорость
                if (limit.limit !== lastSpeed) {
                  // Вертикальный переход при смене ограничения
                  ctx.lineTo(startX, speedToY(lastSpeed));
                  ctx.lineTo(startX, y);
                } else {
                  // Продолжаем горизонтальную линию
                  ctx.lineTo(startX, y);
                }
              }

              // Горизонтальная линия до конца сегмента
              ctx.lineTo(endX, y);
              lastSpeed = limit.limit;
            });

            ctx.stroke();
          } else {
            console.warn('[LAYER 2] Нет ограничений скорости в видимом диапазоне');
          }

          if (displaySettings.speedLimits) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(legendX, legendStartY, 12, 12);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = lineWidth(0.5);
            ctx.strokeRect(legendX, legendStartY, 12, 12);

            ctx.fillStyle = '#374151';
            ctx.font = fontSize(11);
            ctx.textAlign = 'left';
            ctx.fillText('Ограничения скорости', legendX + 18, legendStartY + 9);
          }
        }

        // КООРДИНАТНАЯ ШКАЛА (18px ниже оси X)
        // =============================================================================

        const rulerY = layer2Bottom + 18; // Нижняя линия шкалы (18px ниже оси X)
        const rulerTickHeight = 18; // Высота штриха (от layer2Bottom до rulerY)

        // Рисуем нижнюю горизонтальную линию шкалы
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = lineWidth(2);
        ctx.beginPath();
        ctx.moveTo(marginLeft, rulerY);
        ctx.lineTo(marginLeft + chartWidth, rulerY);
        ctx.stroke();

        ctx.save();

        // Определяем шаг сетки в зависимости от масштаба
        let kmInterval = 1; // По умолчанию каждый километр

        const totalKm = Math.abs(displayEndCoord - displayStartCoord);
        if (totalKm > 100) {
          kmInterval = 1;
        } else if (totalKm > 50) {
          kmInterval = 1;
        } else if (totalKm > 20) {
          kmInterval = 1;
        } else {
          kmInterval = 1;
        }

        // Генерируем отметки для шкалы
        // ВАЖНО: координаты идут справа налево (1782 → 1610)
        const rulerMarks: number[] = [];
        for (
          let km = Math.ceil(displayEndCoord);
          km <= Math.floor(displayStartCoord);
          km += kmInterval
        ) {
          rulerMarks.push(km);
        }

        // Рисуем вертикальные штрихи и пунктирные линии вверх
        ctx.save();

        rulerMarks.forEach((km, index) => {
          const x = kmToX1(km);

          // 1. БЛЕДНАЯ ПУНКТИРНАЯ ЛИНИЯ ВВЕРХ (до верхнего края Layer 2)
          ctx.strokeStyle = '#e5e7eb'; // Бледно-серый
          ctx.lineWidth = lineWidth(1);
          ctx.setLineDash([2, 4]); // Короткий пунктир
          ctx.beginPath();
          ctx.moveTo(x, layer2Top);
          ctx.lineTo(x, layer2Bottom);
          ctx.stroke();
          ctx.setLineDash([]); // Сброс пунктира

          // 2. ВЕРТИКАЛЬНЫЙ ШТРИХ ШКАЛЫ (от оси X вниз)
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = lineWidth(1.5);
          ctx.beginPath();
          ctx.moveTo(x, layer2Bottom);
          ctx.lineTo(x, rulerY);
          ctx.stroke();

          // 3. ПОДПИСЬ КИЛОМЕТРА (справа от штриха)
          ctx.fillStyle = '#374151';
          ctx.font = fontSize(10);
          ctx.textAlign = 'left'; // Подпись справа от штриха
          ctx.textBaseline = 'middle';
          ctx.fillText(`${km}`, x + 3, rulerY - 8); // +3px вправо, +9px вниз
        });

        ctx.restore();

        if (displaySettings.optimalSpeedCurve && speedCurves && speedCurves.length > 0) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = lineWidth(2);
          //ctx.setLineDash([5, 3]);
          ctx.beginPath();

          // Фильтруем точки в видимом диапазоне
          const visiblePoints = speedCurves.filter(
            (point) =>
              point.distance >= displayEndCoord &&
              point.distance <= displayStartCoord &&
              point.optimalSpeed !== null
          );

          if (visiblePoints.length > 0) {
            let started = false;

            visiblePoints.forEach((point, index) => {
              const x = kmToX1(point.distance);
              const y = speedToY(point.optimalSpeed!);

              if (!started) {
                ctx.moveTo(x, y);
                started = true;
              } else {
                ctx.lineTo(x, y);
              }
            });

            ctx.stroke();
          }

          ctx.setLineDash([]);

          // Подпись
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(legendX, legendStartY + 20, 12, 12);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = lineWidth(0.5);
          ctx.strokeRect(legendX, legendStartY + 20, 12, 12);

          ctx.fillStyle = '#374151';
          ctx.fillText('Оптимальная кривая скорости', legendX + 18, legendStartY + 29);
        }

        // =============================================================================
        // 3. ОТРИСОВКА ФАКТИЧЕСКОЙ КРИВОЙ (ЗЕЛЁНАЯ ЛИНИЯ)
        // =============================================================================

        // Фактическая кривая скорости (ЗЕЛЁНАЯ ЛИНИЯ)
        if (displaySettings.actualSpeedCurve && speedCurves && speedCurves.length > 0) {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = lineWidth(2.5);
          ctx.beginPath();

          // Фильтруем точки в видимом диапазоне
          const visiblePoints = speedCurves.filter(
            (point) =>
              point.distance >= displayEndCoord &&
              point.distance <= displayStartCoord &&
              point.actualSpeed !== null
          );

          if (visiblePoints.length > 0) {
            let started = false;

            visiblePoints.forEach((point, index) => {
              const x = kmToX1(point.distance);
              const y = speedToY(point.actualSpeed!);

              if (!started) {
                ctx.moveTo(x, y);
                started = true;
              } else {
                ctx.lineTo(x, y);
              }
            });

            ctx.stroke();
          }

          // Подпись
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(legendX, legendStartY + 40, 12, 12);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = lineWidth(0.5);
          ctx.strokeRect(legendX, legendStartY + 40, 12, 12);

          ctx.fillStyle = '#374151';
          ctx.fillText('Фактическая кривая скорости', legendX + 18, legendStartY + 49);

          ctx.restore();
        }

        // Station markers (vertical lines in Layer 2)
        // ОТОБРАЖЕНИЕ СТАНЦИЙ (вертикальные линии, иконки, подписи)
        if (trackSection && trackSection.stations && trackSection.stations.length > 0) {
          trackSection.stations.forEach((station, index) => {
            // Используем startCoord как основную координату станции
            let stationKm = station.startCoord;
            if (station?.coord) stationKm = station?.coord;

            // Проверяем, попадает ли станция в видимый диапазон
            if (stationKm < displayEndCoord || stationKm > displayStartCoord) {
              return; // Станция за пределами видимости
            }

            const xWorld = kmToX1(stationKm);

            // ================================================================
            // 1. ВЕРТИКАЛЬНАЯ ПУНКТИРНАЯ ЛИНИЯ через ВСЕ 4 СЛОЯ
            // ================================================================
            ctx.save();
            ctx.strokeStyle = '#9ca3af'; // Светло-серый
            ctx.lineWidth = lineWidth(1.5);
            ctx.setLineDash([4, 4]); // Пунктир

            ctx.beginPath();
            ctx.moveTo(xWorld, LAYER2_TOP); // От верха Layer 1
            ctx.lineTo(xWorld, LAYER2_TOP + LAYER2_HEIGHT); // До низа Layer 4
            ctx.stroke();

            ctx.setLineDash([]); // Сброс пунктира
            ctx.restore();

            // ================================================================
            // 2. ИКОНКА СТАНЦИИ (canvas-версия SVG)
            // ================================================================
            // Размещаем иконку НИЖЕ Layer 2 (между Layer 2 и Layer 3)
            const rulerY = layer2Bottom + 18; // Координатная шкала
            const iconY = rulerY - 40; // 10px ВЫШЕ шкалы
            const iconRadius = 10;

            ctx.save();

            // Белая половина (левая)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(xWorld, iconY, iconRadius, Math.PI / 2, -Math.PI / 2, false);
            ctx.closePath();
            ctx.fill();

            // Чёрная половина (правая)
            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.arc(xWorld, iconY, iconRadius, -Math.PI / 2, Math.PI / 2, false);
            ctx.closePath();
            ctx.fill();

            // Обводка всей иконки
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = lineWidth(2);
            ctx.beginPath();
            ctx.arc(xWorld, iconY, iconRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Вертикальная линия вниз от иконки (ножка)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = lineWidth(2);
            ctx.beginPath();
            ctx.moveTo(xWorld, iconY + iconRadius);
            ctx.lineTo(xWorld, iconY + iconRadius + 10);
            ctx.stroke();

            ctx.restore();

            // ================================================================
            // 3. ПОДПИСЬ СТАНЦИИ (название)
            // ================================================================
            // Размещаем название НАД иконкой
            ctx.save();
            ctx.fillStyle = '#1f2937';
            ctx.font = fontSize(11);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            // Белый фон под текстом для читаемости
            const textMetrics = ctx.measureText(station.stationName);
            const textWidth = textMetrics.width;
            const textHeight = 14;
            const padding = 4;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(
              xWorld - textWidth / 2 - padding,
              iconY - iconRadius - textHeight - padding - 4,
              textWidth + padding * 2,
              textHeight + padding * 2
            );

            // Текст названия
            ctx.fillStyle = '#1f2937';
            ctx.fillText(station.stationName, xWorld, iconY - iconRadius - 4);

            ctx.restore();

            // ================================================================
            // 4. КООРДИНАТА СТАНЦИИ (опционально)
            // ================================================================
            // Показываем координату ПОД иконкой (мелким шрифтом)
            ctx.save();
            ctx.fillStyle = '#6b7280';
            ctx.font = fontSize(9);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`${stationKm.toFixed(1)} км`, xWorld, iconY + iconRadius - 44);
            ctx.restore();
          });
        }

        // =========

        // ====================================
        // LAYER 3: TRACK PROFILE (480-640px)
        // ====================================
        if (
          displaySettings.trackProfile &&
          trackSection &&
          trackSection.pathProfiles &&
          trackSection.pathProfiles.length > 0
        ) {
          const layer3Top = LAYER3_TOP + 10;
          const layer3Height = LAYER3_HEIGHT - 20;
          const layer3Bottom = layer3Top + layer3Height;

          // Draw layer border
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = lineWidth(1);
          ctx.strokeRect(marginLeft, LAYER3_TOP, chartWidth, LAYER3_HEIGHT);

          // Top and bottom lines
          const profileStripTop = layer3Top;
          const profileStripBottom = layer3Bottom;

          ctx.strokeStyle = '#374151';
          ctx.lineWidth = lineWidth(2);
          ctx.beginPath();
          ctx.moveTo(marginLeft, profileStripTop);
          ctx.lineTo(marginLeft + chartWidth, profileStripTop);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(marginLeft, profileStripBottom);
          ctx.lineTo(marginLeft + chartWidth, profileStripBottom);
          ctx.stroke();

          // ИСПРАВЛЕННАЯ ФИЛЬТРАЦИЯ (учитываем обратный порядок координат)
          const relevantProfiles = trackSection.pathProfiles.filter((profile) => {
            const minProfileCoord = Math.min(profile.startCoord, profile.endCoord);
            const maxProfileCoord = Math.max(profile.startCoord, profile.endCoord);

            const minDisplayCoord = Math.min(displayStartCoord, displayEndCoord); // 1610
            const maxDisplayCoord = Math.max(displayStartCoord, displayEndCoord); // 1782

            // Профиль пересекается, если его диапазоны перекрываются
            const intersects =
              maxProfileCoord >= minDisplayCoord && // 1789 >= 1610 ✅
              minProfileCoord <= maxDisplayCoord; // 1781 <= 1782 ✅

            return intersects;
          });

          relevantProfiles.forEach((profile, index) => {
            // 1. ОБРЕЗКА ПО ВИДИМОМУ ДИАПАЗОНУ
            const segmentStart = Math.max(profile.startCoord, displayEndCoord);
            const segmentEnd = Math.min(profile.endCoord, displayStartCoord);

            // 2. ПРЕОБРАЗОВАНИЕ В ПИКСЕЛИ
            const startX = kmToX2(segmentStart);
            const endX = kmToX2(segmentEnd);

            // Вертикальные линии-разделители
            // Рисуем разделитель в начале каждого сегмента (кроме первого)
            if (index > 0) {
              ctx.strokeStyle = '#374151';
              ctx.lineWidth = lineWidth(1.5);
              ctx.beginPath();
              ctx.moveTo(startX, profileStripTop);
              ctx.lineTo(startX, profileStripBottom);
              ctx.stroke();
            }

            // Диагональная линия уклона
            if (profile.slopePromille !== 0 && Math.abs(endX - startX) > 5) {
              ctx.strokeStyle = '#64748b';
              ctx.lineWidth = lineWidth(2);
              ctx.beginPath();

              if (profile.slopePromille < 0) {
                // Спуск: движение ВПРАВО (к началу пути 1782) - линия идёт ВВЕРХ
                // На canvas: справа (startX) ВЫШЕ, слева (endX) НИЖЕ
                ctx.moveTo(startX, profileStripTop);
                ctx.lineTo(endX, profileStripBottom);
              } else if (profile.slopePromille > 0) {
                // Подъём: движение ВПРАВО (к началу пути 1782) - линия идёт ВНИЗ
                // На canvas: справа (startX) НИЖЕ, слева (endX) ВЫШЕ
                ctx.moveTo(startX, profileStripBottom);
                ctx.lineTo(endX, profileStripTop);
              }

              ctx.stroke();
            }

            // Подпись уклона
            if (Math.abs(endX - startX) > 40) {
              const centerX = (startX + endX) / 2;
              const centerY = (profileStripTop + profileStripBottom) / 2;

              const lengthKm = Math.abs(profile.endCoord - profile.startCoord);
              const slopeText = profile.slopePromille !== 0 ? `${profile.slopePromille}‰` : '0‰';
              const lengthText =
                lengthKm >= 1 ? `${lengthKm.toFixed(1)}` : `${(lengthKm * 1000).toFixed(0)}м`;

              ctx.font = fontSize(10);
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const slopeTextWidth = ctx.measureText(slopeText).width;
              const lengthTextWidth = ctx.measureText(lengthText).width;
              const maxTextWidth = Math.max(slopeTextWidth, lengthTextWidth);

              const padding = 4; // Отступ вокруг текста
              const lineHeight = 12; // Высота одной строки
              const totalHeight = lineHeight * 2; // Две строки

              // Белая тень для читаемости
              ctx.fillStyle = 'rgba(255, 255, 255)'; // Почти непрозрачный белый
              ctx.fillRect(
                centerX - maxTextWidth / 2 - padding,
                centerY - totalHeight / 2 - padding,
                maxTextWidth + padding * 2,
                totalHeight + padding * 2
              );

              // Уклон
              ctx.fillStyle = '#475569';
              ctx.fillText(slopeText, centerX, centerY - 6);

              // Протяженность
              ctx.fillStyle = '#64748b';
              ctx.font = fontSize(9);
              ctx.fillText(lengthText, centerX, centerY + 6);
            }
          });

          // Label
          ctx.translate(marginLeft - 50, layer3Top + 70);
          ctx.fillStyle = '#374151';
          ctx.font = fontSize(12);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText('Профиль пути', 0, 0);
          ctx.restore();
        }

        // LAYER 4: REGIME BANDS AND ARROWS (640-800px)

        if (
          displaySettings.regimeBands &&
          chartData?.workflow?.regimeArrows &&
          chartData.workflow.locomotive
        ) {
          const layer4Top = LAYER4_TOP + 10;
          const arrowY = layer4Top + 30;

          // Draw layer border
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = lineWidth(1);
          ctx.strokeRect(marginLeft, LAYER4_TOP, chartWidth, LAYER4_HEIGHT);

          /*chartData.workflow.regimeArrows.forEach((arrow, index) => {
            const mode = chartData.workflow?.locomotive?.tractionModes.find(
              (m) => m.id === arrow.modeId
            );
            if (!mode) return;

            const startX = kmToX1(arrow.startKm);
            const endX = kmToX1(arrow.endKm);
            const isSelected = selectedArrow === arrow.id;
            const isHovered = hoveredArrow?.arrowId === arrow.id;

            if (isSelected) {
              ctx.globalAlpha = 0.15;
              for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = lineWidth(12 + i * 4);
                ctx.beginPath();
                ctx.moveTo(startX, arrowY);
                ctx.lineTo(endX, arrowY);
                ctx.stroke();
              }
              ctx.globalAlpha = 1;

              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = lineWidth(5);
              ctx.globalAlpha = 0.6;
              ctx.beginPath();
              ctx.moveTo(startX, arrowY);
              ctx.lineTo(endX, arrowY);
              ctx.stroke();
              ctx.globalAlpha = 1;
            }

            ctx.strokeStyle = mode.color;
            ctx.lineWidth = isSelected ? lineWidth(4) : isHovered ? lineWidth(4) : lineWidth(3);
            ctx.setLineDash(
              mode.lineStyle === 'dashed' ? [8, 4] : mode.lineStyle === 'dotted' ? [2, 4] : []
            );

            ctx.beginPath();
            ctx.moveTo(startX, arrowY);
            ctx.lineTo(endX, arrowY);
            ctx.stroke();

            const arrowheadSize = isSelected ? 12 : 10;
            ctx.fillStyle = mode.color;
            ctx.beginPath();
            ctx.moveTo(endX, arrowY);
            ctx.lineTo(endX - arrowheadSize, arrowY - arrowheadSize / 2);
            ctx.lineTo(endX - arrowheadSize, arrowY + arrowheadSize / 2);
            ctx.fill();

            ctx.setLineDash([]);

            ctx.fillStyle = mode.color;
            ctx.font = fontSize(isSelected ? 15 : 13);
            ctx.textAlign = 'center';

            if (isSelected) {
              const labelText = mode.label;
              const textMetrics = ctx.measureText(labelText);
              const labelX = (startX + endX) / 2;
              const labelY = arrowY - 10;
              const padding = 4;

              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(
                labelX - textMetrics.width / 2 - padding,
                labelY - 12,
                textMetrics.width + padding * 2,
                16
              );
              ctx.fillStyle = mode.color;
            }

            ctx.fillText(mode.label, (startX + endX) / 2, arrowY - 12);

            if (isSelected) {
              const handleRadius = 7;
              const handleStrokeWidth = 2.5;

              if (index > 0) {
                const isStartHovered =
                  hoveredArrow?.handle === 'start' && hoveredArrow?.arrowId === arrow.id;
                const isStartDragged =
                  draggedArrow?.handle === 'start' && draggedArrow?.arrowId === arrow.id;
                const showLimitFeedback = isStartDragged && resizeLimitReached;

                if (isStartHovered || showLimitFeedback) {
                  ctx.globalAlpha = 0.3;
                  ctx.fillStyle = showLimitFeedback ? '#ef4444' : '#fbbf24';
                  ctx.beginPath();
                  ctx.arc(startX, arrowY, handleRadius * 2, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.globalAlpha = 1;
                }

                ctx.fillStyle = showLimitFeedback
                  ? '#ef4444'
                  : isStartHovered
                    ? '#fbbf24'
                    : '#ffffff';
                ctx.strokeStyle = showLimitFeedback ? '#ef4444' : '#fbbf24';
                ctx.lineWidth = handleStrokeWidth;
                ctx.beginPath();
                ctx.arc(startX, arrowY, handleRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#374151';
                ctx.beginPath();
                ctx.arc(startX, arrowY, handleRadius / 3, 0, Math.PI * 2);
                ctx.fill();
              }

              const isEndHovered =
                hoveredArrow?.handle === 'end' && hoveredArrow?.arrowId === arrow.id;
              const isEndDragged =
                draggedArrow?.handle === 'end' && draggedArrow?.arrowId === arrow.id;
              const showLimitFeedback = isEndDragged && resizeLimitReached;

              if (isEndHovered || showLimitFeedback) {
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = showLimitFeedback ? '#ef4444' : '#fbbf24';
                ctx.beginPath();
                ctx.arc(endX, arrowY, handleRadius * 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
              }

              ctx.fillStyle = showLimitFeedback ? '#ef4444' : isEndHovered ? '#fbbf24' : '#ffffff';
              ctx.strokeStyle = showLimitFeedback ? '#ef4444' : '#fbbf24';
              ctx.lineWidth = handleStrokeWidth;
              ctx.beginPath();
              ctx.arc(endX, arrowY, handleRadius, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#374151';
              ctx.beginPath();
              ctx.arc(endX, arrowY, handleRadius / 3, 0, Math.PI * 2);
              ctx.fill();
            }
          });*/
          //ctx.strokeStyle = '#d1d5db';
          //ctx.lineWidth = lineWidth(1);
          //ctx.strokeRect(marginLeft, LAYER4_TOP, chartWidth, LAYER4_HEIGHT - 30);

          // 3. ВТОРАЯ ЛЕНТА РЕЖИМОВ (regimesV2)
          // ========================================
          if (displaySettings.regimeBands && regimesV2 && regimesV2.length > 0) {
            const regimeBandsY2 = LAYER4_TOP + 86;
            const regimeBandsY3 = LAYER4_TOP + 124;
            const bandHeight = 16;

            // Маппинг цветов (тот же)
            const colorMap: Record<string, string> = {
              blue: '#0000c0',
              cyan: '#788cff',
              yellow: '#ffff00',
              green: '#49d913',
              orange: '#ffaa00',
              red: '#ff0000',
            };

            // Фильтруем видимые сегменты
            const visibleSegments2 = regimesV2.filter(
              (segment) => segment.endKm >= displayEndCoord && segment.startKm <= displayStartCoord
            );

            // Фильтруем видимые сегменты
            const visibleSegments3 = regimesV2.filter(
              (segment) => segment.endKm >= displayEndCoord && segment.startKm <= displayStartCoord
            );

            // Рисуем цветные сегменты
            visibleSegments2.forEach((segment) => {
              const segmentStart = Math.max(segment.startKm, displayEndCoord);
              const segmentEnd = Math.min(segment.endKm, displayStartCoord);

              const startX = kmToX1(segmentStart);
              const endX = kmToX1(segmentEnd);
              const width = Math.abs(endX - startX);

              const fillColor = colorMap[segment.color] || '#9ca3af';

              ctx.fillStyle = fillColor;
              ctx.fillRect(Math.min(startX, endX), regimeBandsY2, width, bandHeight);

              // Подпись НАД лентой
              if (width > 30 && segment.label) {
                ctx.save();
                ctx.fillStyle = '#000000';
                ctx.font = fontSize(9);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(segment.label, (startX + endX) / 2, regimeBandsY2 - 2);
                ctx.restore();
              }
            });

            // Рисуем цветные сегменты
            visibleSegments3.forEach((segment) => {
              const segmentStart = Math.max(segment.startKm, displayEndCoord);
              const segmentEnd = Math.min(segment.endKm, displayStartCoord);

              const startX = kmToX1(segmentStart);
              const endX = kmToX1(segmentEnd);
              const width = Math.abs(endX - startX);

              const fillColor = colorMap[segment.color] || '#9ca3af';

              ctx.fillStyle = fillColor;
              ctx.fillRect(Math.min(startX, endX), regimeBandsY3, width, bandHeight);

              // Подпись НАД лентой
              if (width > 30 && segment.label) {
                ctx.save();
                ctx.fillStyle = '#000000';
                ctx.font = fontSize(9);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(segment.label, (startX + endX) / 2, regimeBandsY3 - 2);
                ctx.restore();
              }
            });

            // ОБЩАЯ РАМКА
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = lineWidth(1.5);
            ctx.strokeRect(marginLeft, regimeBandsY2, chartWidth, bandHeight);
            ctx.strokeRect(marginLeft, regimeBandsY3, chartWidth, bandHeight);

            // Заголовок
            ctx.save();
            ctx.fillStyle = '#374151';
            ctx.font = fontSize(11);
            ctx.textAlign = 'left';
            ctx.fillText('Фактические режимы:', marginLeft + 10, regimeBandsY2 - 20);
            ctx.restore();

            // Легенда НЕ нужна (уже есть у первой ленты)
          }

          // Label
          ctx.save();
          ctx.translate(marginLeft - 50, layer4Top + 95);
          ctx.fillStyle = '#374151';
          ctx.font = fontSize(12);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText('Режимы', 0, 0);
          ctx.restore();
        }

        // ========================================
        // 2. ЛЕНТЫ ОПТИМАЛЬНЫХ РЕЖИМОВ (новый блок)
        // ========================================
        if (displaySettings.regimeBands && optimalRegimes && optimalRegimes.length > 0) {
          const regimeBandsY = LAYER4_TOP + 30;
          const bandHeight = 16;

          // Маппинг цветов
          const colorMap: Record<string, string> = {
            blue: '#0000c0',
            cyan: '#788cff',
            yellow: '#ffff00',
            green: '#49d913',
            orange: '#ffaa00',
            red: '#ff0000',
          };

          // Фильтруем видимые сегменты
          const visibleSegments = optimalRegimes.filter(
            (segment) => segment.endKm >= displayEndCoord && segment.startKm <= displayStartCoord
          );

          // Рисуем цветные сегменты (БЕЗ границ)
          visibleSegments.forEach((segment) => {
            const segmentStart = Math.max(segment.startKm, displayEndCoord);
            const segmentEnd = Math.min(segment.endKm, displayStartCoord);

            const startX = kmToX1(segmentStart);
            const endX = kmToX1(segmentEnd);
            const width = Math.abs(endX - startX);

            const fillColor = colorMap[segment.color] || '#9ca3af';

            // Прямоугольник режима (БЕЗ strokeRect)
            ctx.fillStyle = fillColor;
            ctx.fillRect(Math.min(startX, endX), regimeBandsY, width, bandHeight);

            // Подпись НАД лентой (если есть место)
            if (width > 30 && segment.label) {
              ctx.save();
              ctx.fillStyle = '#000000'; // Черный цвет
              ctx.font = fontSize(9); // Маленький шрифт
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';

              // Текст НАД лентой (без обводок)
              ctx.fillText(segment.label, (startX + endX) / 2, regimeBandsY - 2);
              ctx.restore();
            }
          });

          // ОБЩАЯ РАМКА вокруг всех лент
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = lineWidth(1.5);
          ctx.strokeRect(marginLeft, regimeBandsY, chartWidth, bandHeight);

          // Заголовок секции (над лентой)
          ctx.save();
          ctx.fillStyle = '#374151';
          ctx.font = fontSize(11);
          ctx.textAlign = 'left';
          ctx.fillText('Оптимальные режимы:', marginLeft + 10, regimeBandsY - 20);
          ctx.restore();

          // ЛЕГЕНДА РЕЖИМОВ (под лентой)
          const legendX = marginLeft + chartWidth - 500;
          const legendY = regimeBandsY + bandHeight + 15;
          const swatchSize = 12;
          let currentX = legendX;

          const legendItems = [
            { color: colorMap.blue, label: 'Тяга' },
            { color: colorMap.cyan, label: 'Тяга под огр.' },
            { color: colorMap.yellow, label: 'Поддержание' },
            { color: colorMap.green, label: 'Выбег' },
            { color: colorMap.orange, label: 'Т под огр.' },
            { color: colorMap.red, label: 'РТ/Т0.8' },
          ];

          ctx.save();
          ctx.font = fontSize(10);
          ctx.textAlign = 'left';

          legendItems.forEach((item) => {
            ctx.fillStyle = item.color;
            ctx.fillRect(currentX, legendY, swatchSize, swatchSize);

            ctx.strokeStyle = '#374151';
            ctx.lineWidth = lineWidth(0.5);
            ctx.strokeRect(currentX, legendY, swatchSize, swatchSize);

            ctx.fillStyle = '#374151';
            ctx.fillText(item.label, currentX + swatchSize + 4, legendY + swatchSize - 2);

            const textWidth = ctx.measureText(item.label).width;
            currentX += swatchSize + 4 + textWidth + 15;
          });

          ctx.restore();
        }
        ctx.save();
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = lineWidth(2);
        ctx.beginPath();
        ctx.moveTo(marginLeft, LAYER4_TOP + LAYER4_HEIGHT);
        ctx.lineTo(marginLeft + chartWidth, LAYER4_TOP + LAYER4_HEIGHT);
        ctx.stroke();
        ctx.restore();

        // Дополнительная шкала км под стрелками (DISABLED - using Layer 2 labels instead)
        if (false && chartData?.workflow?.regimeArrows && chartData.workflow?.locomotive) {
          const layer4Top = LAYER4_TOP + 10;
          const arrowY = layer4Top + 30;
          const rulerY = arrowY + 40;

          ctx.strokeStyle = '#374151';
          ctx.lineWidth = lineWidth(2);
          ctx.beginPath();
          ctx.moveTo(kmToX(displayStartCoord), rulerY);
          ctx.lineTo(kmToX(displayEndCoord), rulerY);
          ctx.stroke();

          ctx.fillStyle = '#374151';
          ctx.font = fontSize(13);
          ctx.textAlign = 'center';

          const rulerCoordinates: number[] = [];
          let currentRuler = displayStartCoord;

          while (currentRuler <= displayEndCoord) {
            rulerCoordinates.push(currentRuler);
            currentRuler += 1;
          }

          if (rulerCoordinates[rulerCoordinates.length - 1] < displayEndCoord) {
            rulerCoordinates.push(displayEndCoord);
          }

          for (const coord of rulerCoordinates) {
            const x = kmToX(coord);
            const displayValue = isReversed ? displayEndCoord - (coord - displayStartCoord) : coord;
            const tickHeightRuler = Math.round(displayValue) % 5 === 0 ? 8 : 5;

            ctx.strokeStyle = '#374151';
            ctx.lineWidth = lineWidth(1.5);
            ctx.beginPath();
            ctx.moveTo(x, rulerY);
            ctx.lineTo(x, rulerY + tickHeightRuler);
            ctx.stroke();

            if (
              Math.round(displayValue) % 5 === 0 ||
              coord === displayStartCoord ||
              coord === displayEndCoord
            ) {
              ctx.fillText(`${displayValue.toFixed(0)}`, x, rulerY + 24);
            }
          }

          ctx.font = fontSize(13);
          ctx.textAlign = 'left';
          ctx.fillText('км', kmToX(displayEndCoord) + 10, rulerY + 8);
        }

        const drawOperationModeLine = (
          yPosition: number,
          segments: OperationModeSegment[],
          lineHeight: number
        ) => {
          segments.forEach((segment, index) => {
            const segmentStart = Math.max(displayStartCoord, segment.startKm);
            const segmentEnd = Math.min(displayEndCoord, segment.endKm);

            if (segmentStart >= segmentEnd) return;

            const startX = kmToX(segmentStart);
            const endX = kmToX(segmentEnd);

            let color: string;
            switch (segment.mode) {
              case 'acceleration':
                color = '#3b82f6';
                break;
              case 'stable':
                color = '#eab308';
                break;
              case 'coasting':
                color = '#22c55e';
                break;
              case 'braking':
                color = '#ef4444';
                break;
              case 'limit-traction':
                color = '#a855f7';
                break;
              case 'limit-braking':
                color = '#f97316';
                break;
              default:
                color = '#9ca3af';
            }

            ctx.fillStyle = color;
            ctx.fillRect(startX, yPosition, endX - startX, lineHeight);

            ctx.lineWidth = lineWidth(1);

            if (index === 0) {
              ctx.strokeStyle = '#1f2937';
              ctx.beginPath();
              ctx.moveTo(startX, yPosition);
              ctx.lineTo(startX, yPosition + lineHeight);
              ctx.stroke();
            } else {
              const prevSegment = segments[index - 1];
              let prevColor: string;
              switch (prevSegment.mode) {
                case 'acceleration':
                  prevColor = '#3b82f6';
                  break;
                case 'stable':
                  prevColor = '#eab308';
                  break;
                case 'coasting':
                  prevColor = '#22c55e';
                  break;
                case 'braking':
                  prevColor = '#ef4444';
                  break;
                case 'limit-traction':
                  prevColor = '#a855f7';
                  break;
                case 'limit-braking':
                  prevColor = '#f97316';
                  break;
                default:
                  prevColor = '#9ca3af';
              }

              ctx.strokeStyle = color === prevColor ? color : '#1f2937';
              ctx.beginPath();
              ctx.moveTo(startX, yPosition);
              ctx.lineTo(startX, yPosition + lineHeight);
              ctx.stroke();
            }

            if (index === segments.length - 1) {
              ctx.strokeStyle = '#1f2937';
              ctx.beginPath();
              ctx.moveTo(endX, yPosition);
              ctx.lineTo(endX, yPosition + lineHeight);
              ctx.stroke();
            }
          });
        };
        // Легенда режимов
        if (chartData?.workflow?.optimalSpeedCurve || chartData?.workflow?.actualSpeedCurve) {
          let legendY: number;
          const marginTop = 50;
          const chartHeight = 300;

          if (chartData?.workflow?.actualSpeedCurve && chartData.workflow.regimeArrows) {
            legendY = marginTop + chartHeight + 355;
          } else if (chartData.workflow.regimeArrows) {
            legendY = marginTop + chartHeight + 305;
          } else {
            legendY = marginTop + chartHeight + 205;
          }

          const swatchSize = 15;
          let currentX = marginLeft;
        }

        const drawCanvasObjects = async (
          ctx: CanvasRenderingContext2D,
          canvasObjects: any[],
          zoom: number,
          getPaletteObjectById: (id: string) => any
        ) => {
          if (!canvasObjects || canvasObjects.length === 0) return;

          for (const obj of canvasObjects) {
            ctx.save();

            const baseIconSize = 24;
            const iconSize = baseIconSize / (zoom || 1);

            // Получаем полный объект из палитры
            const fullObj = getPaletteObjectById(obj.subtype || obj.type);

            if (fullObj && fullObj.canvasIcon) {
              try {
                // Создаем временный div для рендеринга SVG
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-99999px';
                tempDiv.style.width = `${iconSize}px`;
                tempDiv.style.height = `${iconSize}px`;
                document.body.appendChild(tempDiv);

                // Рендерим React-элемент
                const root = (await import('react-dom/client')).createRoot(tempDiv);
                const iconElement = React.cloneElement(fullObj.canvasIcon as React.ReactElement, {
                  style: { width: '100%', height: '100%' },
                });

                await new Promise<void>((resolve) => {
                  root.render(iconElement);
                  setTimeout(resolve, 50);
                });

                // Получаем SVG элемент
                const svgElement = tempDiv.querySelector('svg');

                if (svgElement) {
                  // Получаем размеры из viewBox
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
                  let finalIconWidth = iconSize;
                  let finalIconHeight = iconSize;

                  if (svgAspectRatio > 1) {
                    finalIconHeight = iconSize / svgAspectRatio;
                  } else if (svgAspectRatio < 1) {
                    finalIconWidth = iconSize * svgAspectRatio;
                  }

                  // Клонируем SVG для модификации
                  const svgClone = svgElement.cloneNode(true) as SVGElement;

                  // Получаем computed color из className
                  const computedColor = window.getComputedStyle(svgElement).color;

                  // Заменяем currentColor на конкретный цвет
                  const replaceCurrentColor = (element: Element) => {
                    ['stroke', 'fill'].forEach((attr) => {
                      if (element.getAttribute(attr) === 'currentColor') {
                        element.setAttribute(attr, computedColor);
                      }
                    });
                    Array.from(element.children).forEach((child) => replaceCurrentColor(child));
                  };

                  replaceCurrentColor(svgClone);

                  // Конвертируем в изображение
                  const svgData = new XMLSerializer().serializeToString(svgClone);
                  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                  const url = URL.createObjectURL(svgBlob);

                  const iconImg = new Image();
                  await new Promise<void>((resolve, reject) => {
                    iconImg.onload = () => resolve();
                    iconImg.onerror = reject;
                    iconImg.src = url;
                  });

                  // Рисуем иконку с правильными пропорциями
                  ctx.drawImage(
                    iconImg,
                    obj.x - finalIconWidth / 2,
                    obj.y - finalIconHeight / 2,
                    finalIconWidth,
                    finalIconHeight
                  );

                  URL.revokeObjectURL(url);
                }

                root.unmount();
                document.body.removeChild(tempDiv);

                // Рисуем label если есть
                if (obj.label) {
                  ctx.fillStyle = '#1f2937';
                  ctx.font = `${11 / zoom}px sans-serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';
                  ctx.fillText(obj.label, obj.x, obj.y + iconSize / 2 + 4);
                }
              } catch (error) {
                console.error('[ChartEditor] Ошибка отрисовки иконки:', error);
                // Fallback к синему кружку
                drawFallbackIcon(ctx, obj, iconSize, zoom);
              }
            } else {
              // Fallback к синему кружку
              drawFallbackIcon(ctx, obj, iconSize, zoom);
            }

            ctx.restore();
          }
        };

        if (displaySettings.objectMarkers && chartData.canvasObjects) {
          // Синхронная отрисовка всех объектов (кроме перетаскиваемого)
          drawCanvasObjectsSync(ctx, chartData.canvasObjects, zoom, {
            skipObjectId: draggedObject?.id,
            highlightObjectId: selectedObjectId || undefined,
          });
        }

        // Always render the dragged object on top synchronously to ensure it's visible during drag
        if (draggedObject && draggingObjectPosition) {
          ctx.save();
          const dotSize = 12;
          ctx.fillStyle = '#3b82f6';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / zoom;
          ctx.beginPath();
          ctx.arc(
            draggingObjectPosition.x,
            draggingObjectPosition.y,
            dotSize / zoom,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.stroke();

          if (draggedObject.label) {
            ctx.fillStyle = '#1f2937';
            ctx.font = `${11 / zoom}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(
              draggedObject.label,
              draggingObjectPosition.x,
              draggingObjectPosition.y + (dotSize + 4) / zoom
            );
          }
          ctx.restore();
        }

        ctx.restore(); // ВОЗВРАТ К ИСХОДНОЙ (НЕМАСШТАБИРОВАННОЙ) СИСТЕМЕ

        // Синхронная отрисовка перетаскиваемого объекта поверх всех остальных
        if (draggedObject && draggingObjectPosition) {
          console.debug('[drawWorkflowCanvas] WILL draw dragged object', {
            draggedObjectId: draggedObject.id,
            position: draggingObjectPosition,
          });
          drawDraggedObject(ctx, draggedObject, draggingObjectPosition, zoom);
        } else {
          console.debug('[drawWorkflowCanvas] NOT drawing dragged object', {
            draggedObject: !!draggedObject,
            draggingObjectPosition: !!draggingObjectPosition,
          });
        }

        // Рисуем рамку выделения (marquee) в экранных координатах
        if (marqueeStart && marqueeEnd) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0); // Сброс трансформаций

          const startX = Math.min(marqueeStart.x, marqueeEnd.x);
          const endX = Math.max(marqueeStart.x, marqueeEnd.x);
          const startY = 0; // От самого верха canvas
          const endY = baseHeight; // До самого низа

          // Полупрозрачная заливка
          ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.fillRect(startX, startY, endX - startX, endY);

          // Левая граница (толстая линия)
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX, endY);
          ctx.stroke();

          // Правая граница (толстая линия)
          ctx.beginPath();
          ctx.moveTo(endX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Верхняя и нижняя пунктирные линии
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, startY);
          ctx.moveTo(startX, endY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      } catch (error) {
        // Clear canvas and show error
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Ошибка при отрисовке графика', baseWidth / 2, baseHeight / 2 - 10);
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.fillText(String(error), baseWidth / 2, baseHeight / 2 + 15);
      }
    },
    [
      chartData.workflow?.trackSection,
      chartData.workflow?.optimalSpeedCurve,
      chartData.workflow?.actualSpeedCurve,
      chartData.workflow?.regimeArrows,
      chartData.workflow?.locomotive?.tractionModes,
      chartData.canvasObjects,
      displaySettings,
      panX,
      panY,
      selectedArrow,
      hoveredArrow,
      draggedArrow,
      resizeLimitReached,
      trainForceData,
      selectedObjectId,
      pixelsPerKm,
      draggingObjectPosition,
      selectedObjectId,
      drawDraggedObject,
      draggedObject, // <-- ЕСТЬ?
      drawCanvasObjectsSync, // <-- ЕСТЬ?
    ]
  );

  // ИСПРАВЛЕНИЕ: Сделали draw async
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isDrawing = false;
    let isCancelled = false; // Добавляем флаг отмены

    const draw = async () => {
      if (isDrawing || isCancelled) return;

      isDrawing = true;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        if (chartData.workflow?.trackSection) {
          await drawWorkflowCanvas(ctx, baseWidth, baseHeight, zoom);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, baseWidth, baseHeight);
          ctx.fillStyle = '#6b7280';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            'Выберите участок пути в боковой панели для начала работы',
            baseWidth / 2,
            baseHeight / 2
          );
        }
      } catch (error) {
        console.error('Ошибка при отрисовке:', error);
      } finally {
        isDrawing = false;
      }
    };

    const debouncedDraw = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    debouncedDraw();

    return () => {
      isCancelled = true; // Отменяем асинхронные операции
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    chartData.workflow?.trackSection?.id,
    chartData.canvasObjects,
    displaySettings,
    panX,
    panY,
    zoom,
    baseWidth,
    baseHeight,
    redrawTrigger,
    marqueeStart,
    marqueeEnd,
    pixelsPerKm,
    // ДОБАВЛЯЕМ недостающие зависимости:
    draggedObject?.id, // Только id, чтобы избежать лишних перерисовок
    draggingObjectPosition,
    selectedObjectId,
    draggedObject?.id,
    draggingObjectPosition,
    selectedObjectId,
    drawWorkflowCanvas,
  ]);

  const throttledLog = (message: string, interval: number = 1000) => {
    const now = Date.now();
    const win = window as unknown as { lastLogTime?: Record<string, number> };
    if (!win.lastLogTime) {
      win.lastLogTime = {};
    }
    if (!win.lastLogTime[message] || now - win.lastLogTime[message] > interval) {
      console.log(message);
      win.lastLogTime[message] = now;
    }
  };

  // VisioObjectPalette collapse state
  const [paletteCollapsed, setPaletteCollapsed] = useState(true);

  // Screenshot state variables (currently unused but kept for future use)
  // const [screenshotImage, setScreenshotImage] = useState<HTMLImageElement | null>(null);
  // const [screenshotLoadError, setScreenshotLoadError] = useState(false);

  // Сброс выделения стрелок при смене участка или локомотива
  useEffect(() => {
    setSelectedArrow(null);
    setDraggedArrow(null);
  }, [chart.workflow?.trackSection?.id, chart.workflow?.locomotive?.id]);

  // Расчёт базовой высоты (using fixed 4-layer structure)
  const calculateBaseHeight = () => {
    // Fixed 4-layer structure: 800px total
    // Layer 1: Force Dynamics (0-160px)
    // Layer 2: Speed Curves (160-480px)
    // Layer 3: Track Profile (480-640px)
    // Layer 4: Regime Bands (640-800px)
    return 800;
  };

  // Re-render tracking for debugging
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());

  // Обновление ширины холста по длине участка
  useEffect(() => {
    const trackLength = chart.workflow?.trackSection?.length || 200;

    if (!isFinite(trackLength) || trackLength <= 0 || trackLength > 10000) {
      if (baseWidth !== 2400) {
        setBaseWidth(2400);
      }
      return;
    }

    const marginLeft = 100;
    const marginRight = 100;
    const calculatedWidth = Math.max(2400, marginLeft + trackLength * pixelsPerKm + marginRight);

    if (calculatedWidth !== baseWidth) {
      setBaseWidth(calculatedWidth);
    }
  }, [chart.workflow?.trackSection?.length, baseWidth, pixelsPerKm]); // Добавить pixelsPerKm в зависимости

  // ==========================
  // ФУНКЦИЯ ОПРЕДЕЛЕНИЯ ОБЛАСТИ ХОЛСТА ПО ОСИ Y
  // (верхняя и нижняя граница рисуемой области)
  // ==========================
  const getCanvasContentYBounds = React.useCallback(() => {
    // Границы рабочей области в "мировых" координатах (до translate/scale)
    // Эти значения синхронизированы с drawWorkflowCanvas:
    const marginTop = 50; // ВЕРХНЯЯ ГРАНИЦА ОБЛАСТИ ХОЛСТА
    const marginBottom = 40;

    // Ниже основной диаграммы находятся:
    // - продольный профиль в виде полосы
    // - стрелки режимов
    // - шкала "км"
    // - идеальные и фактические режимы + легенда
    // Мы уже учли это в calculateBaseHeight, поэтому нижняя "интересная" граница — весь baseHeight
    const topY = marginTop;
    const bottomY = baseHeight; // НИЖНЯЯ ГРАНИЦА ОБЛАСТИ ХОЛСТА (всё, что рисуем, находится в этом диапазоне)

    return { topY, bottomY, marginTop, marginBottom };
  }, [baseHeight]);

  const resetToInitialView = React.useCallback(() => {
    if (!containerRef.current) return;

    // Параметры, которые дают правильный вид
    /*const marginLeft = 80;
    const leftPadding = 30;
    const marginTop = 50;
    const topOffset = 20;*/

    // Устанавливаем значения, которые работают в первом случае
    setZoom(1);
    setPanX(-30); // zoom = 1
  }, []);

  // Обработчик колесика: только горизонтальный масштаб, вертикальный зум заблокирован
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    if (e.shiftKey) {
      // Shift + колесо — горизонтальная панорама
      setPanX((prev) => prev - e.deltaY);
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + колесо — ТОЖЕ горизонтальная панорама (более быстрая)
      setPanX((prev) => prev - e.deltaY * 2);
    }
    // Обычное колесо — игнорируем
  };

  // ZOOM DISABLED - Рамка масштабирования (marquee) закомментирована
  const handleMarqueeZoomStart = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMarqueeStart({ x, y });
    setMarqueeEnd({ x, y });
  };

  const handleMarqueeZoomMove = (e: React.MouseEvent) => {
    if (!marqueeStart) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = marqueeStart.y; // ФИКСИРУЕМ Y (только горизонтальное выделение)

    setMarqueeEnd({ x, y });
  };

  const handleMarqueeZoomEnd = () => {
    if (!marqueeStart || !marqueeEnd) {
      setMarqueeStart(null);
      setMarqueeEnd(null);
      setIsMarqueeZoom(false);
      return;
    }

    const width = Math.abs(marqueeEnd.x - marqueeStart.x);

    // Минимальная ширина выделения
    if (width > 20) {
      const trackSection = chart.workflow?.trackSection;
      if (!trackSection) return;

      // Параметры карты
      const marginLeft = 80;
      const marginRight = 50;
      const chartWidth = baseWidth - marginLeft - marginRight;

      // Координаты выделения В ЭКРАННЫХ ПИКСЕЛЯХ (без учёта panX)
      const leftEdge = Math.min(marqueeStart.x, marqueeEnd.x);
      const rightEdge = Math.max(marqueeStart.x, marqueeEnd.x);

      // Преобразуем в МИРОВЫЕ координаты (учитываем panX)
      const leftWorldX = leftEdge - panX - marginLeft;
      const rightWorldX = rightEdge - panX - marginLeft;

      // Вычисляем километры (используем текущий масштаб)
      const displayStartCoord = 1782;
      const displayEndCoord = 1610;
      const totalKm = Math.abs(displayEndCoord - displayStartCoord);

      // Нормализуем позиции [0..1]
      const leftNormalized = leftWorldX / chartWidth;
      const rightNormalized = rightWorldX / chartWidth;

      // Вычисляем выбранный диапазон в км
      const selectedKmRange = Math.abs(rightNormalized - leftNormalized) * totalKm;

      console.log('[MARQUEE ZOOM]', {
        leftEdge,
        rightEdge,
        leftWorldX,
        rightWorldX,
        leftNormalized,
        rightNormalized,
        selectedKmRange,
        currentPixelsPerKm: pixelsPerKm,
      });

      // Вычисляем новый масштаб
      const containerWidth = containerRef.current?.clientWidth || 800;
      const availableWidth = containerWidth - 160; // margins
      const newPixelsPerKm = availableWidth / selectedKmRange;

      // Ограничиваем диапазон (10-160 px/км)
      const clampedPixelsPerKm = Math.max(10, Math.min(160, newPixelsPerKm));

      console.log('[MARQUEE ZOOM] New scale:', {
        availableWidth,
        newPixelsPerKm,
        clampedPixelsPerKm,
      });

      setPixelsPerKm(clampedPixelsPerKm);
      setPanX(0); // Сброс панорамы
    }

    // Сбрасываем marquee
    setMarqueeStart(null);
    setMarqueeEnd(null);
    setIsMarqueeZoom(false);
  };

  // Панорамирование — только по X (вертикальная панорама заблокирована)
  const handlePanStart = (e: React.MouseEvent) => {
    if (isMarqueeZoom || placingObject) return;

    // Проверяем ref для избежания race condition
    if (interactionStateRef.current.type !== 'none') {
      console.debug(
        '[ChartEditor] handlePanStart blocked - interaction in progress',
        interactionStateRef.current
      );
      return;
    }

    if (!hoveredArrow && !hoveredObject) {
      setSelectedArrow(null);
    }

    interactionStateRef.current = { type: 'panning' };
    setIsPanning(true);
    setPanStart({
      x: e.clientX - panX,
      y: e.clientY - panY,
    });
  };

  const handlePanMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Расчёт мировой позиции мыши в ЕДИНОЙ системе координат
    const newMousePosX = e.clientX - rect.left - panX;
    const newMousePosY = e.clientY - rect.top - panY;

    setMousePos({
      x: newMousePosX,
      y: newMousePosY,
    });

    setScreenMousePos({
      x: e.clientX,
      y: e.clientY,
    });

    // ============================================
    // ПРИОРИТЕТ 1: Перетаскивание объекта
    // ============================================
    if (draggedObject) {
      // Track drag movement distance for click vs drag detection
      if (dragStartPos && !hasDragMoved) {
        const dx = Math.abs(newMousePosX - dragStartPos.x);
        const dy = Math.abs(newMousePosY - dragStartPos.y);
        const DRAG_THRESHOLD = 5;
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          setHasDragMoved(true);
        }
      }

      // Обновляем позицию только если превышен порог движения
      if (hasDragMoved) {
        // Проверяем, изменилась ли позиция значительно
        if (draggingObjectPosition) {
          const dx = Math.abs(draggingObjectPosition.x - newMousePosX);
          const dy = Math.abs(draggingObjectPosition.y - newMousePosY);
          if (dx < 0.5 && dy < 0.5) {
            return; // Позиция почти не изменилась
          }
        }

        setDraggingObjectPosition({ x: newMousePosX, y: newMousePosY });
        console.debug('[ChartEditor] dragging object - updating position', {
          draggedId: draggedObject.id,
          x: newMousePosX,
          y: newMousePosY,
        });
      }

      // ВАЖНО: Выходим здесь, чтобы не обрабатывать панорамирование или hover
      return;
    }

    // ============================================
    // ПРИОРИТЕТ 2: Перетаскивание стрелок
    // ============================================
    if (draggedArrow && chart.workflow?.regimeArrows && chart.workflow?.trackSection) {
      const trackLength = chart.workflow.trackSection.length;
      const marginLeft = 80;

      const mouseKm = Math.max(0, Math.min(trackLength, (newMousePosX - marginLeft) / pixelsPerKm));

      const minArrowLength = 1;
      const updatedArrows = [...chart.workflow.regimeArrows];
      const currentIndex = updatedArrows.findIndex((a) => a.id === draggedArrow.arrowId);

      let limitReached = false;

      if (currentIndex !== -1) {
        const currentArrow = updatedArrows[currentIndex];
        const leftNeighbor = currentIndex > 0 ? updatedArrows[currentIndex - 1] : null;
        const rightNeighbor =
          currentIndex < updatedArrows.length - 1 ? updatedArrows[currentIndex + 1] : null;

        if (draggedArrow.handle === 'start') {
          if (currentIndex === 0) return;

          let minStartKm = currentArrow.startKm;
          let maxStartKm = currentArrow.endKm - minArrowLength;

          if (leftNeighbor) {
            minStartKm = leftNeighbor.startKm + minArrowLength;
          }

          if (mouseKm <= minStartKm || mouseKm >= maxStartKm) {
            limitReached = true;
          }

          const constrainedStartKm = Math.max(minStartKm, Math.min(maxStartKm, mouseKm));

          updatedArrows[currentIndex] = {
            ...currentArrow,
            startKm: constrainedStartKm,
          };

          if (leftNeighbor) {
            updatedArrows[currentIndex - 1] = {
              ...leftNeighbor,
              endKm: constrainedStartKm,
            };
          }
        } else {
          let minEndKm = currentArrow.startKm + minArrowLength;
          let maxEndKm = trackLength;

          if (rightNeighbor) {
            maxEndKm = rightNeighbor.endKm - minArrowLength;
          }

          if (mouseKm <= minEndKm || mouseKm >= maxEndKm) {
            limitReached = true;
          }

          const constrainedEndKm = Math.max(minEndKm, Math.min(maxEndKm, mouseKm));

          updatedArrows[currentIndex] = {
            ...currentArrow,
            endKm: constrainedEndKm,
          };

          if (rightNeighbor) {
            updatedArrows[currentIndex + 1] = {
              ...rightNeighbor,
              startKm: constrainedEndKm,
            };
          }
        }
      }

      setResizeLimitReached(limitReached);

      updateChartData({
        workflow: {
          ...chart.workflow,
          regimeArrows: updatedArrows,
        },
      });

      return;
    }

    // ============================================
    // ПРИОРИТЕТ 3: Панорамирование
    // ============================================
    if (isPanning) {
      const newPanX = e.clientX - panStart.x;

      const maxPanX = 100;
      const minPanX = -baseWidth + (containerRef.current?.clientWidth || 800) - 100;

      setPanX(Math.max(minPanX, Math.min(maxPanX, newPanX)));

      // НЕ обрабатываем hover во время панорамирования
      return;
    }

    // ============================================
    // ПРИОРИТЕТ 4: Hover (только когда нет активного взаимодействия)
    // ============================================
    if (chart.workflow?.regimeArrows && chart.workflow?.trackSection) {
      const marginLeft = 80;
      const marginBottom = 240;
      const arrowY = baseHeight - marginBottom + 180;

      let foundHover: {
        arrowId: string;
        handle?: 'start' | 'end';
      } | null = null;

      const kmToX = createKmToXConverter(chartData, marginLeft, pixelsPerKm);

      for (let i = 0; i < chart.workflow.regimeArrows.length; i++) {
        const arrow = chart.workflow.regimeArrows[i];
        const startX = kmToX(arrow.startKm);
        const endX = kmToX(arrow.endKm);
        const handleRadius = 8;

        if (selectedArrow === arrow.id) {
          if (i > 0) {
            const distToStart = Math.sqrt(
              Math.pow(newMousePosX - startX, 2) + Math.pow(newMousePosY - arrowY, 2)
            );
            if (distToStart <= handleRadius) {
              foundHover = {
                arrowId: arrow.id,
                handle: 'start',
              };
              break;
            }
          }

          const distToEnd = Math.sqrt(
            Math.pow(newMousePosX - endX, 2) + Math.pow(newMousePosY - arrowY, 2)
          );
          if (distToEnd <= handleRadius) {
            foundHover = { arrowId: arrow.id, handle: 'end' };
            break;
          }
        }

        const hitAreaTop = arrowY - 20;
        const hitAreaBottom = arrowY + 10;

        if (
          newMousePosX >= startX &&
          newMousePosX <= endX &&
          newMousePosY >= hitAreaTop &&
          newMousePosY <= hitAreaBottom
        ) {
          foundHover = { arrowId: arrow.id };
          break;
        }
      }

      setHoveredArrow(foundHover);
    }
  };

  const handlePanEnd = () => {
    const interactionType = interactionStateRef.current.type;

    console.debug('[ChartEditor] handlePanEnd', {
      interactionType,
      draggedObject: draggedObject?.id,
      hasDragMoved,
      currentObjectsCount: chart.canvasObjects?.length,
    });

    if (interactionType === 'dragging-object' && draggedObject) {
      if (hasDragMoved && draggingObjectPosition) {
        // Объект был перемещён - обновляем позицию
        let finalY = draggingObjectPosition.y;
        finalY = finalY >= xAxisY ? xAxisY - 30 : finalY;
        const stackedPosition = getStackedPosition(draggingObjectPosition.x, finalY);

        const newObjects = chart.canvasObjects.map((obj) =>
          obj.id === draggedObject.id
            ? { ...obj, x: draggingObjectPosition.x, y: stackedPosition }
            : obj
        );

        console.debug('[ChartEditor] finalizing drag', {
          objectId: draggedObject.id,
          newPosition: { x: draggingObjectPosition.x, y: stackedPosition },
        });

        updateChartData({ canvasObjects: newObjects });
        flushPendingUpdates();
      }
      // Если не было движения - это был клик, selection уже установлен
    }

    // Сброс всех состояний
    interactionStateRef.current = { type: 'none' };
    setIsPanning(false);
    setDraggedObject(null);
    setDraggingObjectPosition(null);
    setDraggedArrow(null);
    setResizeLimitReached(false);
    setDragStartPos(null);
    setHasDragMoved(false);
  };

  const getStackedPosition = (x: number, y: number): number => {
    const tolerance = 20;
    const stackSpacing = 30;

    const objectsAtSameX = chart.canvasObjects.filter((obj) => {
      return Math.abs(obj.x - x) < tolerance;
    });

    if (objectsAtSameX.length === 0) {
      return y;
    }

    const sorted = [...objectsAtSameX].sort((a, b) => a.y - b.y);

    let finalY = y;
    for (const obj of sorted) {
      if (Math.abs(finalY - obj.y) < stackSpacing) {
        finalY = obj.y - stackSpacing;
      }
    }

    finalY = Math.max(50, finalY);

    return finalY;
  };

  // Размещение нового объекта
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Prevent placing objects during panning or dragging operations
    if (isPanning || draggedObject || draggedArrow) {
      console.debug('[ChartEditor] Ignoring click during interaction', {
        isPanning,
        draggedObject: !!draggedObject,
        draggedArrow: !!draggedArrow,
      });
      return;
    }

    if (placingObject) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      let x = (e.clientX - rect.left - panX) / zoom;
      let y = e.clientY - rect.top - panY;

      if (y >= xAxisY) {
        y = xAxisY - 30;
      }

      y = getStackedPosition(x, y);

      const [objectType, subtype] = placingObject.split(':');

      const newObject: CanvasObject = {
        id: Date.now().toString(),
        type: objectType as any,
        subtype: subtype || undefined,
        label: (window as any).__placingObjectLabel || undefined,
        x,
        y,
      };

      const now = Date.now();
      if (now - placementCooldownRef.current < 250) {
        console.debug('[ChartEditor] placement cooldown - ignoring duplicate placement');
      } else {
        placementCooldownRef.current = now;
        console.debug('[ChartEditor] placing new object', {
          id: newObject.id,
          x,
          y,
          objectsCount: chart.canvasObjects.length,
        });
        updateChartData({
          canvasObjects: [...chart.canvasObjects, newObject],
        });
      }

      setPlacingObject(null);
      (window as any).__placingObjectLabel = undefined;
    }
  };

  // Handle drop from Visio palette
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();

    try {
      // Support different drag data formats: application/json (existing) and palette-specific keys
      let objectDataJson = e.dataTransfer.getData('application/json');
      if (!objectDataJson) {
        objectDataJson = e.dataTransfer.getData('application/x-palette-object-data');
      }

      if (!objectDataJson) return;

      const objectData = JSON.parse(objectDataJson);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      let x = (e.clientX - rect.left - panX) / zoom;
      let y = e.clientY - rect.top - panY;

      if (y >= xAxisY) {
        y = xAxisY - 30;
      }

      y = getStackedPosition(x, y);

      const newObject: CanvasObject = {
        id: Date.now().toString(),
        type: (objectData.category || objectData.type) as any,
        subtype: objectData.id,
        label: objectData.nameRu || objectData.name,
        x,
        y,
      };

      console.debug('[ChartEditor] drop -> placing new object', {
        id: newObject.id,
        x,
        y,
        beforeCount: chart.canvasObjects.length,
      });
      updateChartData({
        canvasObjects: [...chart.canvasObjects, newObject],
      });
      console.debug('[ChartEditor] drop -> after updateChartData call', {
        afterCount: chart.canvasObjects.length,
      });
    } catch (error) {
      // ignore malformed data
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleContextMenuSelect = () => {
    setShowPalette(true);
  };

  // ==========
  // Helper‑функции для толщины линий и шрифта (чтобы всё выглядело единообразно при зуме по X)
  // ==========

  // Анализ режимов движения
  const analyzeOperationModes = (
    speedCurve: { km: number; speed: number }[],
    trackSection: { speedLimits: SpeedLimit[]; length: number },
    maxKm?: number
  ): OperationModeSegment[] => {
    const segments: OperationModeSegment[] = [];

    const trackLength = trackSection.length;

    let actualStartCoord = 0;
    let actualEndCoord = trackLength;

    // @ts-ignore (у workflow.trackSection есть stations, но тип SpeedLimit в сигнатуре упрощён)
    if (
      // @ts-ignore
      trackSection?.stations &&
      // @ts-ignore
      trackSection.stations.length > 0
    ) {
      // @ts-ignore
      actualStartCoord = trackSection.stations[0].startCoord;
      // @ts-ignore
      actualEndCoord =
        // @ts-ignore
        trackSection.stations[trackSection.stations.length - 1].endCoord;
    }

    const isReversed = actualStartCoord > actualEndCoord;
    const displayStartCoord = isReversed ? actualEndCoord : actualStartCoord;
    const displayEndCoord = isReversed ? actualStartCoord : actualEndCoord;

    const endKm = maxKm || trackSection.length;

    const pointsInRange = speedCurve.filter(
      (point) => point.km >= displayStartCoord && point.km <= Math.min(endKm, displayEndCoord)
    );

    if (pointsInRange.length < 2) return segments;

    for (let i = 0; i < pointsInRange.length - 1; i++) {
      const point1 = pointsInRange[i];
      const point2 = pointsInRange[i + 1];

      const segmentEndKm = Math.min(point2.km, endKm, displayEndCoord);
      const speedChange = point2.speed - point1.speed;
      const distanceChange = point2.km - point1.km;
      const acceleration = distanceChange > 0 ? speedChange / distanceChange : 0;

      const speedLimit = trackSection.speedLimits.find(
        (sl) => point1.km >= sl.startCoord && point1.km < sl.endCoord
      );
      const limitValue = speedLimit ? speedLimit.limitValue : 200;
      const atLimit = point1.speed >= limitValue * 0.95;

      let mode: OperationMode;

      if (atLimit) {
        if (acceleration < -0.5) {
          mode = 'limit-braking';
        } else {
          mode = 'limit-traction';
        }
      } else if (acceleration > 1) {
        mode = 'acceleration';
      } else if (acceleration < -2) {
        mode = 'braking';
      } else if (acceleration < -0.3) {
        mode = 'coasting';
      } else {
        mode = 'stable';
      }

      segments.push({
        startKm: point1.km,
        endKm: segmentEndKm,
        mode,
      });

      if (segmentEndKm >= endKm || segmentEndKm >= displayEndCoord) break;
    }

    return segments;
  };

  // Scroll boundary management with 100px padding
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const PADDING = 100;

    const handleScroll = () => {
      // Calculate content dimensions
      const contentWidth = baseWidth;
      const contentHeight = baseHeight;
      const viewportWidth = scrollContainer.clientWidth;
      const viewportHeight = scrollContainer.clientHeight;

      // Calculate max scroll positions (content size + padding - viewport)
      const maxScrollX = Math.max(0, contentWidth - viewportWidth + PADDING);
      const maxScrollY = Math.max(0, contentHeight - viewportHeight + PADDING);

      // Get current scroll position
      let scrollLeft = scrollContainer.scrollLeft;
      let scrollTop = scrollContainer.scrollTop;

      // Clamp scroll position to boundaries
      let needsAdjustment = false;

      if (scrollLeft > maxScrollX) {
        scrollLeft = maxScrollX;
        needsAdjustment = true;
      }
      if (scrollLeft < 0) {
        scrollLeft = 0;
        needsAdjustment = true;
      }

      if (scrollTop > maxScrollY) {
        scrollTop = maxScrollY;
        needsAdjustment = true;
      }
      if (scrollTop < 0) {
        scrollTop = 0;
        needsAdjustment = true;
      }

      // Apply adjustments if needed
      if (needsAdjustment) {
        scrollContainer.scrollLeft = scrollLeft;
        scrollContainer.scrollTop = scrollTop;
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    // Also handle wheel events for boundary checking
    const handleWheel = (e: WheelEvent) => {
      // Let the scroll handler catch boundary violations
      requestAnimationFrame(handleScroll);
    };

    scrollContainer.addEventListener('wheel', handleWheel, {
      passive: true,
    });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, [baseWidth, baseHeight]);

  // Center canvas on initial track section load
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !chartData.workflow?.trackSection) return;

    // Set initial scroll position to show some padding (50px from edges)
    const initialScrollX = 50;
    const initialScrollY = 50;

    scrollContainer.scrollLeft = initialScrollX;
    scrollContainer.scrollTop = initialScrollY;
  }, [chartData.workflow?.trackSection]);

  // Синхронизация panX и горизонтального скролла
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // При изменении panX обновляем скролл
    const newScrollX = -panX;

    // Избегаем циклической синхронизации
    if (Math.abs(container.scrollLeft - newScrollX) > 1) {
      container.scrollLeft = newScrollX;
    }
  }, [panX]);

  // Обратная синхронизация: скролл → panX
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const newPanX = -container.scrollLeft;

      // Обновляем panX только если разница значительная
      if (Math.abs(panX - newPanX) > 1) {
        setPanX(newPanX);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [panX]);

  // Hover по объектам
  useEffect(() => {
    // Disable hover while actively dragging an object to avoid conflicts
    if (draggedObject) {
      setHoveredObject(null);
      return;
    }

    const hovered = chartData.canvasObjects.find((obj) => {
      const dx = obj.x - mousePos.x;
      const dy = obj.y - mousePos.y;
      return Math.sqrt(dx * dx + dy * dy) < 15;
    });
    setHoveredObject(hovered || null);
  }, [mousePos, chartData.canvasObjects, draggedObject]);

  // Hover по данным (старая логика, использует базовые оси)
  /*useEffect(() => {
    const dividerY = baseHeight * 0.4;
    const axisY = dividerY + 250;

    const allCoords: number[] = [];
    chartData.trackSegments.forEach((seg) => {
      allCoords.push(seg.startCoord, seg.endCoord);
    });
    chartData.speedLimits.forEach((limit) => {
      allCoords.push(limit.startCoord, limit.endCoord);
    });
    chartData.pathProfiles.forEach((profile) => {
      allCoords.push(profile.startCoord, profile.endCoord);
    });
    const maxCoord = allCoords.length > 0 ? Math.max(...allCoords, 200) : 200;

    const coordToX = (coord: number) => {
      const usableWidth = baseWidth - 200;
      return 100 + (coord / maxCoord) * usableWidth;
    };

    if (chartData.pathProfiles.length > 0) {
      let currentY = axisY - 50;
      for (let i = 0; i < chartData.pathProfiles.length; i++) {
        const profile = chartData.pathProfiles[i];
        const startX = coordToX(profile.startCoord);
        const endX = coordToX(profile.endCoord);
        const deltaY = profile.slopePromille * 2;
        const nextY = currentY + deltaY;

        if (mousePos.x >= startX - 10 && mousePos.x <= endX + 10) {
          const segmentY =
            currentY + ((mousePos.x - startX) / (endX - startX)) * (nextY - currentY);
          if (Math.abs(mousePos.y - segmentY) < 10) {
            const kmPos =
              profile.startCoord +
              ((mousePos.x - startX) / (endX - startX)) * (profile.endCoord - profile.startCoord);
            setHoveredDataPoint({
              label: `Профиль пути - км: ${kmPos.toFixed(1)}, уклон: ${profile.slopePromille}‰`,
              x: mousePos.x,
              y: segmentY,
            });
            return;
          }
        }
        currentY = nextY;
      }
    }

    if (chartData.speedLimits.length > 0) {
      const speedLimitBaseY = axisY - 180;
      const maxSpeed = 140;
      const speedGraphHeight = 80;

      for (const limit of chartData.speedLimits) {
        const startX = coordToX(limit.startCoord);
        const endX = coordToX(limit.endCoord);
        const speedRatio = limit.limitValue / maxSpeed;
        const y = speedLimitBaseY - speedRatio * speedGraphHeight;

        if (mousePos.x >= startX && mousePos.x <= endX && Math.abs(mousePos.y - y) < 15) {
          const kmPos =
            limit.startCoord +
            ((mousePos.x - startX) / (endX - startX)) * (limit.endCoord - limit.startCoord);
          setHoveredDataPoint({
            label: `Скоростные ограничения - км: ${kmPos.toFixed(
              1
            )}, Скорость: ${limit.limitValue} км/ч`,
            x: mousePos.x,
            y: y,
          });
          return;
        }
      }
    }

    for (const segment of chartData.trackSegments) {
      const startX = coordToX(segment.startCoord);
      const endX = coordToX(segment.endCoord);
      const centerX = (startX + endX) / 2;

      if (Math.abs(mousePos.x - centerX) < 30 && Math.abs(mousePos.y - axisY) < 15) {
        setHoveredDataPoint({
          label: `Station: ${segment.stationName}, Km: ${segment.startCoord}-${segment.endCoord}`,
          x: centerX,
          y: axisY - 10,
        });
        return;
      }
    }

    setHoveredDataPoint(null);
  }, [mousePos, chartData, baseWidth, baseHeight]);*/

  // Hover по стрелкам (резервный эффект; основное наведение уже в handlePanMove)
  /*useEffect(() => {
    if (!chartData.workflow?.regimeArrows || !chartData.workflow?.trackSection) {
      setHoveredArrow(null);
      return;
    }

    const marginLeft = 80;
    const marginTop = 50;
    const marginBottom = 240;
    const arrowY = marginTop + (baseHeight - marginTop - marginBottom) + 180;

    // Use the proper kmToX converter that handles track coordinate system
    const kmToX = createKmToXConverter(chartData, marginLeft, pixelsPerKm);

    const handleRadius = 8;

    for (let i = 0; i < chartData.workflow.regimeArrows.length; i++) {
      const arrow = chartData.workflow.regimeArrows[i];
      const startX = kmToX(arrow.startKm);
      const endX = kmToX(arrow.endKm);

      if (i > 0 && selectedArrow === arrow.id) {
        const distToStart = Math.sqrt(
          Math.pow(mousePos.x - startX, 2) + Math.pow(mousePos.y - arrowY, 2)
        );
        if (distToStart < handleRadius) {
          setHoveredArrow({
            arrowId: arrow.id,
            handle: 'start',
          });
          return;
        }
      }

      if (selectedArrow === arrow.id) {
        const distToEnd = Math.sqrt(
          Math.pow(mousePos.x - endX, 2) + Math.pow(mousePos.y - arrowY, 2)
        );
        if (distToEnd < handleRadius) {
          setHoveredArrow({ arrowId: arrow.id, handle: 'end' });
          return;
        }
      }

      const hitAreaTop = arrowY - 20;
      const hitAreaBottom = arrowY + 10;

      if (
        mousePos.x >= startX &&
        mousePos.x <= endX &&
        mousePos.y >= hitAreaTop &&
        mousePos.y <= hitAreaBottom
      ) {
        setHoveredArrow({ arrowId: arrow.id });
        return;
      }
    }

    setHoveredArrow(null);
  }, [
    mousePos,
    chartData.workflow?.regimeArrows,
    chartData.workflow?.trackSection,
    selectedArrow,
    baseWidth,
    baseHeight,
  ]);*/

  const interactionStateRef = useRef<{
    type: 'none' | 'panning' | 'dragging-object' | 'dragging-arrow';
    objectId?: string;
  }>({ type: 'none' });

  const handleObjectMouseDown = (e: React.MouseEvent) => {
    if (hoveredObject && !placingObject && !isMarqueeZoom) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Устанавливаем состояние через ref (синхронно)
      interactionStateRef.current = {
        type: 'dragging-object',
        objectId: hoveredObject.id,
      };

      console.debug('[ChartEditor] handleObjectMouseDown', {
        id: hoveredObject.id,
        interactionState: interactionStateRef.current,
      });

      // Обновляем selection
      if (onSelectObject) {
        onSelectObject(hoveredObject.id);
      }

      setDraggedObject(hoveredObject);
      setDragStartPos({
        x: e.clientX - rect.left - panX,
        y: e.clientY - rect.top - panY,
      });
      setHasDragMoved(false);
      setIsPanning(false);

      e.stopPropagation();
      e.preventDefault(); // Предотвращаем дефолтное поведение
    }
  };

  const handleObjectDoubleClick = (e: React.MouseEvent) => {
    if (hoveredObject && !placingObject && !isMarqueeZoom) {
      const updatedObjects = chartData.canvasObjects.filter((obj) => obj.id !== hoveredObject.id);
      console.debug('[ChartEditor] double-click delete object', {
        deletedId: hoveredObject.id,
        before: chartData.canvasObjects.length,
        after: updatedObjects.length,
      });
      updateChartData({ canvasObjects: updatedObjects });
      setHoveredObject(null);
      e.stopPropagation();
    }
  };

  /*const handleArrowMouseDown = (e: React.MouseEvent) => {
    if (hoveredArrow && !placingObject && !isMarqueeZoom) {
      setSelectedArrow(hoveredArrow.arrowId);

      if (hoveredArrow.handle) {
        setDraggedArrow({
          arrowId: hoveredArrow.arrowId,
          handle: hoveredArrow.handle,
        });
      }

      setIsPanning(false);
      e.stopPropagation();
    }
  };*/

  React.useEffect(() => {
    const { topY, bottomY } = getCanvasContentYBounds();
    const contentHeight = bottomY - topY;
  }, [containerRef?.current?.clientHeight]);

  // Кнопка "Начальный масштаб" — сброс зума и повторное вертикальное центрирование всей области
  const handleResetZoom = () => {
    setPixelsPerKm(40); // Возврат к начальному значению
    setPanX(0);
    setPanY(0);
  };

  return (
    <>
      <div
        className="flex-1 bg-gray-50 overflow-hidden flex flex-row"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Main canvas area */}
        <div
          className="flex-1 p-6 overflow-hidden flex flex-col"
          ref={containerRef}
          style={{ transition: 'all 0.3s ease' }}
        >
          <div
            className="bg-white rounded-lg shadow-sm p-6 flex-1 flex flex-col overflow-hidden"
            style={{
              overflowY: 'scroll',
              position: 'relative',
            }}
          >
            {/* Панель управления */}
            <div
              className="mb-4 flex items-center justify-between flex-shrink-0"
              style={{
                position: 'sticky',
                top: '0',
                paddingLeft: 10,
                paddingRight: 10,
                zIndex: 30,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
                  <span className="text-sm">Zoom:</span>
                  <span className="text-sm font-mono">{Math.round((pixelsPerKm / 40) * 100)}%</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const delta = 1.2;
                    const newPixelsPerKm = Math.min(160, pixelsPerKm * delta); // Макс 160px/км
                    setPixelsPerKm(newPixelsPerKm);
                  }}
                  title="Увеличить масштаб (Zoom In)"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const delta = 1.2;
                    const newPixelsPerKm = Math.max(10, pixelsPerKm / delta); // Мин 10px/км
                    setPixelsPerKm(newPixelsPerKm);
                  }}
                  title="Уменьшить масштаб (Zoom Out)"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={isMarqueeZoom ? 'default' : 'outline'}
                  onClick={() => {
                    setIsMarqueeZoom(!isMarqueeZoom);
                    setPlacingObject(null);
                  }}
                >
                  Выбрать область
                </Button>
                <Button size="sm" variant="outline" onClick={handleResetZoom}>
                  Начальный масштаб
                </Button>
              </div>
              <div>
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

            {/* Canvas с контекстным меню */}
            <ContextMenu>
              <div
                ref={scrollContainerRef}
                className="border border-gray-300 rounded flex-1 overflow-auto canvas-scrollbar relative"
                style={{
                  minHeight: 0,
                  scrollbarGutter: 'stable both-edges',
                }}
              >
                <div
                  style={{
                    width: baseWidth + 200,
                    height: baseHeight + 200,
                    position: 'relative',
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={baseWidth}
                    height={baseHeight}
                    onWheel={handleWheel}
                    onDrop={handleCanvasDrop}
                    onDragOver={handleDragOver}
                    onMouseDown={(e) => {
                      if (isMarqueeZoom) {
                        handleMarqueeZoomStart(e);
                      } else if (placingObject) {
                        handleCanvasClick(e);
                      } else {
                        if (hoveredArrow) {
                          //handleArrowMouseDown(e);
                        } else if (hoveredObject) {
                          handleObjectMouseDown(e);
                        } else {
                          handlePanStart(e);
                        }
                      }
                    }}
                    onMouseMove={(e) => {
                      if (isMarqueeZoom) {
                        handleMarqueeZoomMove(e);
                      } else {
                        handlePanMove(e);
                      }
                    }}
                    onMouseUp={() => {
                      if (isMarqueeZoom) {
                        handleMarqueeZoomEnd();
                      } else {
                        handlePanEnd();
                      }
                    }}
                    onMouseLeave={handlePanEnd}
                    onDoubleClick={handleObjectDoubleClick}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (placingObject) {
                        setPlacingObject(null);
                      } else if (selectedArrow && chartData.workflow?.regimeArrows) {
                        const deletedArrowIndex = chartData.workflow.regimeArrows.findIndex(
                          (arrow) => arrow.id === selectedArrow
                        );

                        if (deletedArrowIndex !== -1) {
                          const deletedArrow = chartData.workflow.regimeArrows[deletedArrowIndex];
                          const deletedLength = deletedArrow.endKm - deletedArrow.startKm;

                          const updatedArrows = chartData.workflow.regimeArrows
                            .filter((arrow) => arrow.id !== selectedArrow)
                            .map((arrow, index) => {
                              if (index >= deletedArrowIndex) {
                                return {
                                  ...arrow,
                                  startKm: arrow.startKm - deletedLength,
                                  endKm: arrow.endKm - deletedLength,
                                };
                              }
                              return arrow;
                            });

                          console.debug('[ChartEditor] context menu: delete arrow', {
                            deletedArrowId: selectedArrow,
                            updatedCount: updatedArrows.length,
                          });
                          updateChartData({
                            workflow: {
                              ...chartData.workflow,
                              regimeArrows: updatedArrows,
                            },
                          });
                          setSelectedArrow(null);
                        }
                      } else if (hoveredObject) {
                        const updatedObjects = chartData.canvasObjects.filter(
                          (obj) => obj.id !== hoveredObject.id
                        );
                        console.debug('[ChartEditor] context menu: delete object', {
                          deletedId: hoveredObject.id,
                          before: chartData.canvasObjects.length,
                          after: updatedObjects.length,
                        });
                        updateChartData({
                          canvasObjects: updatedObjects,
                        });
                        setHoveredObject(null);
                      }
                    }}
                    className="cursor-crosshair"
                    style={{
                      position: 'absolute',
                      top: '100px',
                      left: '100px',
                      display: 'block',
                      cursor: draggedArrow
                        ? resizeLimitReached
                          ? 'not-allowed'
                          : 'ew-resize'
                        : draggedObject
                          ? 'grabbing'
                          : isPanning
                            ? 'grabbing'
                            : isMarqueeZoom
                              ? 'crosshair'
                              : placingObject
                                ? 'cell'
                                : hoveredArrow?.handle
                                  ? 'ew-resize'
                                  : hoveredArrow
                                    ? 'pointer'
                                    : hoveredObject
                                      ? 'pointer'
                                      : 'grab',
                    }}
                  />
                </div>
              </div>

              <ContextMenuContent className="w-56">
                <ContextMenuItem onClick={handleContextMenuSelect}>
                  <GitBranch className="w-4 h-4 mr-2" />
                  Open Object Palette
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>

            {/* Палитра объектов */}
            <ObjectPalette
              isOpen={showPalette}
              onSelect={(objectType, label) => {
                setPlacingObject(objectType);
                (window as any).__placingObjectLabel = label;
              }}
              onClose={() => setShowPalette(false)}
            />

            {/* Display Settings Modal */}
            <Dialog open={showDisplaySettings} onOpenChange={setShowDisplaySettings}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Настройки отображения</DialogTitle>
                  <DialogDescription>Выберите элементы для отображения на холсте</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Track Profile */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="trackProfile"
                      checked={displaySettings.trackProfile}
                      onCheckedChange={(checked) =>
                        setDisplaySettings({
                          ...displaySettings,
                          trackProfile: !!checked,
                        })
                      }
                    />
                    <Label htmlFor="trackProfile" className="text-sm cursor-pointer">
                      Профиль пути
                    </Label>
                  </div>

                  {/* Optimal Speed Curve */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="optimalSpeedCurve"
                      checked={displaySettings.optimalSpeedCurve}
                      onCheckedChange={(checked) =>
                        setDisplaySettings({
                          ...displaySettings,
                          optimalSpeedCurve: !!checked,
                        })
                      }
                    />
                    <Label htmlFor="optimalSpeedCurve" className="text-sm cursor-pointer">
                      Оптимальная кривая скорости
                    </Label>
                  </div>

                  {/* Speed Limits */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="speedLimits"
                      checked={displaySettings.speedLimits}
                      onCheckedChange={(checked) =>
                        setDisplaySettings({
                          ...displaySettings,
                          speedLimits: !!checked,
                        })
                      }
                    />
                    <Label htmlFor="speedLimits" className="text-sm cursor-pointer">
                      Скоростные ограничения
                    </Label>
                  </div>

                  {/* Actual Speed Curve */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="actualSpeedCurve"
                      checked={displaySettings.actualSpeedCurve}
                      onCheckedChange={(checked) =>
                        setDisplaySettings({
                          ...displaySettings,
                          actualSpeedCurve: !!checked,
                        })
                      }
                    />
                    <Label htmlFor="actualSpeedCurve" className="text-sm cursor-pointer">
                      Фактическая кривая скорости
                    </Label>
                  </div>

                  {/* Regime Bands */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="regimeBands"
                      checked={displaySettings.regimeBands}
                      onCheckedChange={(checked) =>
                        setDisplaySettings({
                          ...displaySettings,
                          regimeBands: !!checked,
                        })
                      }
                    />
                    <Label htmlFor="regimeBands" className="text-sm cursor-pointer">
                      Режимные ленты
                    </Label>
                  </div>

                  {/* Object Markers */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="objectMarkers"
                      checked={displaySettings.objectMarkers}
                      onCheckedChange={(checked) =>
                        setDisplaySettings({
                          ...displaySettings,
                          objectMarkers: !!checked,
                        })
                      }
                    />
                    <Label htmlFor="objectMarkers" className="text-sm cursor-pointer">
                      Маркеры объектов
                    </Label>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Tooltip для объекта */}
            {hoveredObject && (
              <div
                className="fixed bg-black text-white text-xs px-2 py-1 rounded pointer-events-none z-150"
                style={{
                  left: screenMousePos.x + 10,
                  top: screenMousePos.y + 10,
                }}
              >
                {hoveredObject.label || hoveredObject.type}
                {' @ '}({Math.round(hoveredObject.x)}, {Math.round(hoveredObject.y)})
              </div>
            )}

            {/* Tooltip для данных */}
            {hoveredDataPoint && !hoveredObject && (
              <div
                className="fixed bg-blue-600 text-white text-xs px-3 py-2 rounded shadow-lg pointer-events-none z-150"
                style={{
                  left: screenMousePos.x + 10,
                  top: screenMousePos.y + 10,
                }}
              >
                {hoveredDataPoint.label}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
