// ИСПРАВЛЕННЫЙ КОМПОНЕНТ ChartEditor
//
// This component handles the main chart editing canvas with full programmatic rendering.
// All charts now use the drawWorkflowCanvas function for consistent visualization.

import React, { useState, useRef, useEffect } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import {
  GitBranch,
  Signal,
  Gauge,
  ZoomIn,
  ZoomOut,
  Move,
  Shapes,
  Settings,
} from "lucide-react";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import ObjectPalette from "./ObjectPalette";
import VisioObjectPalette from "./VisioObjectPalette";
import type {
  ChartData,
  CanvasObject,
  OperationModeSegment,
  OperationMode,
  SpeedLimit,
} from "../types/chart-data";
import { trainForceData } from "../types/trainForceData";

const PIXELS_PER_KM = 40;

interface ChartEditorProps {
  chartData: ChartData;
  onUpdateChartData: (updates: Partial<ChartData>) => void;
}

// Helper function to calculate kmToX conversion
// This is extracted so it can be used by both drawing and interaction handlers
const createKmToXConverter = (
  chartData: ChartData,
  marginLeft: number = 80,
) => {
  if (!chartData.workflow?.trackSection) {
    return (km: number) => marginLeft;
  }

  const trackSection = chartData.workflow.trackSection;
  const trackLength = trackSection.length;

  let actualStartCoord = 0;
  let actualEndCoord = trackLength;

  if (
    trackSection.stations &&
    trackSection.stations.length > 0
  ) {
    actualStartCoord = trackSection.stations[0].startCoord;
    actualEndCoord =
      trackSection.stations[trackSection.stations.length - 1]
        .endCoord;
  }

  const isReversed = actualStartCoord > actualEndCoord;
  const displayStartCoord = isReversed
    ? actualEndCoord
    : actualStartCoord;
  const displayEndCoord = isReversed
    ? actualStartCoord
    : actualEndCoord;

  return (km: number) => {
    if (!isFinite(km)) {
      return marginLeft;
    }

    const normalizedKm = isReversed ? displayEndCoord - km : km;
    const x =
      marginLeft +
      (normalizedKm - displayStartCoord) * PIXELS_PER_KM;

    if (!isFinite(x)) {
      return marginLeft;
    }

    return x;
  };
};

export default function ChartEditor({
  chartData,
  onUpdateChartData,
}: ChartEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevDepsRef = useRef<any>(null);

  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);

  // ВЕРТИКАЛЬНАЯ ПАНОРАМА (масштаб по Y заблокирован, но panY общий для всех элементов)
  const [panY, setPanY] = useState(0);

  // Redraw trigger for interactive elements (increments to force redraw without data changes)
  const [, setRedrawTrigger] = useState(0);
  const triggerRedraw = React.useCallback(() => {
    setRedrawTrigger((prev) => prev + 1);
  }, []);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  const [isMarqueeZoom, setIsMarqueeZoom] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [hoveredObject, setHoveredObject] =
    useState<CanvasObject | null>(null);
  const [draggedObject, setDraggedObject] =
    useState<CanvasObject | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [screenMousePos, setScreenMousePos] = useState({
    x: 0,
    y: 0,
  });

  const [showPalette, setShowPalette] = useState(false);
  const [placingObject, setPlacingObject] = useState<
    string | null
  >(null);

  const [hoveredDataPoint, setHoveredDataPoint] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);

  // Arrow interaction state
  const [selectedArrow, setSelectedArrow] = useState<
    string | null
  >(null);
  const [draggedArrow, setDraggedArrow] = useState<{
    arrowId: string;
    handle: "start" | "end";
  } | null>(null);
  const [hoveredArrow, setHoveredArrow] = useState<{
    arrowId: string;
    handle?: "start" | "end";
  } | null>(null);
  const [resizeLimitReached, setResizeLimitReached] =
    useState<boolean>(false);

  // Display Settings state
  const [showDisplaySettings, setShowDisplaySettings] =
    useState(false);
  const [displaySettings, setDisplaySettings] = useState({
    trackProfile: true,
    optimalSpeedCurve: true,
    speedLimits: true,
    actualSpeedCurve: true,
    regimeBands: true,
    objectMarkers: true,
  });

  const throttledLog = (
    message: string,
    interval: number = 1000,
  ) => {
    const now = Date.now();
    if (!(window as any).lastLogTime) {
      (window as any).lastLogTime = {};
    }
    if (
      !(window as any).lastLogTime[message] ||
      now - (window as any).lastLogTime[message] > interval
    ) {
      console.log(message);
      (window as any).lastLogTime[message] = now;
    }
  };

  // VisioObjectPalette collapse state
  const [paletteCollapsed, setPaletteCollapsed] =
    useState(true);

  // Screenshot state variables (currently unused but kept for future use)
  // const [screenshotImage, setScreenshotImage] = useState<HTMLImageElement | null>(null);
  // const [screenshotLoadError, setScreenshotLoadError] = useState(false);

  // Сброс выделения стрелок при смене участка или локомотива
  useEffect(() => {
    setSelectedArrow(null);
    setDraggedArrow(null);
  }, [
    chartData.workflow?.trackSection?.id,
    chartData.workflow?.locomotive?.id,
  ]);

  // Расчёт базовой высоты (using fixed 4-layer structure)
  const calculateBaseHeight = () => {
    // Fixed 4-layer structure: 800px total
    // Layer 1: Force Dynamics (0-160px)
    // Layer 2: Speed Curves (160-480px)
    // Layer 3: Track Profile (480-640px)
    // Layer 4: Regime Bands (640-800px)
    return 800;
  };

  const [baseWidth, setBaseWidth] = useState(2400);
  const [baseHeight] = useState(800); // Fixed height for 4-layer structure

  // Re-render tracking for debugging
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());

  // ВНИМАНИЕ: старый dividerY/xAxisY/slopeArea* здесь далее не используются для отрисовки
  // оставлены только для некоторых логик (например, getStackedPosition/hover), но без влияния на систему координат
  const dividerY = baseHeight * 0.4;
  const xAxisY = dividerY + 250;
  const slopeAreaTop = 450;
  const slopeAreaBottom = 550;

  // Обновление ширины холста по длине участка
  useEffect(() => {
    const trackLength =
      chartData.workflow?.trackSection?.length || 200;

    // VALIDATION: Check for unreasonable values
    if (
      !isFinite(trackLength) ||
      trackLength <= 0 ||
      trackLength > 10000
    ) {
      if (baseWidth !== 2400) {
        setBaseWidth(2400);
      }
      return;
    }

    const pixelsPerKm = 40;
    const marginLeft = 100;
    const marginRight = 100;
    const calculatedWidth = Math.max(
      2400,
      marginLeft + trackLength * pixelsPerKm + marginRight,
    );

    // Обновляем только если значение изменилось
    if (calculatedWidth !== baseWidth) {
      setBaseWidth(calculatedWidth);
    }
  }, [chartData.workflow?.trackSection?.length, baseWidth]);

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
    const marginLeft = 80;
    const leftPadding = 30;
    const marginTop = 50;
    const topOffset = 20;

    // Устанавливаем значения, которые работают в первом случае
    setZoom(1);
    setPanX(-30); // zoom = 1
  }, []);

  // Обработчик колесика: только горизонтальный масштаб, вертикальный зум заблокирован
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    // ZOOM DISABLED - только панорамирование
    // if (e.ctrlKey) {
    //   const delta = e.deltaY > 0 ? 0.9 : 1.1;
    //   const currentZoom = zoom;
    //   const newZoom = Math.max(
    //     0.25,
    //     Math.min(4, currentZoom * delta),
    //   );

    //   const rect = canvasRef.current?.getBoundingClientRect();
    //   if (rect) {
    //     const mouseX = e.clientX - rect.left;
    //     const currentMouseWorldX =
    //       (mouseX - panX) / currentZoom;
    //     const newPanX = mouseX - currentMouseWorldX * newZoom;
    //     setZoom(newZoom);
    //     setPanX(newPanX);
    //     // panY НЕ изменяем - вертикальный масштаб всегда 1
    //   }
    // } else
    if (e.shiftKey) {
      // Shift + колесо — горизонтальная панорама
      setPanX((prev) => prev - e.deltaY);
    }
    // Обычное колесо — НИЧЕГО (вертикальная панорама отключена)
  };

  // ZOOM DISABLED - Рамка масштабирования (marquee) закомментирована
  const handleMarqueeZoomStart = (e: React.MouseEvent) => {
    // if (!isMarqueeZoom) return;
    // const rect = canvasRef.current?.getBoundingClientRect();
    // if (!rect) return;
    // const x = (e.clientX - rect.left - panX) / zoom;
    // // For vertical, capture the entire visible canvas height
    // const containerHeight =
    //   containerRef.current?.clientHeight || 600;
    // setMarqueeStart({ x, y: 0 });
    // setMarqueeEnd({ x, y: containerHeight });
  };

  const handleMarqueeZoomMove = (e: React.MouseEvent) => {
    // if (!isMarqueeZoom || !marqueeStart) return;
    // const rect = canvasRef.current?.getBoundingClientRect();
    // if (!rect) return;
    // const x = (e.clientX - rect.left - panX) / zoom;
    // // Keep vertical extent to full canvas height
    // const containerHeight =
    //   containerRef.current?.clientHeight || 600;
    // setMarqueeEnd({ x, y: containerHeight });
  };

  const handleMarqueeZoomEnd = () => {
    // if (!marqueeStart || !marqueeEnd) return;
    // const width = Math.abs(marqueeEnd.x - marqueeStart.x);
    // // Only require horizontal movement (removed vertical check)
    // if (width > 20) {
    //   const canvasWidth =
    //     containerRef.current?.clientWidth || 800;
    //   // Масштабируем ТОЛЬКО по X (горизонтально)
    //   const zoomX = canvasWidth / width;
    //   const newZoom = Math.min(zoomX, 4);
    //   setZoom(newZoom);
    //   setPanX(
    //     -Math.min(marqueeStart.x, marqueeEnd.x) * newZoom,
    //   );
    //   // Don't change vertical pan for marquee zoom
    //   // User can still pan vertically if needed
    // }
    // setMarqueeStart(null);
    // setMarqueeEnd(null);
    // setIsMarqueeZoom(false);
  };

  // Панорамирование — только по X (вертикальная панорама заблокирована)
  const handlePanStart = (e: React.MouseEvent) => {
    if (isMarqueeZoom || placingObject) return;

    if (!hoveredArrow && !hoveredObject) {
      setSelectedArrow(null);
    }

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
    const newMousePosX = (e.clientX - rect.left - panX) / zoom;
    const newMousePosY = e.clientY - rect.top - panY;

    setMousePos({
      x: newMousePosX,
      y: newMousePosY,
    });

    setScreenMousePos({
      x: e.clientX,
      y: e.clientY,
    });

    // Hover по стрелкам и др. элементы — ВСЕ используют одни и те же мировые координаты (без альтернативных transform)
    if (
      !draggedArrow &&
      !draggedObject &&
      chartData.workflow?.regimeArrows &&
      chartData.workflow?.trackSection
    ) {
      const marginLeft = 80;
      const marginRight = 50;
      const marginBottom = 240;
      const arrowY = baseHeight - marginBottom + 180;
      const trackLength =
        chartData.workflow.trackSection.length;
      const chartWidth = baseWidth - marginLeft - marginRight;

      let gridInterval;

      let foundHover: {
        arrowId: string;
        handle?: "start" | "end";
      } | null = null;

      // Create kmToX converter for this interaction
      const kmToX = createKmToXConverter(chartData, marginLeft);

      for (
        let i = 0;
        i < chartData.workflow.regimeArrows.length;
        i++
      ) {
        const arrow = chartData.workflow.regimeArrows[i];
        const startX = kmToX(arrow.startKm);
        const endX = kmToX(arrow.endKm);
        const handleRadius = 8;

        if (selectedArrow === arrow.id) {
          if (i > 0) {
            const distToStart = Math.sqrt(
              Math.pow(newMousePosX - startX, 2) +
                Math.pow(newMousePosY - arrowY, 2),
            );
            if (distToStart <= handleRadius) {
              foundHover = {
                arrowId: arrow.id,
                handle: "start",
              };
              break;
            }
          }

          const distToEnd = Math.sqrt(
            Math.pow(newMousePosX - endX, 2) +
              Math.pow(newMousePosY - arrowY, 2),
          );
          if (distToEnd <= handleRadius) {
            foundHover = { arrowId: arrow.id, handle: "end" };
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

    // Перетаскивание концов стрелок — тоже в мировой системе координат
    if (
      draggedArrow &&
      chartData.workflow?.regimeArrows &&
      chartData.workflow?.trackSection
    ) {
      const trackLength =
        chartData.workflow.trackSection.length;
      const marginLeft = 80;
      const marginRight = 50;
      const chartWidth = baseWidth - marginLeft - marginRight;

      const mouseKm = Math.max(
        0,
        Math.min(
          trackLength,
          (newMousePosX - marginLeft) / PIXELS_PER_KM, // Фиксированный масштаб
        ),
      );

      const minArrowLength = 1;
      const updatedArrows = [
        ...chartData.workflow.regimeArrows,
      ];
      const currentIndex = updatedArrows.findIndex(
        (a) => a.id === draggedArrow.arrowId,
      );

      let limitReached = false;

      if (currentIndex !== -1) {
        const currentArrow = updatedArrows[currentIndex];
        const leftNeighbor =
          currentIndex > 0
            ? updatedArrows[currentIndex - 1]
            : null;
        const rightNeighbor =
          currentIndex < updatedArrows.length - 1
            ? updatedArrows[currentIndex + 1]
            : null;

        if (draggedArrow.handle === "start") {
          if (currentIndex === 0) return;

          let minStartKm = currentArrow.startKm;
          let maxStartKm = currentArrow.endKm - minArrowLength;

          if (leftNeighbor) {
            minStartKm = leftNeighbor.startKm + minArrowLength;
          }

          if (mouseKm <= minStartKm || mouseKm >= maxStartKm) {
            limitReached = true;
          }

          const constrainedStartKm = Math.max(
            minStartKm,
            Math.min(maxStartKm, mouseKm),
          );

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

          const constrainedEndKm = Math.max(
            minEndKm,
            Math.min(maxEndKm, mouseKm),
          );

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

      onUpdateChartData({
        workflow: {
          ...chartData.workflow,
          regimeArrows: updatedArrows,
        },
      });
    } else if (draggedObject && !isPanning) {
      // Перетаскивание объектов — в общей мировой системе координат
      const newObjects = chartData.canvasObjects.map((obj) =>
        obj.id === draggedObject.id
          ? { ...obj, x: newMousePosX, y: newMousePosY }
          : obj,
      );
      onUpdateChartData({ canvasObjects: newObjects });
    } else if (isPanning && !draggedObject && !draggedArrow) {
      // Панорама — только по горизонтали (вертикальная панорама заблокирована)
      setPanX(e.clientX - panStart.x);
      // setPanY(e.clientY - panStart.y); // вертикальная панорама отключена
    }
  };

  const handlePanEnd = () => {
    if (draggedObject) {
      const finalY =
        mousePos.y >= xAxisY ? xAxisY - 30 : mousePos.y;
      const finalX = mousePos.x;

      const stackedPosition = getStackedPosition(
        finalX,
        finalY,
      );

      const newObjects = chartData.canvasObjects.map((obj) =>
        obj.id === draggedObject.id
          ? { ...obj, x: finalX, y: stackedPosition }
          : obj,
      );
      onUpdateChartData({ canvasObjects: newObjects });
    }
    setIsPanning(false);
    setDraggedObject(null);
    setDraggedArrow(null);
    setResizeLimitReached(false);
  };

  const getStackedPosition = (x: number, y: number): number => {
    const tolerance = 20;
    const stackSpacing = 30;

    const objectsAtSameX = chartData.canvasObjects.filter(
      (obj) => {
        return Math.abs(obj.x - x) < tolerance;
      },
    );

    if (objectsAtSameX.length === 0) {
      return y;
    }

    const sorted = [...objectsAtSameX].sort(
      (a, b) => a.y - b.y,
    );

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
    if (placingObject) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      let x = (e.clientX - rect.left - panX) / zoom;
      let y = e.clientY - rect.top - panY;

      if (y >= xAxisY) {
        y = xAxisY - 30;
      }

      y = getStackedPosition(x, y);

      const [objectType, subtype] = placingObject.split(":");

      const newObject: CanvasObject = {
        id: Date.now().toString(),
        type: objectType as any,
        subtype: subtype || undefined,
        label:
          (window as any).__placingObjectLabel || undefined,
        x,
        y,
      };

      onUpdateChartData({
        canvasObjects: [...chartData.canvasObjects, newObject],
      });

      setPlacingObject(null);
      (window as any).__placingObjectLabel = undefined;
    }
  };

  // Handle drop from Visio palette
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();

    try {
      const objectData = JSON.parse(
        e.dataTransfer.getData("application/json"),
      );
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
        type: objectData.category as any,
        subtype: objectData.id,
        label: objectData.nameRu,
        x,
        y,
      };

      onUpdateChartData({
        canvasObjects: [...chartData.canvasObjects, newObject],
      });
    } catch (error) {}
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleContextMenuSelect = () => {
    setShowPalette(true);
  };

  // ==========
  // Helper‑функции для толщины линий и шрифта (чтобы всё выглядело единообразно при зуме по X)
  // ==========
  const lineWidth = (base: number) => base; // Без деления на zoom
  const fontSize = (base: number) => `${base}px sans-serif`; // Без деления на zoom

  // ОСНОВНАЯ ОТРИСОВКА WORKFLOW-ГРАФИКА
  const drawWorkflowCanvas = React.useCallback(
    (
      ctx: CanvasRenderingContext2D,
      baseWidth: number,
      baseHeight: number,
      zoom: number,
    ) => {
      try {
        const trackSection = chartData.workflow?.trackSection;
        const trackLength = trackSection?.length ?? 0;

        // VALIDATION: Check track length
        if (
          !isFinite(trackLength) ||
          trackLength <= 0 ||
          trackLength > 10000
        ) {
          throw new Error(
            `Invalid track length: ${trackLength} km`,
          );
        }
        let actualStartCoord = 0;
        let actualEndCoord = trackLength;

        if (
          trackSection &&
          trackSection.stations &&
          trackSection.stations.length > 0
        ) {
          actualStartCoord =
            trackSection.stations[0].startCoord;
          actualEndCoord =
            trackSection.stations[
              trackSection.stations.length - 1
            ].endCoord;
        }

        const isReversed = actualStartCoord > actualEndCoord;
        const displayStartCoord = isReversed
          ? actualEndCoord
          : actualStartCoord;
        const displayEndCoord = isReversed
          ? actualStartCoord
          : actualEndCoord;
        const displayTrackLength =
          displayEndCoord - displayStartCoord;

        // Фон (без трансформаций)
        ctx.fillStyle = "#ffffff";
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
        const LAYER1_HEIGHT = 160;
        const LAYER2_TOP = 160; // Speed Curves Layer
        const LAYER2_HEIGHT = 320;
        const LAYER3_TOP = 480; // Track Profile Layer
        const LAYER3_HEIGHT = 160;
        const LAYER4_TOP = 640; // Regime Bands Layer
        const LAYER4_HEIGHT = 160;

        const marginLeft = 80;
        const marginRight = 50;
        const chartWidth = baseWidth - marginLeft - marginRight;

        // Преобразование координаты (км → X) with validation
        const kmToX = (km: number) => {
          if (!isFinite(km)) {
            return marginLeft;
          }

          const normalizedKm = isReversed
            ? displayEndCoord - km
            : km;

          // ФИКСИРОВАННЫЙ МАСШТАБ: 40px на 1 км
          const x =
            marginLeft +
            (normalizedKm - displayStartCoord) * PIXELS_PER_KM;

          return x;
        };

        // ====================================
        // ====================================
        // ====================================
        // LAYER 1: TENSION/COMPRESSION FORCE DYNAMICS (0-160px)
        // ====================================
        if (displaySettings.trackProfile) {
          // Using trackProfile setting to show/hide force layer
          const layer1Top = LAYER1_TOP + 10;
          const layer1Bottom = LAYER1_TOP + LAYER1_HEIGHT - 10;
          const layer1Center = (layer1Top + layer1Bottom) / 2;
          const layer1Height = layer1Bottom - layer1Top;

          // ЛОГИРОВАНИЕ данных
          console.log("[LAYER 1] Рисование слоя усилий:", {
            layer1Top,
            layer1Bottom,
            layer1Center,
            layer1Height,
            displayStartCoord,
            displayEndCoord,
            trackSectionStart:
              trackSection?.stations?.[0]?.startCoord,
            trackSectionEnd:
              trackSection?.stations?.[
                trackSection?.stations?.length - 1
              ]?.endCoord,
            isReversed,
            trainForceDataLength: trainForceData?.length || 0,
          });

          // Draw layer border
          ctx.strokeStyle = "#d1d5db";
          ctx.lineWidth = lineWidth(1);
          ctx.strokeRect(
            marginLeft,
            LAYER1_TOP,
            chartWidth,
            LAYER1_HEIGHT,
          );

          // Draw baseline (blue)
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = lineWidth(2);
          ctx.beginPath();
          ctx.moveTo(marginLeft, layer1Center);
          ctx.lineTo(marginLeft + chartWidth, layer1Center);
          ctx.stroke();

          // Y-СКАЛА от -100 до 100 кН
          ctx.save();
          ctx.strokeStyle = "#9ca3af";
          ctx.lineWidth = lineWidth(1);
          ctx.fillStyle = "#6b7280";
          ctx.font = fontSize(11);
          ctx.textAlign = "right";

          // Горизонтальные пунктирные линии для каждой десятки
          for (let force = -100; force <= 100; force += 10) {
            // Преобразование силы в координату Y
            const y =
              layer1Center - force * (layer1Height / 2 / 100);

            // Пунктирная линия через весь слой
            ctx.setLineDash([3, 3]); // Пунктирный стиль
            ctx.beginPath();
            ctx.moveTo(marginLeft, y);
            ctx.lineTo(marginLeft + chartWidth, y);
            ctx.stroke();

            // Подписи слева (только для круглых значений -100, -50, 0, 50, 100)
            if (force % 50 === 0 || force === 0) {
              ctx.setLineDash([]); // Сброс пунктира
              ctx.fillText(`${force}`, marginLeft - 5, y + 4);

              // Толще линия для основных значений
              ctx.lineWidth = lineWidth(1.5);
              ctx.beginPath();
              ctx.moveTo(marginLeft, y);
              ctx.lineTo(marginLeft + chartWidth, y);
              ctx.stroke();
              ctx.lineWidth = lineWidth(1);
            }
          }

          ctx.setLineDash([]); // Сброс пунктира
          ctx.restore();

          // Draw force curve from trainForceData
          if (trainForceData && trainForceData.length > 0) {
            // Вычисляем смещение: данные начинаются с 0 км, а участок - с displayStartCoord
            // Поэтому добавляем displayStartCoord к локальным координатам данных
            const dataOffset = displayStartCoord; // 1781 км

            console.log("[LAYER 1] Смещение данных:", {
              dataOffset,
              displayStartCoord,
              displayEndCoord,
              firstDataPointMeters: trainForceData[0]?.distance,
              lastDataPointMeters:
                trainForceData[trainForceData.length - 1]
                  ?.distance,
            });

            // Find max absolute force for scaling
            const maxForce = Math.max(
              ...trainForceData.map((d) => Math.abs(d.force)),
              1, // Добавляем минимальное значение для избежания деления на ноль
            );

            const forceScale = layer1Height / 2 / maxForce;

            console.log(
              "[LAYER 1] Параметры масштабирования:",
              {
                maxForce,
                forceScale,
                layer1Height,
              },
            );

            // Draw force curve (RED for positive, BLUE for negative)
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = lineWidth(2);
            ctx.beginPath();
            let started = false;
            let pointsDrawn = 0;

            trainForceData.forEach((point, index) => {
              // КОНВЕРТИРУЕМ МЕТРЫ В КИЛОМЕТРЫ и добавляем смещение участка
              const distanceKm =
                point.distance / 1000 + dataOffset;

              // Проверяем, попадает ли точка в отображаемый диапазон
              if (
                distanceKm >= displayStartCoord &&
                distanceKm <= displayEndCoord
              ) {
                const x = kmToX(distanceKm); // Используем абсолютные километры
                const y =
                  layer1Center - point.force * forceScale;

                // Логирование первых и последних точек
                if (
                  pointsDrawn < 3 ||
                  pointsDrawn === trainForceData.length - 1
                ) {
                  console.log("[LAYER 1] Точка данных:", {
                    index,
                    distanceMeters: point.distance,
                    distanceKm,
                    force: point.force,
                    x,
                    y,
                    inRange: true,
                  });
                }

                if (!started) {
                  ctx.moveTo(x, y);
                  started = true;
                  pointsDrawn++;
                } else {
                  ctx.lineTo(x, y);
                  pointsDrawn++;
                }
              }
            });

            ctx.stroke();

            console.log("[LAYER 1] Статистика отрисовки:", {
              totalPoints: trainForceData.length,
              pointsDrawn,
              dataOffset,
            });

            // Если данных нет в видимом диапазоне (для отладки)
            if (pointsDrawn === 0) {
              console.warn(
                "[LAYER 1] Нет данных в видимом диапазоне! Подробности:",
                {
                  displayStartCoord,
                  displayEndCoord,
                  displayLength:
                    displayEndCoord - displayStartCoord,
                  dataRangeStart:
                    trainForceData[0]?.distance / 1000 +
                    dataOffset,
                  dataRangeEnd:
                    trainForceData[trainForceData.length - 1]
                      ?.distance /
                      1000 +
                    dataOffset,
                  dataOffset,
                  isReversed,
                },
              );

              // Для отладки: рисуем тестовую линию
              ctx.strokeStyle = "#ef4444";
              ctx.lineWidth = lineWidth(2);
              ctx.beginPath();
              const testX1 = kmToX(displayStartCoord + 0.1);
              const testX2 = kmToX(displayStartCoord + 0.5);
              ctx.moveTo(testX1, layer1Center - 50);
              ctx.lineTo(testX2, layer1Center + 50);
              ctx.stroke();
            }

            // ВЕРТИКАЛЬНАЯ ПОДПИСЬ (слева от слоя, повернутая на 90 градусов)
            ctx.save();
            ctx.translate(
              marginLeft - 25,
              layer1Top + layer1Height / 2,
            );
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = "#374151";
            ctx.font = fontSize(12);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Динамика реализованная", 0, 0);
            ctx.restore();

            // Подпись оси X (километры)
            ctx.fillStyle = "#6b7280";
            ctx.font = fontSize(11);
            ctx.textAlign = "center";
          } else {
            console.warn(
              "[LAYER 1] trainForceData пуст или не определен",
            );
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

        // Draw layer border
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = lineWidth(1);
        ctx.strokeRect(
          marginLeft,
          LAYER2_TOP,
          chartWidth,
          LAYER2_HEIGHT,
        );

        // Преобразование скорости (км/ч → Y) for Layer 2
        const speedToY = (speed: number) => {
          if (!isFinite(speed)) {
            return layer2Bottom;
          }
          const maxSpeed = 320;
          const y =
            layer2Top +
            layer2Height -
            (speed / maxSpeed) * layer2Height;

          if (!isFinite(y)) {
            return layer2Bottom;
          }
          return y;
        };

        // Сетка по Y (скорость 0–320)
        ctx.save();
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = lineWidth(1);
        ctx.fillStyle = "#9ca3af";
        ctx.font = fontSize(13);
        ctx.textAlign = "right";

        for (let speed = 0; speed <= 320; speed += 40) {
          const y = speedToY(speed);
          ctx.beginPath();
          ctx.moveTo(marginLeft, y);
          ctx.lineTo(marginLeft + chartWidth, y);
          ctx.stroke();
          ctx.fillText(`${speed}`, marginLeft - 10, y + 4);
        }

        // Сетка по X (км) с адаптивным шагом
        ctx.textAlign = "center";
        ctx.fillStyle = "#9ca3af";

        // ФИКСИРОВАННАЯ СЕТКА (зум отключен)
        let gridInterval = 10; // сетка каждые 10 км
        let labelInterval = 20; // подписи каждые 20 км

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

          if (
            coordinates[coordinates.length - 1] <
            displayEndCoord
          ) {
            coordinates.push(displayEndCoord);
          }

          return coordinates;
        };

        const displayCoordinates = generateDisplayCoordinates();

        for (const coord of displayCoordinates) {
          const x = kmToX(coord);
          ctx.strokeStyle = "#e5e7eb";
          ctx.beginPath();
          ctx.moveTo(x, layer2Top);
          ctx.lineTo(x, layer2Bottom);
          ctx.stroke();

          const displayValue = isReversed
            ? displayEndCoord - (coord - displayStartCoord)
            : coord;
          if (
            Math.round(displayValue) % labelInterval === 0 ||
            coord === displayStartCoord ||
            coord === displayEndCoord
          ) {
            ctx.fillText(
              `${displayValue.toFixed(coord % 1 === 0 ? 0 : 1)}`,
              x,
              layer2Bottom + 18,
            );
          }
        }

        // Axes
        ctx.strokeStyle = "#374151";
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
        ctx.fillStyle = "#374151";
        ctx.font = fontSize(12);
        ctx.textAlign = "center";
        ctx.fillText(
          "Координата (км)",
          marginLeft + chartWidth / 2,
          layer2Bottom + 40,
        );

        ctx.save();
        ctx.translate(
          marginLeft - 50,
          layer2Top + layer2Height / 2,
        );
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Скорость (км/ч)", 0, 0);
        ctx.restore();

        // Кривая скоростных ограничений
        if (
          displaySettings.speedLimits &&
          trackSection?.speedLimits?.length &&
          trackSection?.speedLimits?.length > 0
        ) {
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = lineWidth(2.5);
          ctx.beginPath();

          const relevantLimits =
            trackSection?.speedLimits?.filter(
              (limit) =>
                limit.endCoord >= displayStartCoord &&
                limit.startCoord <= displayEndCoord,
            );

          if (relevantLimits && relevantLimits?.length > 0) {
            let lastSpeed = relevantLimits[0].limitValue;

            const firstLimit = relevantLimits[0];
            const firstX = kmToX(
              Math.max(
                displayStartCoord,
                firstLimit.startCoord,
              ),
            );
            ctx.moveTo(firstX, speedToY(lastSpeed));

            relevantLimits.forEach((limit) => {
              const segmentStart = Math.max(
                displayStartCoord,
                limit.startCoord,
              );
              const segmentEnd = Math.min(
                displayEndCoord,
                limit.endCoord,
              );

              const startX = kmToX(segmentStart);
              const endX = kmToX(segmentEnd);
              const y = speedToY(limit.limitValue);

              if (limit.limitValue !== lastSpeed) {
                ctx.lineTo(startX, speedToY(lastSpeed));
                ctx.lineTo(startX, y);
              } else {
                ctx.lineTo(startX, y);
              }

              ctx.lineTo(endX, y);
              lastSpeed = limit.limitValue;
            });
          }

          ctx.stroke();

          ctx.fillStyle = "#ef4444";
          ctx.font = fontSize(11);
          ctx.textAlign = "left";
          ctx.fillText(
            "Скоростные ограничения",
            marginLeft + 10,
            layer2Top + 15,
          );
        }

        // Calculated Speed Curve (from trainForceData velocity)
        if (trainForceData && trainForceData.length > 0) {
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = lineWidth(2);
          ctx.beginPath();
          let started = false;
          trainForceData.forEach((point) => {
            if (
              point.distance >= displayStartCoord &&
              point.distance <= displayEndCoord
            ) {
              const x = kmToX(point.distance);
              // Convert m/s to km/h: velocity is in m/s, multiply by 3.6
              const speedKmh = point.velocity * 3.6;
              const y = speedToY(speedKmh);
              if (!started) {
                ctx.moveTo(x, y);
                started = true;
              } else {
                ctx.lineTo(x, y);
              }
            }
          });
          ctx.stroke();

          ctx.fillStyle = "#10b981";
          ctx.font = fontSize(11);
          ctx.textAlign = "left";
          ctx.fillText(
            "Расчётная скорость",
            marginLeft + 10,
            layer2Top + 30,
          );
        }

        // Station markers (vertical lines in Layer 2)
        if (
          trackSection &&
          trackSection.stations &&
          trackSection.stations.length > 0
        ) {
          trackSection.stations.forEach((station, index) => {
            const isLastStation =
              index === trackSection.stations.length - 1;
            const stationKm = isLastStation
              ? station.endCoord
              : station.startCoord;
            const xWorld = kmToX(stationKm);

            // Vertical dashed line
            ctx.strokeStyle = "#6b7280";
            ctx.lineWidth = lineWidth(1.5);
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(xWorld, layer2Top);
            ctx.lineTo(xWorld, layer2Bottom);
            ctx.stroke();
            ctx.setLineDash([]);

            // Station name
            ctx.save();
            ctx.translate(xWorld, layer2Top - 5);
            ctx.rotate(-Math.PI / 4);
            ctx.fillStyle = "#374151";
            ctx.font = fontSize(10);
            ctx.textAlign = "right";
            ctx.fillText(station.stationName, 0, 0);
            ctx.restore();
          });
        }

        ctx.restore();

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
          ctx.strokeStyle = "#d1d5db";
          ctx.lineWidth = lineWidth(1);
          ctx.strokeRect(
            marginLeft,
            LAYER3_TOP,
            chartWidth,
            LAYER3_HEIGHT,
          );

          // Top and bottom lines
          const profileStripTop = layer3Top;
          const profileStripBottom = layer3Bottom;

          ctx.strokeStyle = "#374151";
          ctx.lineWidth = lineWidth(2);
          ctx.beginPath();
          ctx.moveTo(kmToX(displayStartCoord), profileStripTop);
          ctx.lineTo(kmToX(displayEndCoord), profileStripTop);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(
            kmToX(displayStartCoord),
            profileStripBottom,
          );
          ctx.lineTo(
            kmToX(displayEndCoord),
            profileStripBottom,
          );
          ctx.stroke();

          const relevantProfiles =
            trackSection.pathProfiles.filter(
              (profile) =>
                profile.endCoord >= displayStartCoord &&
                profile.startCoord <= displayEndCoord,
            );

          relevantProfiles.forEach((profile) => {
            const segmentStart = Math.max(
              displayStartCoord,
              profile.startCoord,
            );
            const segmentEnd = Math.min(
              displayEndCoord,
              profile.endCoord,
            );

            const startX = kmToX(segmentStart);
            const endX = kmToX(segmentEnd);

            if (segmentStart > displayStartCoord) {
              ctx.strokeStyle = "#374151";
              ctx.lineWidth = lineWidth(2);
              ctx.beginPath();
              ctx.moveTo(startX, profileStripTop);
              ctx.lineTo(startX, profileStripBottom);
              ctx.stroke();
            }

            if (segmentEnd === displayEndCoord) {
              ctx.beginPath();
              ctx.moveTo(endX, profileStripTop);
              ctx.lineTo(endX, profileStripBottom);
              ctx.stroke();
            }

            if (
              profile.slopePromille !== 0 &&
              endX - startX > 2
            ) {
              ctx.strokeStyle = "#64748b";
              ctx.lineWidth = lineWidth(2);

              ctx.beginPath();
              if (profile.slopePromille < 0) {
                ctx.moveTo(startX, profileStripTop);
                ctx.lineTo(endX, profileStripBottom);
              } else if (profile.slopePromille > 0) {
                ctx.moveTo(startX, profileStripBottom);
                ctx.lineTo(endX, profileStripTop);
              }
              ctx.stroke();
            }

            // Label slope value in the center
            if (
              profile.slopePromille !== 0 &&
              endX - startX > 20
            ) {
              ctx.fillStyle = "#475569";
              ctx.font = fontSize(11);
              ctx.textAlign = "center";
              ctx.fillText(
                `${profile.slopePromille}‰`,
                (startX + endX) / 2,
                (layer3Top + layer3Bottom) / 2,
              );
            }
          });

          // Label
          ctx.fillStyle = "#374151";
          ctx.font = fontSize(12);
          ctx.textAlign = "left";
          ctx.fillText(
            "Профиль пути",
            marginLeft + 10,
            layer3Top - 5,
          );
        }

        // Оптимальная кривая скорости
        if (
          displaySettings.optimalSpeedCurve &&
          chartData?.workflow?.optimalSpeedCurve
        ) {
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = lineWidth(2);
          ctx.setLineDash([5, 5]);
          ctx.beginPath();

          const pointsInRange =
            chartData?.workflow.optimalSpeedCurve.filter(
              (point) =>
                point.km >= displayStartCoord &&
                point.km <= displayEndCoord,
            );

          if (pointsInRange.length > 0) {
            const firstPoint = pointsInRange[0];
            ctx.moveTo(
              kmToX(firstPoint.km),
              speedToY(firstPoint.speed),
            );

            for (let i = 1; i < pointsInRange.length; i++) {
              const point = pointsInRange[i];
              ctx.lineTo(
                kmToX(point.km),
                speedToY(point.speed),
              );
            }
          }

          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = "#3b82f6";
          ctx.font = fontSize(11);
          ctx.textAlign = "left";
          ctx.fillText(
            "Оптимальная кривая",
            marginLeft + 10,
            layer2Top + 45,
          );
        }

        // Фактическая кривая скорости
        if (
          displaySettings.actualSpeedCurve &&
          chartData?.workflow?.actualSpeedCurve
        ) {
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = lineWidth(2.5);
          ctx.beginPath();

          const pointsInRange =
            chartData.workflow.actualSpeedCurve.filter(
              (point) =>
                point.km >= displayStartCoord &&
                point.km <= displayEndCoord,
            );

          if (pointsInRange.length > 0) {
            const firstPoint = pointsInRange[0];
            ctx.moveTo(
              kmToX(firstPoint.km),
              speedToY(firstPoint.speed),
            );

            for (let i = 1; i < pointsInRange.length; i++) {
              const point = pointsInRange[i];
              ctx.lineTo(
                kmToX(point.km),
                speedToY(point.speed),
              );
            }
          }

          ctx.stroke();

          ctx.fillStyle = "#22c55e";
          ctx.font = fontSize(11);
          ctx.textAlign = "left";
          ctx.fillText(
            "Фактическая кривая",
            marginLeft + 10,
            layer2Top + 60,
          );
        }

        // ====================================
        // LAYER 4: REGIME BANDS (640-800px)
        // ====================================
        if (
          displaySettings.regimeBands &&
          chartData?.workflow?.regimeArrows &&
          chartData.workflow.locomotive
        ) {
          const layer4Top = LAYER4_TOP + 10;
          const arrowY = layer4Top + 30;

          // Draw layer border
          ctx.strokeStyle = "#d1d5db";
          ctx.lineWidth = lineWidth(1);
          ctx.strokeRect(
            marginLeft,
            LAYER4_TOP,
            chartWidth,
            LAYER4_HEIGHT,
          );

          chartData.workflow.regimeArrows.forEach(
            (arrow, index) => {
              const mode =
                chartData.workflow?.locomotive?.tractionModes.find(
                  (m) => m.id === arrow.modeId,
                );
              if (!mode) return;

              const startX = kmToX(arrow.startKm);
              const endX = kmToX(arrow.endKm);
              const isSelected = selectedArrow === arrow.id;
              const isHovered =
                hoveredArrow?.arrowId === arrow.id;

              if (isSelected) {
                ctx.globalAlpha = 0.15;
                for (let i = 0; i < 3; i++) {
                  ctx.strokeStyle = "#fbbf24";
                  ctx.lineWidth = lineWidth(12 + i * 4);
                  ctx.beginPath();
                  ctx.moveTo(startX, arrowY);
                  ctx.lineTo(endX, arrowY);
                  ctx.stroke();
                }
                ctx.globalAlpha = 1;

                ctx.strokeStyle = "#fbbf24";
                ctx.lineWidth = lineWidth(5);
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.moveTo(startX, arrowY);
                ctx.lineTo(endX, arrowY);
                ctx.stroke();
                ctx.globalAlpha = 1;
              }

              ctx.strokeStyle = mode.color;
              ctx.lineWidth = isSelected
                ? lineWidth(4)
                : isHovered
                  ? lineWidth(4)
                  : lineWidth(3);
              ctx.setLineDash(
                mode.lineStyle === "dashed"
                  ? [8, 4]
                  : mode.lineStyle === "dotted"
                    ? [2, 4]
                    : [],
              );

              ctx.beginPath();
              ctx.moveTo(startX, arrowY);
              ctx.lineTo(endX, arrowY);
              ctx.stroke();

              const arrowheadSize = isSelected ? 12 : 10;
              ctx.fillStyle = mode.color;
              ctx.beginPath();
              ctx.moveTo(endX, arrowY);
              ctx.lineTo(
                endX - arrowheadSize,
                arrowY - arrowheadSize / 2,
              );
              ctx.lineTo(
                endX - arrowheadSize,
                arrowY + arrowheadSize / 2,
              );
              ctx.fill();

              ctx.setLineDash([]);

              ctx.fillStyle = mode.color;
              ctx.font = fontSize(isSelected ? 15 : 13);
              ctx.textAlign = "center";

              if (isSelected) {
                const labelText = mode.label;
                const textMetrics = ctx.measureText(labelText);
                const labelX = (startX + endX) / 2;
                const labelY = arrowY - 10;
                const padding = 4 / zoom;

                ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                ctx.fillRect(
                  labelX - textMetrics.width / 2 - padding,
                  labelY - 12 / zoom,
                  textMetrics.width + padding * 2,
                  16 / zoom,
                );
                ctx.fillStyle = mode.color;
              }

              ctx.fillText(
                mode.label,
                (startX + endX) / 2,
                arrowY - 12,
              );

              if (isSelected) {
                const handleRadius = 7 / zoom;
                const handleStrokeWidth = 2.5 / zoom;

                if (index > 0) {
                  const isStartHovered =
                    hoveredArrow?.handle === "start" &&
                    hoveredArrow?.arrowId === arrow.id;
                  const isStartDragged =
                    draggedArrow?.handle === "start" &&
                    draggedArrow?.arrowId === arrow.id;
                  const showLimitFeedback =
                    isStartDragged && resizeLimitReached;

                  if (isStartHovered || showLimitFeedback) {
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = showLimitFeedback
                      ? "#ef4444"
                      : "#fbbf24";
                    ctx.beginPath();
                    ctx.arc(
                      startX,
                      arrowY,
                      handleRadius * 2,
                      0,
                      Math.PI * 2,
                    );
                    ctx.fill();
                    ctx.globalAlpha = 1;
                  }

                  ctx.fillStyle = showLimitFeedback
                    ? "#ef4444"
                    : isStartHovered
                      ? "#fbbf24"
                      : "#ffffff";
                  ctx.strokeStyle = showLimitFeedback
                    ? "#ef4444"
                    : "#fbbf24";
                  ctx.lineWidth = handleStrokeWidth;
                  ctx.beginPath();
                  ctx.arc(
                    startX,
                    arrowY,
                    handleRadius,
                    0,
                    Math.PI * 2,
                  );
                  ctx.fill();
                  ctx.stroke();

                  ctx.fillStyle = "#374151";
                  ctx.beginPath();
                  ctx.arc(
                    startX,
                    arrowY,
                    handleRadius / 3,
                    0,
                    Math.PI * 2,
                  );
                  ctx.fill();
                }

                const isEndHovered =
                  hoveredArrow?.handle === "end" &&
                  hoveredArrow?.arrowId === arrow.id;
                const isEndDragged =
                  draggedArrow?.handle === "end" &&
                  draggedArrow?.arrowId === arrow.id;
                const showLimitFeedback =
                  isEndDragged && resizeLimitReached;

                if (isEndHovered || showLimitFeedback) {
                  ctx.globalAlpha = 0.3;
                  ctx.fillStyle = showLimitFeedback
                    ? "#ef4444"
                    : "#fbbf24";
                  ctx.beginPath();
                  ctx.arc(
                    endX,
                    arrowY,
                    handleRadius * 2,
                    0,
                    Math.PI * 2,
                  );
                  ctx.fill();
                  ctx.globalAlpha = 1;
                }

                ctx.fillStyle = showLimitFeedback
                  ? "#ef4444"
                  : isEndHovered
                    ? "#fbbf24"
                    : "#ffffff";
                ctx.strokeStyle = showLimitFeedback
                  ? "#ef4444"
                  : "#fbbf24";
                ctx.lineWidth = handleStrokeWidth;
                ctx.beginPath();
                ctx.arc(
                  endX,
                  arrowY,
                  handleRadius,
                  0,
                  Math.PI * 2,
                );
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = "#374151";
                ctx.beginPath();
                ctx.arc(
                  endX,
                  arrowY,
                  handleRadius / 3,
                  0,
                  Math.PI * 2,
                );
                ctx.fill();
              }
            },
          );

          // Layer label
          ctx.fillStyle = "#374151";
          ctx.font = fontSize(12);
          ctx.textAlign = "left";
          ctx.fillText(
            "Режимы ведения",
            marginLeft + 10,
            layer4Top - 5,
          );
        }

        // Дополнительная шкала км под стрелками (DISABLED - using Layer 2 labels instead)
        if (
          false &&
          chartData?.workflow?.regimeArrows &&
          chartData.workflow?.locomotive
        ) {
          const layer4Top = LAYER4_TOP + 10;
          const arrowY = layer4Top + 30;
          const rulerY = arrowY + 40;

          ctx.strokeStyle = "#374151";
          ctx.lineWidth = lineWidth(2);
          ctx.beginPath();
          ctx.moveTo(kmToX(displayStartCoord), rulerY);
          ctx.lineTo(kmToX(displayEndCoord), rulerY);
          ctx.stroke();

          ctx.fillStyle = "#374151";
          ctx.font = fontSize(13);
          ctx.textAlign = "center";

          const rulerCoordinates: number[] = [];
          let currentRuler = displayStartCoord;

          while (currentRuler <= displayEndCoord) {
            rulerCoordinates.push(currentRuler);
            currentRuler += 1;
          }

          if (
            rulerCoordinates[rulerCoordinates.length - 1] <
            displayEndCoord
          ) {
            rulerCoordinates.push(displayEndCoord);
          }

          for (const coord of rulerCoordinates) {
            const x = kmToX(coord);
            const displayValue = isReversed
              ? displayEndCoord - (coord - displayStartCoord)
              : coord;
            const tickHeightRuler =
              Math.round(displayValue) % 5 === 0 ? 8 : 5;

            ctx.strokeStyle = "#374151";
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
              ctx.fillText(
                `${displayValue.toFixed(0)}`,
                x,
                rulerY + 24,
              );
            }
          }

          ctx.font = fontSize(13);
          ctx.textAlign = "left";
          ctx.fillText(
            "км",
            kmToX(displayEndCoord) + 10,
            rulerY + 8,
          );
        }

        const drawOperationModeLine = (
          yPosition: number,
          segments: OperationModeSegment[],
          lineHeight: number,
        ) => {
          segments.forEach((segment, index) => {
            const segmentStart = Math.max(
              displayStartCoord,
              segment.startKm,
            );
            const segmentEnd = Math.min(
              displayEndCoord,
              segment.endKm,
            );

            if (segmentStart >= segmentEnd) return;

            const startX = kmToX(segmentStart);
            const endX = kmToX(segmentEnd);

            let color: string;
            switch (segment.mode) {
              case "acceleration":
                color = "#3b82f6";
                break;
              case "stable":
                color = "#eab308";
                break;
              case "coasting":
                color = "#22c55e";
                break;
              case "braking":
                color = "#ef4444";
                break;
              case "limit-traction":
                color = "#a855f7";
                break;
              case "limit-braking":
                color = "#f97316";
                break;
              default:
                color = "#9ca3af";
            }

            ctx.fillStyle = color;
            ctx.fillRect(
              startX,
              yPosition,
              endX - startX,
              lineHeight,
            );

            ctx.lineWidth = lineWidth(1);

            if (index === 0) {
              ctx.strokeStyle = "#1f2937";
              ctx.beginPath();
              ctx.moveTo(startX, yPosition);
              ctx.lineTo(startX, yPosition + lineHeight);
              ctx.stroke();
            } else {
              const prevSegment = segments[index - 1];
              let prevColor: string;
              switch (prevSegment.mode) {
                case "acceleration":
                  prevColor = "#3b82f6";
                  break;
                case "stable":
                  prevColor = "#eab308";
                  break;
                case "coasting":
                  prevColor = "#22c55e";
                  break;
                case "braking":
                  prevColor = "#ef4444";
                  break;
                case "limit-traction":
                  prevColor = "#a855f7";
                  break;
                case "limit-braking":
                  prevColor = "#f97316";
                  break;
                default:
                  prevColor = "#9ca3af";
              }

              ctx.strokeStyle =
                color === prevColor ? color : "#1f2937";
              ctx.beginPath();
              ctx.moveTo(startX, yPosition);
              ctx.lineTo(startX, yPosition + lineHeight);
              ctx.stroke();
            }

            if (index === segments.length - 1) {
              ctx.strokeStyle = "#1f2937";
              ctx.beginPath();
              ctx.moveTo(endX, yPosition);
              ctx.lineTo(endX, yPosition + lineHeight);
              ctx.stroke();
            }
          });
        };

        // Идеальные режимы (DISABLED - using 4-layer structure instead)
        /*if (
          false &&
          chartData?.workflow?.optimalSpeedCurve &&
          chartData.workflow.trackSection
        ) {
          const idealModeY = chartData.workflow.regimeArrows
            ? marginTop + chartHeight + 250
            : marginTop + chartHeight + 170;
          const lineHeight = 20;

          const idealModeSegments = analyzeOperationModes(
            chartData?.workflow?.optimalSpeedCurve,
            chartData.workflow.trackSection,
          );

          ctx.fillStyle = "#9ca3af";
          ctx.font = fontSize(13);
          ctx.textAlign = "left";
          ctx.fillText(
            "Идеальные режимы:",
            marginLeft,
            idealModeY - 5,
          );

          drawOperationModeLine(
            idealModeY,
            idealModeSegments,
            lineHeight,
          );
        }*/

        // Фактические режимы (DISABLED - using 4-layer structure instead)
        /*if (
          false && chartData && chartData?.workflow &&
          chartData?.workflow?.actualSpeedCurve &&
          chartData?.workflow?.trackSection &&
          chartData.workflow?.regimeArrows
        ) {
          const  marginTop = 50;
          const chartHeight = 300;
          const actualModeY = marginTop + chartHeight + 310;
          const lineHeight = 20;

          const lastArrow =
            chartData?.workflow?.regimeArrows[
              chartData?.workflow?.regimeArrows?.length - 1
            ];
          const endKm = lastArrow
            ? lastArrow.endKm
            : chartData.workflow.trackSection.length;

          const actualModeSegments = analyzeOperationModes(
            chartData.workflow.actualSpeedCurve,
            chartData.workflow.trackSection,
            endKm,
          );

          ctx.fillStyle = "#9ca3af";
          ctx.font = fontSize(13);
          ctx.textAlign = "left";
          ctx.fillText(
            "Фактические режимы:",
            marginLeft,
            actualModeY - 5,
          );

          drawOperationModeLine(
            actualModeY,
            actualModeSegments,
            lineHeight,
          );
        }*/

        // Легенда режимов
        if (
          chartData?.workflow?.optimalSpeedCurve ||
          chartData?.workflow?.actualSpeedCurve
        ) {
          let legendY: number;
          const marginTop = 50;
          const chartHeight = 300;

          if (
            chartData?.workflow?.actualSpeedCurve &&
            chartData.workflow.regimeArrows
          ) {
            legendY = marginTop + chartHeight + 355;
          } else if (chartData.workflow.regimeArrows) {
            legendY = marginTop + chartHeight + 305;
          } else {
            legendY = marginTop + chartHeight + 205;
          }

          const swatchSize = 15;
          let currentX = marginLeft;

          const legendItems = [
            { color: "#3b82f6", label: "разгон" },
            { color: "#eab308", label: "стабильная скорость" },
            { color: "#22c55e", label: "выбег" },
            { color: "#ef4444", label: "торможение" },
            { color: "#a855f7", label: "огр. скор. (тяга)" },
            { color: "#f97316", label: "огр. скор. (торм.)" },
          ];

          ctx.font = fontSize(13);
          ctx.textAlign = "left";

          legendItems.forEach((item) => {
            ctx.fillStyle = item.color;
            ctx.fillRect(
              currentX,
              legendY,
              swatchSize,
              swatchSize,
            );
            ctx.strokeStyle = "#1f2937";
            ctx.lineWidth = lineWidth(1);
            ctx.strokeRect(
              currentX,
              legendY,
              swatchSize,
              swatchSize,
            );

            ctx.fillStyle = "#6b7280";
            ctx.fillText(
              item.label,
              currentX + swatchSize + 5,
              legendY + swatchSize - 3,
            );

            const textWidth = ctx.measureText(item.label).width;
            currentX += swatchSize + 5 + textWidth + 20;
          });
        }

        // Рисуем размещенные объекты из палитры
        if (
          displaySettings.objectMarkers &&
          chartData.canvasObjects &&
          chartData.canvasObjects.length > 0
        ) {
          chartData.canvasObjects.forEach((obj) => {
            ctx.save();

            // Определяем цвет и стиль в зависимости от категории объекта
            let iconColor = "#3b82f6";
            let iconSize = 12;

            switch (obj.type) {
              /*case "speed":
                iconColor = "#3b82f6";
                break;
              case "control-modes":
                iconColor = "#10b981";
                break;
              case "profile":
                iconColor = "#f59e0b";
                break;
              case "notations":
                iconColor = "#6b7280";
                break;
              case "technical":
                iconColor = "#8b5cf6";
                break;
              case "regime-arrows":
                iconColor = "#ef4444";
                break;*/
              default:
                iconColor = "#3b82f6";
            }

            // Рисуем маркер объекта
            ctx.fillStyle = iconColor;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = lineWidth(2);

            // Круглый маркер
            ctx.beginPath();
            ctx.arc(
              obj.x,
              obj.y,
              iconSize / zoom,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.stroke();

            // Подпись объекта (если есть)
            if (obj.label) {
              ctx.fillStyle = "#1f2937";
              ctx.font = fontSize(11);
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillText(
                obj.label,
                obj.x,
                obj.y + (iconSize + 4) / zoom,
              );
            }

            // Подсветка при наведении
            if (hoveredObject && hoveredObject.id === obj.id) {
              ctx.strokeStyle = "#3b82f6";
              ctx.lineWidth = lineWidth(3);
              ctx.beginPath();
              ctx.arc(
                obj.x,
                obj.y,
                (iconSize + 4) / zoom,
                0,
                Math.PI * 2,
              );
              ctx.stroke();
            }

            ctx.restore();
          });
        }

        ctx.restore(); // ВОЗВРАТ К ИСХОДНОЙ (НЕМАСШТАБИРОВАННОЙ) СИСТЕМЕ

        // Рисуем рамку выделения (marquee) в экранных координатах
        if (marqueeStart && marqueeEnd) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0); // гарантируем отсутствие трансформаций
          ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          const startX = marqueeStart.x * zoom + panX;
          const startY = marqueeStart.y + panY;
          const endX = marqueeEnd.x * zoom + panX;
          const endY = marqueeEnd.y + panY;
          ctx.fillRect(
            startX,
            startY,
            endX - startX,
            endY - startY,
          );
          ctx.strokeRect(
            startX,
            startY,
            endX - startX,
            endY - startY,
          );
          ctx.restore();
        }

        /*if (stationScreenPositions && stationScreenPositions?.length > 0) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0); // гарантируем отсутствие остаточных трансформаций
          ctx.textAlign = "center";
          ctx.font = "13px sans-serif";

          const marginTop = 50;
          const chartHeight = 300;

          const baseAxisY = marginTop + chartHeight; // мировая ось X графика
          const iconRadius = 6; // фиксированный пиксельный радиус
          const iconOffsetY = 15; // вверх от оси
          const labelOffsetY = 42; // вниз от оси

          stationScreenPositions.forEach(({ xWorld, name }) => {
            // Перевод мировой X в экранную:
            const xScreen = xWorld * zoom + panX;
            const axisYScreen = baseAxisY + panY;

            // Иконка
            const iconYScreen = axisYScreen - iconOffsetY;

            ctx.beginPath();
            ctx.arc(
              xScreen,
              iconYScreen,
              iconRadius,
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.strokeStyle = "#374151";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(
              xScreen,
              iconYScreen,
              iconRadius,
              -Math.PI / 2,
              Math.PI / 2,
            );
            ctx.fillStyle = "#374151";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(
              xScreen,
              iconYScreen,
              iconRadius,
              0,
              Math.PI * 2,
            );
            ctx.strokeStyle = "#374151";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Подпись
            ctx.fillStyle = "#3b82f6";
            ctx.fillText(
              name,
              xScreen,
              axisYScreen + labelOffsetY,
            );
          });

          ctx.restore();
        }*/
      } catch (error) {
        // Clear canvas and show error
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        ctx.fillStyle = "#ef4444";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          "Ошибка при отрисовке графика",
          baseWidth / 2,
          baseHeight / 2 - 10,
        );
        ctx.fillStyle = "#6b7280";
        ctx.font = "12px sans-serif";
        ctx.fillText(
          String(error),
          baseWidth / 2,
          baseHeight / 2 + 15,
        );
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
    ],
  );

  // Анализ режимов движения
  const analyzeOperationModes = (
    speedCurve: { km: number; speed: number }[],
    trackSection: { speedLimits: SpeedLimit[]; length: number },
    maxKm?: number,
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
        trackSection.stations[trackSection.stations.length - 1]
          .endCoord;
    }

    const isReversed = actualStartCoord > actualEndCoord;
    const displayStartCoord = isReversed
      ? actualEndCoord
      : actualStartCoord;
    const displayEndCoord = isReversed
      ? actualStartCoord
      : actualEndCoord;

    const endKm = maxKm || trackSection.length;

    const pointsInRange = speedCurve.filter(
      (point) =>
        point.km >= displayStartCoord &&
        point.km <= Math.min(endKm, displayEndCoord),
    );

    if (pointsInRange.length < 2) return segments;

    for (let i = 0; i < pointsInRange.length - 1; i++) {
      const point1 = pointsInRange[i];
      const point2 = pointsInRange[i + 1];

      const segmentEndKm = Math.min(
        point2.km,
        endKm,
        displayEndCoord,
      );
      const speedChange = point2.speed - point1.speed;
      const distanceChange = point2.km - point1.km;
      const acceleration =
        distanceChange > 0 ? speedChange / distanceChange : 0;

      const speedLimit = trackSection.speedLimits.find(
        (sl) =>
          point1.km >= sl.startCoord && point1.km < sl.endCoord,
      );
      const limitValue = speedLimit
        ? speedLimit.limitValue
        : 200;
      const atLimit = point1.speed >= limitValue * 0.95;

      let mode: OperationMode;

      if (atLimit) {
        if (acceleration < -0.5) {
          mode = "limit-braking";
        } else {
          mode = "limit-traction";
        }
      } else if (acceleration > 1) {
        mode = "acceleration";
      } else if (acceleration < -2) {
        mode = "braking";
      } else if (acceleration < -0.3) {
        mode = "coasting";
      } else {
        mode = "stable";
      }

      segments.push({
        startKm: point1.km,
        endKm: segmentEndKm,
        mode,
      });

      if (
        segmentEndKm >= endKm ||
        segmentEndKm >= displayEndCoord
      )
        break;
    }

    return segments;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isDrawing = false;

    const draw = () => {
      if (isDrawing) return;

      isDrawing = true;

      // Очистка канваса
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        // Draw workflow chart if available
        if (chartData.workflow?.trackSection) {
          drawWorkflowCanvas(ctx, baseWidth, baseHeight, zoom);
        } else {
          // Draw placeholder
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, baseWidth, baseHeight);
          ctx.fillStyle = "#6b7280";
          ctx.font = "20px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            "Выберите участок пути в боковой панели для начала работы",
            baseWidth / 2,
            baseHeight / 2,
          );
        }
      } catch (error) {
        console.error("Ошибка при отрисовке:", error);
      } finally {
        isDrawing = false;
      }
    };

    // Дебаунс перерисовки
    const debouncedDraw = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    // Запускаем отрисовку
    debouncedDraw();

    // Добавляем обработчики для перерисовки при изменениях
    const handleResize = () => {
      debouncedDraw();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [
    // ТОЛЬКО необходимые зависимости
    chartData.workflow?.trackSection?.id,
    chartData.workflow?.locomotive?.id,
    chartData.workflow?.regimeArrows,
    chartData.canvasObjects,
    displaySettings,
    panX,
    panY,
    zoom,
    baseWidth,
    baseHeight,
    drawWorkflowCanvas, // Эта функция должна быть мемоизирована с useCallback
  ]);

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
      const maxScrollX = Math.max(
        0,
        contentWidth - viewportWidth + PADDING,
      );
      const maxScrollY = Math.max(
        0,
        contentHeight - viewportHeight + PADDING,
      );

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

    scrollContainer.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    // Also handle wheel events for boundary checking
    const handleWheel = (e: WheelEvent) => {
      // Let the scroll handler catch boundary violations
      requestAnimationFrame(handleScroll);
    };

    scrollContainer.addEventListener("wheel", handleWheel, {
      passive: true,
    });

    return () => {
      scrollContainer.removeEventListener(
        "scroll",
        handleScroll,
      );
      scrollContainer.removeEventListener("wheel", handleWheel);
    };
  }, [baseWidth, baseHeight]);

  // Center canvas on initial track section load
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !chartData.workflow?.trackSection)
      return;

    // Set initial scroll position to show some padding (50px from edges)
    const initialScrollX = 50;
    const initialScrollY = 50;

    scrollContainer.scrollLeft = initialScrollX;
    scrollContainer.scrollTop = initialScrollY;
  }, [chartData.workflow?.trackSection]);

  // Hover по объектам
  useEffect(() => {
    const hovered = chartData.canvasObjects.find((obj) => {
      const dx = obj.x - mousePos.x;
      const dy = obj.y - mousePos.y;
      return Math.sqrt(dx * dx + dy * dy) < 15;
    });
    setHoveredObject(hovered || null);
  }, [mousePos, chartData.canvasObjects]);

  // Hover по данным (старая логика, использует базовые оси)
  useEffect(() => {
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
    const maxCoord =
      allCoords.length > 0 ? Math.max(...allCoords, 200) : 200;

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

        if (
          mousePos.x >= startX - 10 &&
          mousePos.x <= endX + 10
        ) {
          const segmentY =
            currentY +
            ((mousePos.x - startX) / (endX - startX)) *
              (nextY - currentY);
          if (Math.abs(mousePos.y - segmentY) < 10) {
            const kmPos =
              profile.startCoord +
              ((mousePos.x - startX) / (endX - startX)) *
                (profile.endCoord - profile.startCoord);
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
        const y =
          speedLimitBaseY - speedRatio * speedGraphHeight;

        if (
          mousePos.x >= startX &&
          mousePos.x <= endX &&
          Math.abs(mousePos.y - y) < 15
        ) {
          const kmPos =
            limit.startCoord +
            ((mousePos.x - startX) / (endX - startX)) *
              (limit.endCoord - limit.startCoord);
          setHoveredDataPoint({
            label: `Скоростные ограничения - км: ${kmPos.toFixed(
              1,
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

      if (
        Math.abs(mousePos.x - centerX) < 30 &&
        Math.abs(mousePos.y - axisY) < 15
      ) {
        setHoveredDataPoint({
          label: `Station: ${segment.stationName}, Km: ${segment.startCoord}-${segment.endCoord}`,
          x: centerX,
          y: axisY - 10,
        });
        return;
      }
    }

    setHoveredDataPoint(null);
  }, [mousePos, chartData, baseWidth, baseHeight]);

  // Hover по стрелкам (резервный эффект; основное наведение уже в handlePanMove)
  useEffect(() => {
    if (
      !chartData.workflow?.regimeArrows ||
      !chartData.workflow?.trackSection
    ) {
      setHoveredArrow(null);
      return;
    }

    const trackLength = chartData.workflow.trackSection.length;
    const marginLeft = 80;
    const marginRight = 50;
    const marginTop = 50;
    const marginBottom = 240;
    const chartWidth = baseWidth - marginLeft - marginRight;
    const arrowY =
      marginTop + (baseHeight - marginTop - marginBottom) + 180;

    // Use the proper kmToX converter that handles track coordinate system
    const kmToX = createKmToXConverter(chartData, marginLeft);

    const handleRadius = 8;

    for (
      let i = 0;
      i < chartData.workflow.regimeArrows.length;
      i++
    ) {
      const arrow = chartData.workflow.regimeArrows[i];
      const startX = kmToX(arrow.startKm);
      const endX = kmToX(arrow.endKm);

      if (i > 0 && selectedArrow === arrow.id) {
        const distToStart = Math.sqrt(
          Math.pow(mousePos.x - startX, 2) +
            Math.pow(mousePos.y - arrowY, 2),
        );
        if (distToStart < handleRadius) {
          setHoveredArrow({
            arrowId: arrow.id,
            handle: "start",
          });
          return;
        }
      }

      if (selectedArrow === arrow.id) {
        const distToEnd = Math.sqrt(
          Math.pow(mousePos.x - endX, 2) +
            Math.pow(mousePos.y - arrowY, 2),
        );
        if (distToEnd < handleRadius) {
          setHoveredArrow({ arrowId: arrow.id, handle: "end" });
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
  ]);

  const handleObjectMouseDown = (e: React.MouseEvent) => {
    if (hoveredObject && !placingObject && !isMarqueeZoom) {
      setDraggedObject(hoveredObject);
      setIsPanning(false);
      e.stopPropagation();
    }
  };

  const handleObjectDoubleClick = (e: React.MouseEvent) => {
    if (hoveredObject && !placingObject && !isMarqueeZoom) {
      const updatedObjects = chartData.canvasObjects.filter(
        (obj) => obj.id !== hoveredObject.id,
      );
      onUpdateChartData({ canvasObjects: updatedObjects });
      setHoveredObject(null);
      e.stopPropagation();
    }
  };

  const handleArrowMouseDown = (e: React.MouseEvent) => {
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
  };

  React.useEffect(() => {
    const { topY, bottomY } = getCanvasContentYBounds();
    const contentHeight = bottomY - topY;
  }, [containerRef?.current?.clientHeight]);

  // Кнопка "Начальный масштаб" — сброс зума и повторное вертикальное центрирование всей области
  const handleResetZoom = () => {
    // Сброс горизонтального масштаба
    setZoom(1);
    setPanX(0);

    // Вертикальное позиционирование (без масштабирования)
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      const { topY, bottomY } = getCanvasContentYBounds();
      const contentHeight = bottomY - topY;

      if (contentHeight > containerHeight) {
        // Если контент не помещается, показываем верхнюю часть
        setPanY(containerHeight - bottomY + 50);
      } else {
        // Иначе центрируем
        const contentCenter = topY + contentHeight / 2;
        const visibleCenter = containerHeight / 2;
        setPanY(visibleCenter - contentCenter);
      }
    }
  };

  return (
    <TooltipProvider>
      <div
        className="flex-1 bg-gray-50 overflow-hidden flex flex-row"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Main canvas area */}
        <div
          className="flex-1 p-6 overflow-hidden flex flex-col"
          ref={containerRef}
          style={{ transition: "all 0.3s ease" }}
        >
          <div
            className="bg-white rounded-lg shadow-sm p-6 flex-1 flex flex-col overflow-hidden"
            style={{
              overflowY: "scroll",
              position: "relative",
            }}
          >
            {/* Панель управления */}
            <div
              className="mb-4 flex items-center justify-between flex-shrink-0"
              style={{
                position: "sticky",
                top: "0",
                paddingLeft: 10,
                paddingRight: 10,
                zIndex: 30,
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
                  onClick={() =>
                    setZoom((prev) => Math.min(4, prev * 1.2))
                  }
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setZoom((prev) =>
                      Math.max(0.25, prev / 1.2),
                    )
                  }
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={
                    isMarqueeZoom ? "default" : "outline"
                  }
                  onClick={() => {
                    setIsMarqueeZoom(!isMarqueeZoom);
                    setPlacingObject(null);
                  }}
                >
                  Выбрать область
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetZoom}
                >
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
              <ContextMenuTrigger>
                <div
                  ref={scrollContainerRef}
                  className="border border-gray-300 rounded flex-1 overflow-auto canvas-scrollbar relative"
                  style={{
                    minHeight: 0,
                    scrollbarGutter: "stable both-edges",
                  }}
                >
                  <div
                    style={{
                      width: baseWidth + 200,
                      height: baseHeight + 200,
                      position: "relative",
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={baseWidth}
                      height={baseHeight}
                      style={{
                        position: "absolute",
                        top: "100px",
                        left: "100px",
                        display: "block",
                      }}
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
                            handleArrowMouseDown(e);
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
                        } else if (
                          selectedArrow &&
                          chartData.workflow?.regimeArrows
                        ) {
                          const deletedArrowIndex =
                            chartData.workflow.regimeArrows.findIndex(
                              (arrow) =>
                                arrow.id === selectedArrow,
                            );

                          if (deletedArrowIndex !== -1) {
                            const deletedArrow =
                              chartData.workflow.regimeArrows[
                                deletedArrowIndex
                              ];
                            const deletedLength =
                              deletedArrow.endKm -
                              deletedArrow.startKm;

                            const updatedArrows =
                              chartData.workflow.regimeArrows
                                .filter(
                                  (arrow) =>
                                    arrow.id !== selectedArrow,
                                )
                                .map((arrow, index) => {
                                  if (
                                    index >= deletedArrowIndex
                                  ) {
                                    return {
                                      ...arrow,
                                      startKm:
                                        arrow.startKm -
                                        deletedLength,
                                      endKm:
                                        arrow.endKm -
                                        deletedLength,
                                    };
                                  }
                                  return arrow;
                                });

                            onUpdateChartData({
                              workflow: {
                                ...chartData.workflow,
                                regimeArrows: updatedArrows,
                              },
                            });
                            setSelectedArrow(null);
                          }
                        } else if (hoveredObject) {
                          const updatedObjects =
                            chartData.canvasObjects.filter(
                              (obj) =>
                                obj.id !== hoveredObject.id,
                            );
                          onUpdateChartData({
                            canvasObjects: updatedObjects,
                          });
                          setHoveredObject(null);
                        }
                      }}
                      className="cursor-crosshair"
                      style={{
                        cursor: draggedArrow
                          ? resizeLimitReached
                            ? "not-allowed"
                            : "ew-resize"
                          : draggedObject
                            ? "grabbing"
                            : isPanning
                              ? "grabbing"
                              : isMarqueeZoom
                                ? "crosshair"
                                : placingObject
                                  ? "cell"
                                  : hoveredArrow?.handle
                                    ? "ew-resize"
                                    : hoveredArrow
                                      ? "pointer"
                                      : hoveredObject
                                        ? "pointer"
                                        : "grab",
                      }}
                    />
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-56">
                <ContextMenuItem
                  onClick={handleContextMenuSelect}
                >
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
            <Dialog
              open={showDisplaySettings}
              onOpenChange={setShowDisplaySettings}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Настройки отображения
                  </DialogTitle>
                  <DialogDescription>
                    Выберите элементы для отображения на холсте
                  </DialogDescription>
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
                    <Label
                      htmlFor="trackProfile"
                      className="text-sm cursor-pointer"
                    >
                      Профиль пути
                    </Label>
                  </div>

                  {/* Optimal Speed Curve */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="optimalSpeedCurve"
                      checked={
                        displaySettings.optimalSpeedCurve
                      }
                      onCheckedChange={(checked) =>
                        setDisplaySettings({
                          ...displaySettings,
                          optimalSpeedCurve: !!checked,
                        })
                      }
                    />
                    <Label
                      htmlFor="optimalSpeedCurve"
                      className="text-sm cursor-pointer"
                    >
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
                    <Label
                      htmlFor="speedLimits"
                      className="text-sm cursor-pointer"
                    >
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
                    <Label
                      htmlFor="actualSpeedCurve"
                      className="text-sm cursor-pointer"
                    >
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
                    <Label
                      htmlFor="regimeBands"
                      className="text-sm cursor-pointer"
                    >
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
                    <Label
                      htmlFor="objectMarkers"
                      className="text-sm cursor-pointer"
                    >
                      Маркеры объектов
                    </Label>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Tooltip для объекта */}
            {hoveredObject && (
              <div
                className="fixed bg-black text-white text-xs px-2 py-1 rounded pointer-events-none z-50"
                style={{
                  left: screenMousePos.x + 10,
                  top: screenMousePos.y + 10,
                }}
              >
                {hoveredObject.label || hoveredObject.type}
                {" @ "}({Math.round(hoveredObject.x)},{" "}
                {Math.round(hoveredObject.y)})
              </div>
            )}

            {/* Tooltip для данных */}
            {hoveredDataPoint && !hoveredObject && (
              <div
                className="fixed bg-blue-600 text-white text-xs px-3 py-2 rounded shadow-lg pointer-events-none z-50"
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

      {/* Visio-like Object Palette - Right Sidebar (shares workspace) */}
      <VisioObjectPalette
        collapsed={paletteCollapsed}
        onToggleCollapse={() =>
          setPaletteCollapsed(!paletteCollapsed)
        }
      />
    </TooltipProvider>
  );
}