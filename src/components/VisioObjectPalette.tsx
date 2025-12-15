// Visio-like Object Palette for Regime Chart Editing
// Provides categorized draggable objects for creating locomotive regime charts

/**import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Zap,
  Power,
  Circle,
  MapPin,
  Train,
  Activity,
  Move,
  ArrowRight,
} from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

// Object definition type
export interface PaletteObject {
  id: string;
  name: string;
  nameRu: string;
  icon: React.ReactNode;
  category: string;
  description?: string;
}

// Category definition
interface ObjectCategory {
  id: string;
  name: string;
  nameRu: string;
  icon: React.ReactNode;
  objects: PaletteObject[];
}

// Define all object categories with their objects
const objectCategories: ObjectCategory[] = [
  {
    id: "speed",
    name: "Speed Elements",
    nameRu: "Скорость",
    icon: <Activity className="size-4" />,
    objects: [
      {
        id: "speed-curve",
        name: "Speed Curve Line",
        nameRu: "Кривая скорости",
        icon: <TrendingUp className="size-5 text-blue-600" />,
        category: "speed",
        description: "Continuous speed representation",
      },
      {
        id: "speed-limit",
        name: "Speed Limit Marker",
        nameRu: "Ограничение скорости",
        icon: <Circle className="size-5 text-red-600" />,
        category: "speed",
        description: "Maximum allowed speed",
      },
      {
        id: "target-speed",
        name: "Target Speed Point",
        nameRu: "Целевая скорость",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-green-600"
          >
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="10" cy="10" r="3" fill="currentColor" />
          </svg>
        ),
        category: "speed",
        description: "Desired speed at location",
      },
      {
        id: "actual-speed",
        name: "Actual Speed Point",
        nameRu: "Фактическая скорость",
        icon: <MapPin className="size-5 text-blue-500" />,
        category: "speed",
        description: "Measured speed",
      },
      {
        id: "speed-gradient",
        name: "Speed Gradient",
        nameRu: "Градиент скорости",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-purple-600"
          >
            <path
              d="M2 18 L10 2 L18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        category: "speed",
        description: "Rate of speed change",
      },
    ],
  },
  {
    id: "control-modes",
    name: "Control Modes",
    nameRu: "Режимы ведения поезда",
    icon: <Power className="size-4" />,
    objects: [
      {
        id: "traction-mode",
        name: "Traction Mode",
        nameRu: "Режим тяги",
        icon: <Zap className="size-5 text-yellow-600" />,
        category: "control-modes",
        description: "Power application",
      },
      {
        id: "coasting-mode",
        name: "Coasting Mode",
        nameRu: "Выбег",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-gray-600"
          >
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="2,2"
            />
          </svg>
        ),
        category: "control-modes",
        description: "No power/braking",
      },
      {
        id: "service-braking",
        name: "Service Braking",
        nameRu: "Служебное торможение",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-orange-600"
          >
            <rect
              x="2"
              y="2"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="6"
              y1="10"
              x2="14"
              y2="10"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        category: "control-modes",
        description: "Normal braking",
      },
      {
        id: "emergency-braking",
        name: "Emergency Braking",
        nameRu: "Экстренное торможение",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-red-600"
          >
            <polygon
              points="10,2 18,18 2,18"
              fill="currentColor"
            />
            <text
              x="10"
              y="15"
              fontSize="10"
              fill="white"
              textAnchor="middle"
            >
              !
            </text>
          </svg>
        ),
        category: "control-modes",
        description: "Maximum braking",
      },
      {
        id: "dynamic-braking",
        name: "Dynamic Braking",
        nameRu: "Динамическое торможение",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-blue-600"
          >
            <path
              d="M10 2 L10 18 M6 6 L10 2 L14 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        category: "control-modes",
        description: "Electrical braking",
      },
      {
        id: "regenerative-braking",
        name: "Regenerative Braking",
        nameRu: "Рекуперативное торможение",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-green-600"
          >
            <path
              d="M2 10 Q 10 2, 18 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M18 10 L14 8 L16 14" fill="currentColor" />
          </svg>
        ),
        category: "control-modes",
        description: "Energy recovery",
      },
    ],
  },
  {
    id: "profile",
    name: "Profile Elements",
    nameRu: "Элементы плана и профиляпути",
    icon: <TrendingUp className="size-4" />,
    objects: [
      {
        id: "ascending-grade",
        name: "Ascending Grade",
        nameRu: "Подъем",
        icon: <TrendingUp className="size-5 text-red-600" />,
        category: "profile",
        description: "Uphill section",
      },
      {
        id: "descending-grade",
        name: "Descending Grade",
        nameRu: "Спуск",
        icon: (
          <TrendingDown className="size-5 text-green-600" />
        ),
        category: "profile",
        description: "Downhill section",
      },
      {
        id: "horizontal-section",
        name: "Horizontal Section",
        nameRu: "Горизонтальный участок",
        icon: <ArrowRight className="size-5 text-gray-600" />,
        category: "profile",
        description: "Level track",
      },
      {
        id: "station-platform",
        name: "Station Platform",
        nameRu: "Станция",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-indigo-600"
          >
            <rect
              x="2"
              y="8"
              width="16"
              height="8"
              fill="black"
            />
            <rect
              x="6"
              y="4"
              width="8"
              height="4"
              fill="white"
            />
          </svg>
        ),
        category: "profile",
        description: "Station marker",
      },
      {
        id: "tunnel",
        name: "Tunnel Portal",
        nameRu: "Тоннель",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-gray-700"
          >
            <path
              d="M2 18 L2 10 Q 2 2, 10 2 Q 18 2, 18 10 L18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        category: "profile",
        description: "Tunnel section",
      },
      {
        id: "bridge",
        name: "Bridge Structure",
        nameRu: "Мост",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-brown-600"
          >
            <line
              x1="2"
              y1="10"
              x2="18"
              y2="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="5"
              y1="10"
              x2="5"
              y2="18"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="15"
              y1="10"
              x2="15"
              y2="18"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        category: "profile",
        description: "Bridge location",
      },
      {
        id: "level-crossing",
        name: "Level Crossing",
        nameRu: "Переезд",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-red-600"
          >
            <line
              x1="4"
              y1="4"
              x2="16"
              y2="16"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="16"
              y1="4"
              x2="4"
              y2="16"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        category: "profile",
        description: "Road crossing",
      },
    ],
  },
  {
    id: "notations",
    name: "Other Notations",
    nameRu: "Другие элементы",
    icon: <MapPin className="size-4" />,
    objects: [
      {
        id: "distance-marker",
        name: "Distance Marker",
        nameRu: "Километровый столб",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-gray-700"
          >
            <rect
              x="7"
              y="2"
              width="6"
              height="16"
              rx="1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <text
              x="10"
              y="12"
              fontSize="8"
              fill="currentColor"
              textAnchor="middle"
            >
              km
            </text>
          </svg>
        ),
        category: "notations",
        description: "Kilometer post",
      },
      {
        id: "time-marker",
        name: "Time Marker",
        nameRu: "Временная метка",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-blue-600"
          >
            <circle
              cx="10"
              cy="10"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="10"
              y1="10"
              x2="10"
              y2="5"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="10"
              y1="10"
              x2="13"
              y2="13"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        category: "notations",
        description: "Time marker",
      },
      {
        id: "locomotive-symbol",
        name: "Locomotive Symbol",
        nameRu: "Символ локомотива",
        icon: <Train className="size-5 text-blue-600" />,
        category: "notations",
        description: "Locomotive indicator",
      },
      {
        id: "wagon-symbol",
        name: "Wagon Symbol",
        nameRu: "Символ вагона",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-gray-600"
          >
            <rect
              x="3"
              y="6"
              width="14"
              height="8"
              rx="1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle
              cx="6"
              cy="16"
              r="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle
              cx="14"
              cy="16"
              r="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        category: "notations",
        description: "Wagon indicator",
      },
      {
        id: "signal-location",
        name: "Signal Post",
        nameRu: "Сигнал",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-red-600"
          >
            <line
              x1="10"
              y1="4"
              x2="10"
              y2="18"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="10" cy="6" r="3" fill="currentColor" />
          </svg>
        ),
        category: "notations",
        description: "Signal location",
      },
      {
        id: "switch-turnout",
        name: "Switch/Turnout",
        nameRu: "Стрелка",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-gray-700"
          >
            <line
              x1="2"
              y1="10"
              x2="18"
              y2="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="10"
              y1="10"
              x2="18"
              y2="4"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        category: "notations",
        description: "Track switch",
      },
      {
        id: "gradient-point",
        name: "Gradient Change Point",
        nameRu: "Точка перелома профиля",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-orange-600"
          >
            <path
              d="M2 18 L10 10 L18 2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="10" cy="10" r="3" fill="currentColor" />
          </svg>
        ),
        category: "notations",
        description: "Profile break point",
      },
    ],
  },

  {
    id: "regime-arrows",
    name: "Regime Arrows",
    nameRu: "Режимы",
    icon: <Move className="size-4" />,
    objects: [
      {
        id: "traction-arrow",
        name: "Traction Arrow",
        nameRu: "Тяга",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-green-600"
          >
            <path
              d="M2 10 L15 10 M11 6 L15 10 L11 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        category: "regime-arrows",
        description: "Traction regime indicator",
      },
      {
        id: "coasting-arrow",
        name: "Coasting Arrow",
        nameRu: "Выбег",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-gray-600"
          >
            <path
              d="M2 10 L15 10 M11 6 L15 10 L11 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="2,2"
            />
          </svg>
        ),
        category: "regime-arrows",
        description: "Coasting regime indicator",
      },
      {
        id: "braking-arrow",
        name: "Braking Arrow",
        nameRu: "Торможение",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-red-600"
          >
            <path
              d="M2 10 L15 10 M11 6 L15 10 L11 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="16"
              y="7"
              width="2"
              height="6"
              fill="currentColor"
            />
          </svg>
        ),
        category: "regime-arrows",
        description: "Braking regime indicator",
      },
    ],
  },
];

interface VisioObjectPaletteProps {
  onDragStart?: (object: PaletteObject) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function VisioObjectPalette({
  onDragStart,
  collapsed = true,
  onToggleCollapse,
}: VisioObjectPaletteProps) {
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  const [expandedCategories, setExpandedCategories] = useState<
    Set<string>
  >(
    new Set(["speed"]), // Start with speed category expanded
  );
  const [draggingObject, setDraggingObject] = useState<
    string | null
  >(null);

  const handleResizeStart = (e: React.MouseEvent) => {
    if (collapsed) return;
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStartX.current;
      const newWidth = Math.max(
        280,
        Math.min(500, resizeStartWidth.current - deltaX),
      );
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener(
          "mousemove",
          handleMouseMove,
        );
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing]);

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDragStart = (
    e: React.DragEvent,
    object: PaletteObject,
  ) => {
    // Set drag data
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify(object),
    );
    e.dataTransfer.effectAllowed = "copy";

    setDraggingObject(object.id);

    if (onDragStart) {
      onDragStart(object);
    }
  };

  const handleDragEnd = () => {
    setDraggingObject(null);
  };

  // Collapsed state - vertical dark strip on RIGHT side
  if (collapsed) {
    return (
      <div
        style={{ width: "100px" }}
        className="fixed top-0 right-0 h-full bg-gray-800 text-white flex flex-col items-center py-4 transition-all duration-300 flex-shrink-0 z-20"
      >
              <button
                onClick={handleToggle}
                style={{marginRight: '50px'}}
                className="p-2 hover:bg-gray-700 rounded transition-colors hover:text-white"
                aria-label="Expand object palette"
                title="Развернуть палитру объектов"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
      </div>
    );
  }

  return (
    <div
      className="fixed top-0 right-0 h-full flex items-stretch z-20 transition-all duration-300"
      style={{
        width: `${sidebarWidth}px`,
        marginRight: "80px",
        zIndex: 40,
      }}
    >
      {/* Resize handle *//*}
      <div
        className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
        onMouseDown={handleResizeStart}
        style={{
          cursor: isResizing ? "col-resize" : "col-resize",
        }}
      />

      {/* Sidebar content *//*}
      <div className="flex-1 bg-white border-l border-gray-300 flex flex-col shadow-lg">
        {/* Header with separate toggle button and title *//*}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <button
                  onClick={handleToggle}
                  className="p-2 mr-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
                  aria-label="Collapse object palette"
                  title="Свернуть палитру"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
          <h3 className="text-gray-700 flex-1">
            Палитра объектов
          </h3>
        </div>

        {/* Subheader *//*}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded">
              <Move className="size-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">
                Перетащите объекты на холст
              </p>
            </div>
          </div>
        </div>

        {/* Categories *//*}
        <ScrollArea
          className="flex-1 scrollbar "
          style={{ overflow: "auto scroll" }}
        >
          <div className="p-2 space-y-1">
            {objectCategories.map((category) => {
              const isExpanded = expandedCategories.has(
                category.id,
              );

              return (
                <div
                  key={category.id}
                  className="rounded-lg border border-gray-200"
                >
                  {/* Category Header *//*}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4 text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="size-4 text-gray-600 flex-shrink-0" />
                    )}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="text-gray-600 flex-shrink-0">
                        {category.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {category.nameRu}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded flex-shrink-0">
                      {category.objects.length}
                    </span>
                  </button>

                  {/* Category Objects *//*}
                  {isExpanded && (
                    <div className="bg-white">
                      <div className="grid grid-cols-2 gap-1 p-1.5">
                        {category.objects.map((object) => (
                          <div
                            key={object.id}
                            draggable
                            onDragStart={(e) =>
                              handleDragStart(e, object)
                            }
                            onDragEnd={handleDragEnd}
                            className="flex items-center gap-1 p-2 rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-move transition-all group"
                            title={object.description}
                          >
                            {/* Icon *//*}
                            <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-50 group-hover:bg-white transition-colors">
                              {object.icon}
                            </div>
                            {/* Label *//*}
                            <span className="text-xs text-center text-gray-700 group-hover:text-blue-700 leading-tight line-clamp-2">
                              {object.nameRu}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer with instructions *//*}
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            Перетащите объект на холст для размещения
          </p>
        </div>
      </div>
    </div>
  );
}*/

// Visio-like Object Palette for Regime Chart Editing
// Палитра объектов для редактирования режимных карт ведения поездов
// Provides categorized draggable objects for creating locomotive regime charts

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Zap,
  Power,
  Circle,
  MapPin,
  Activity,
  Move,
  ArrowRight,
  Gauge,
  Route,
  AlertTriangle,
} from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

// Object definition type
export interface PaletteObject {
  id: string;
  name: string;
  nameRu: string;
  icon: React.ReactNode;
  category: string;
  description?: string;
}

// Category definition
interface ObjectCategory {
  id: string;
  name: string;
  nameRu: string;
  icon: React.ReactNode;
  objects: PaletteObject[];
}

// Traction mode from locomotive data
interface TractionMode {
  id: string;
  label: string;
  lineStyle: "solid" | "dashed" | "dotted";
  color: string;
}

// Locomotive data structure
interface Locomotive {
  id: string;
  name: string;
  length: number;
  mass: number;
  tractionModes: TractionMode[];
}

// =============================================================================
// СТАТИЧЕСКИЕ КАТЕГОРИИ ОБЪЕКТОВ
// Static object categories for regime charts
// =============================================================================

const staticObjectCategories: ObjectCategory[] = [
  // -------------------------------------------------------------------------
  // КРИВАЯ ХОДА ПОЕЗДА И СКОРОСТЬ
  // Train movement curve and speed elements
  // -------------------------------------------------------------------------
  {
    id: "speed-curve",
    name: "Speed & Movement",
    nameRu: "Кривая хода и скорость",
    icon: <Activity className="size-4" />,
    objects: [
      {
        id: "train-movement-curve",
        name: "Train Movement Curve",
        nameRu: "Кривая хода поезда V(S)",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-blue-600">
            <path
              d="M2 16 Q 6 4, 10 10 Q 14 16, 18 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        category: "speed-curve",
        description: "Линия изменения скорости по пути следования",
      },
      {
        id: "speed-limit-permanent",
        name: "Permanent Speed Limit",
        nameRu: "Ограничение скорости (постоянное)",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-600">
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="14" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">
              V
            </text>
          </svg>
        ),
        category: "speed-curve",
        description: "Постоянное ограничение скорости на участке",
      },
      {
        id: "speed-limit-temporary",
        name: "Temporary Speed Limit",
        nameRu: "Ограничение скорости (временное)",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-yellow-600">
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" />
            <text x="10" y="14" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">
              V
            </text>
          </svg>
        ),
        category: "speed-curve",
        description: "Временное ограничение скорости (предупреждение)",
      },
      {
        id: "permitted-speed",
        name: "Permitted Speed Line",
        nameRu: "Допускаемая скорость",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-green-600">
            <line x1="2" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="2" />
            <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="1" strokeDasharray="4,2" />
          </svg>
        ),
        category: "speed-curve",
        description: "Линия максимально допускаемой скорости",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // РЕЖИМЫ УПРАВЛЕНИЯ ПОЕЗДОМ
  // Train control modes (braking, coasting)
  // -------------------------------------------------------------------------
  {
    id: "control-modes",
    name: "Control Modes",
    nameRu: "Режимы управления",
    icon: <Power className="size-4" />,
    objects: [
      {
        id: "coasting",
        name: "Coasting",
        nameRu: "Выбег",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-500">
            <path
              d="M2 10 L18 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <text x="10" y="7" fontSize="6" fill="currentColor" textAnchor="middle">
              ВЫБ
            </text>
          </svg>
        ),
        category: "control-modes",
        description: "Движение без тяги и торможения",
      },
      {
        id: "pneumatic-braking",
        name: "Pneumatic Braking",
        nameRu: "Пневматическое торможение",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-orange-600">
            <rect x="3" y="6" width="14" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="13" fontSize="7" fill="currentColor" textAnchor="middle" fontWeight="bold">
              ПТ
            </text>
          </svg>
        ),
        category: "control-modes",
        description: "Служебное пневматическое торможение",
      },
      {
        id: "regenerative-braking",
        name: "Regenerative Braking",
        nameRu: "Рекуперативное торможение",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-green-600">
            <path d="M2 14 Q 10 6, 18 14" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M15 11 L18 14 L15 17" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="5" cy="12" r="2" fill="currentColor" />
          </svg>
        ),
        category: "control-modes",
        description: "Торможение с возвратом энергии в сеть",
      },
      {
        id: "rheostatic-braking",
        name: "Rheostatic Braking",
        nameRu: "Реостатное торможение",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-500">
            <path d="M2 10 L4 7 L6 13 L8 7 L10 13 L12 7 L14 13 L16 7 L18 10" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        ),
        category: "control-modes",
        description: "Электрическое торможение на реостаты",
      },
      {
        id: "emergency-braking",
        name: "Emergency Braking",
        nameRu: "Экстренное торможение",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-600">
            <polygon points="10,2 18,18 2,18" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="15" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">
              !
            </text>
          </svg>
        ),
        category: "control-modes",
        description: "Экстренная остановка поезда",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // ПРОДОЛЬНЫЙ ПРОФИЛЬ ПУТИ
  // Track longitudinal profile elements
  // -------------------------------------------------------------------------
  {
    id: "track-profile",
    name: "Track Profile",
    nameRu: "Продольный профиль пути",
    icon: <TrendingUp className="size-4" />,
    objects: [
      {
        id: "ascending-grade",
        name: "Ascending Grade",
        nameRu: "Подъём",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-600">
            <path d="M2 16 L18 4" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="8" fontSize="6" fill="currentColor" textAnchor="middle">
              ‰+
            </text>
          </svg>
        ),
        category: "track-profile",
        description: "Участок подъёма (уклон вверх)",
      },
      {
        id: "descending-grade",
        name: "Descending Grade",
        nameRu: "Спуск",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-green-600">
            <path d="M2 4 L18 16" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="8" fontSize="6" fill="currentColor" textAnchor="middle">
              ‰−
            </text>
          </svg>
        ),
        category: "track-profile",
        description: "Участок спуска (уклон вниз)",
      },
      {
        id: "level-section",
        name: "Level Section",
        nameRu: "Площадка",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-600">
            <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="7" fontSize="6" fill="currentColor" textAnchor="middle">
              0‰
            </text>
          </svg>
        ),
        category: "track-profile",
        description: "Горизонтальный участок пути",
      },
      {
        id: "grade-break-point",
        name: "Grade Break Point",
        nameRu: "Точка перелома профиля",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-orange-600">
            <path d="M2 14 L10 6 L18 14" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="10" cy="6" r="2" fill="currentColor" />
          </svg>
        ),
        category: "track-profile",
        description: "Точка изменения уклона",
      },
      {
        id: "curve-section",
        name: "Curve Section",
        nameRu: "Кривая",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-purple-600">
            <path d="M2 16 Q 10 2, 18 16" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="12" fontSize="5" fill="currentColor" textAnchor="middle">
              R
            </text>
          </svg>
        ),
        category: "track-profile",
        description: "Участок кривой (с указанием радиуса)",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // РАЗДЕЛЬНЫЕ ПУНКТЫ И ПУТЕВЫЕ ОБЪЕКТЫ
  // Separation points and track objects
  // -------------------------------------------------------------------------
  {
    id: "track-objects",
    name: "Track Objects",
    nameRu: "Раздельные пункты и объекты",
    icon: <MapPin className="size-4" />,
    objects: [
      {
        id: "station",
        name: "Station",
        nameRu: "Станция",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-indigo-600">
            <rect x="3" y="8" width="14" height="6" fill="currentColor" />
            <rect x="6" y="4" width="8" height="4" fill="none" stroke="currentColor" strokeWidth="1" />
            <text x="10" y="13" fontSize="5" fill="white" textAnchor="middle">
              СТ
            </text>
          </svg>
        ),
        category: "track-objects",
        description: "Железнодорожная станция",
      },
      {
        id: "passing-loop",
        name: "Passing Loop",
        nameRu: "Разъезд",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-blue-600">
            <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" />
            <path d="M6 10 Q 10 6, 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <text x="10" y="17" fontSize="5" fill="currentColor" textAnchor="middle">
              РЗД
            </text>
          </svg>
        ),
        category: "track-objects",
        description: "Разъезд (раздельный пункт)",
      },
      {
        id: "block-post",
        name: "Block Post",
        nameRu: "Блок-пост",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-700">
            <rect x="8" y="4" width="4" height="12" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="10" cy="8" r="2" fill="currentColor" />
          </svg>
        ),
        category: "track-objects",
        description: "Блок-пост (граница блок-участка)",
      },
      {
        id: "kilometer-post",
        name: "Kilometer Post",
        nameRu: "Километровый столб",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-700">
            <rect x="7" y="4" width="6" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="12" fontSize="6" fill="currentColor" textAnchor="middle">
              км
            </text>
          </svg>
        ),
        category: "track-objects",
        description: "Километровая отметка",
      },
      {
        id: "picket-post",
        name: "Picket Post",
        nameRu: "Пикет",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-500">
            <line x1="10" y1="4" x2="10" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="6" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1" />
          </svg>
        ),
        category: "track-objects",
        description: "Пикетная отметка (100 м)",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // ИСКУССТВЕННЫЕ СООРУЖЕНИЯ
  // Engineering structures
  // -------------------------------------------------------------------------
  {
    id: "structures",
    name: "Structures",
    nameRu: "Искусственные сооружения",
    icon: <Route className="size-4" />,
    objects: [
      {
        id: "tunnel",
        name: "Tunnel",
        nameRu: "Тоннель",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-800">
            <path
              d="M2 18 L2 8 Q 2 2, 10 2 Q 18 2, 18 8 L18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line x1="2" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
          </svg>
        ),
        category: "structures",
        description: "Тоннель",
      },
      {
        id: "bridge",
        name: "Bridge",
        nameRu: "Мост",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-amber-700">
            <line x1="2" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="2" />
            <line x1="5" y1="8" x2="5" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="15" y1="8" x2="15" y2="16" stroke="currentColor" strokeWidth="2" />
            <path d="M2 8 Q 10 4, 18 8" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        ),
        category: "structures",
        description: "Мост",
      },
      {
        id: "viaduct",
        name: "Viaduct",
        nameRu: "Виадук",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-amber-600">
            <line x1="2" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="2" />
            <line x1="4" y1="6" x2="4" y2="18" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="1.5" />
            <line x1="16" y1="6" x2="16" y2="18" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
        category: "structures",
        description: "Виадук (эстакада)",
      },
      {
        id: "level-crossing",
        name: "Level Crossing",
        nameRu: "Переезд",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-600">
            <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="2" />
            <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        ),
        category: "structures",
        description: "Железнодорожный переезд",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // УСТРОЙСТВА ЭЛЕКТРОСНАБЖЕНИЯ
  // Electric power supply devices
  // -------------------------------------------------------------------------
  {
    id: "power-supply",
    name: "Power Supply",
    nameRu: "Устройства электроснабжения",
    icon: <Zap className="size-4" />,
    objects: [
      {
        id: "neutral-section",
        name: "Neutral Section",
        nameRu: "Нейтральная вставка",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-yellow-600">
            <line x1="2" y1="10" x2="7" y2="10" stroke="currentColor" strokeWidth="2" />
            <rect x="7" y="7" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="13" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="12" fontSize="5" fill="currentColor" textAnchor="middle">
              Н
            </text>
          </svg>
        ),
        category: "power-supply",
        description: "Нейтральная вставка (секционирование)",
      },
      {
        id: "power-section-boundary",
        name: "Power Section Boundary",
        nameRu: "Граница секции питания",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-orange-500">
            <line x1="10" y1="2" x2="10" y2="18" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" />
            <circle cx="10" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
        category: "power-supply",
        description: "Граница зоны питания тяговой подстанции",
      },
      {
        id: "traction-substation",
        name: "Traction Substation",
        nameRu: "Тяговая подстанция",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-blue-600">
            <rect x="4" y="6" width="12" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="10" y1="2" x2="10" y2="6" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="13" fontSize="5" fill="currentColor" textAnchor="middle">
              ТП
            </text>
          </svg>
        ),
        category: "power-supply",
        description: "Тяговая подстанция",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // СИГНАЛИЗАЦИЯ
  // Signaling devices
  // -------------------------------------------------------------------------
  {
    id: "signals",
    name: "Signals",
    nameRu: "Сигналы",
    icon: <AlertTriangle className="size-4" />,
    objects: [
      {
        id: "entry-signal",
        name: "Entry Signal",
        nameRu: "Входной светофор",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-600">
            <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
            <rect x="6" y="2" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="5" r="2" fill="currentColor" />
          </svg>
        ),
        category: "signals",
        description: "Входной светофор станции",
      },
      {
        id: "exit-signal",
        name: "Exit Signal",
        nameRu: "Выходной светофор",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-green-600">
            <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
            <rect x="6" y="2" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="5" r="2" fill="currentColor" />
          </svg>
        ),
        category: "signals",
        description: "Выходной светофор станции",
      },
      {
        id: "block-signal",
        name: "Block Signal",
        nameRu: "Проходной светофор",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-yellow-500">
            <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
            <circle cx="10" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="5" r="1.5" fill="currentColor" />
          </svg>
        ),
        category: "signals",
        description: "Проходной светофор автоблокировки",
      },
      {
        id: "speed-signal",
        name: "Speed Signal",
        nameRu: "Сигнальный знак скорости",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-blue-600">
            <rect x="4" y="4" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="13" fontSize="8" fill="currentColor" textAnchor="middle" fontWeight="bold">
              V
            </text>
          </svg>
        ),
        category: "signals",
        description: "Знак ограничения скорости",
      },
    ],
  },
];

// =============================================================================
// ФУНКЦИЯ ГЕНЕРАЦИИ ДИНАМИЧЕСКИХ РЕЖИМОВ ТЯГИ
// Function to generate dynamic traction modes from locomotive data
// =============================================================================

const generateTractionModeObjects = (locomotive: Locomotive | null): PaletteObject[] => {
  if (!locomotive || !locomotive.tractionModes) {
    return [
      {
        id: "no-locomotive",
        name: "No Locomotive Selected",
        nameRu: "Локомотив не выбран",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-400">
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4,3" />
            <text x="10" y="14" fontSize="8" fill="currentColor" textAnchor="middle">
              ?
            </text>
          </svg>
        ),
        category: "traction-modes",
        description: "Выберите локомотив для отображения режимов тяги",
      },
    ];
  }

  return locomotive.tractionModes.map((mode) => ({
    id: `traction-${mode.id}`,
    name: `Traction Mode ${mode.label}`,
    nameRu: `${mode.label}`,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20">
        <line
          x1="2"
          y1="10"
          x2="18"
          y2="10"
          stroke={mode.color}
          strokeWidth="3"
          strokeDasharray={mode.lineStyle === "dashed" ? "4,3" : mode.lineStyle === "dotted" ? "2,2" : "none"}
        />
        <text x="10" y="7" fontSize="5" fill={mode.color} textAnchor="middle" fontWeight="bold">
          {mode.label}
        </text>
      </svg>
    ),
    category: "traction-modes",
    description: `Режим тяги: ${mode.label} (${locomotive.name})`,
  }));
};

// =============================================================================
// КОМПОНЕНТ ПАЛИТРЫ ОБЪЕКТОВ
// Object Palette Component
// =============================================================================

interface VisioObjectPaletteProps {
  onDragStart?: (object: PaletteObject) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  selectedLocomotive?: Locomotive | null;
}

export default function VisioObjectPalette({
  onDragStart,
  collapsed = true,
  onToggleCollapse,
  selectedLocomotive = null,
}: VisioObjectPaletteProps) {
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["speed-curve", "traction-modes"]) // Start with speed and traction expanded
  );
  const [draggingObject, setDraggingObject] = useState<string | null>(null);

  // Generate dynamic traction modes category
  const tractionModesCategory: ObjectCategory = {
    id: "traction-modes",
    name: "Traction Modes",
    nameRu: selectedLocomotive ? `Режимы тяги (${selectedLocomotive.name})` : "Режимы тяги",
    icon: <Gauge className="size-4" />,
    objects: generateTractionModeObjects(selectedLocomotive),
  };

  // Combine static categories with dynamic traction modes
  // Place traction modes after control-modes for logical grouping
  const allCategories: ObjectCategory[] = [
    ...staticObjectCategories.slice(0, 2), // speed-curve, control-modes
    tractionModesCategory,
    ...staticObjectCategories.slice(2), // remaining categories
  ];

  const handleResizeStart = (e: React.MouseEvent) => {
    if (collapsed) return;
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStartX.current;
      const newWidth = Math.max(280, Math.min(500, resizeStartWidth.current - deltaX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing]);

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDragStart = (e: React.DragEvent, object: PaletteObject) => {
    // Set drag data
    e.dataTransfer.setData("application/json", JSON.stringify(object));
    e.dataTransfer.effectAllowed = "copy";

    setDraggingObject(object.id);

    if (onDragStart) {
      onDragStart(object);
    }
  };

  const handleDragEnd = () => {
    setDraggingObject(null);
  };

  // Collapsed state - vertical dark strip on RIGHT side
  if (collapsed) {
    return (
      <div
        style={{ width: "100px" }}
        className="fixed top-0 right-0 h-full bg-gray-800 text-white flex flex-col items-center py-4 transition-all duration-300 flex-shrink-0 z-20"
      >
        <button
          onClick={handleToggle}
          style={{ marginRight: "50px" }}
          className="p-2 hover:bg-gray-700 rounded transition-colors hover:text-white"
          aria-label="Expand object palette"
          title="Развернуть палитру объектов"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed top-0 right-0 h-full flex items-stretch z-20 transition-all duration-300"
      style={{
        width: `${sidebarWidth}px`,
        marginRight: "80px",
        zIndex: 40,
      }}
    >
      {/* Resize handle */}
      <div
        className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
        onMouseDown={handleResizeStart}
        style={{
          cursor: isResizing ? "col-resize" : "col-resize",
        }}
      />

      {/* Sidebar content */}
      <div className="flex-1 bg-white border-l border-gray-300 flex flex-col shadow-lg">
        {/* Header with separate toggle button and title */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleToggle}
            className="p-2 mr-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            aria-label="Collapse object palette"
            title="Свернуть палитру"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <h3 className="text-gray-700 flex-1">Палитра объектов</h3>
        </div>

        {/* Subheader with locomotive info */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded">
              <Move className="size-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Перетащите объекты на холст</p>
              {selectedLocomotive && (
                <p className="text-xs text-blue-600 font-medium mt-0.5">
                  Локомотив: {selectedLocomotive.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        <ScrollArea className="flex-1 scrollbar " style={{ overflow: "auto scroll" }}>
          <div className="p-2 space-y-1">
            {allCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const isTractionCategory = category.id === "traction-modes";

              return (
                <div
                  key={category.id}
                  className={`rounded-lg border ${
                    isTractionCategory ? "border-blue-300 bg-blue-50/30" : "border-gray-200"
                  }`}
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full flex items-center gap-2 p-2.5 transition-colors ${
                      isTractionCategory
                        ? "bg-blue-50 hover:bg-blue-100"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4 text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="size-4 text-gray-600 flex-shrink-0" />
                    )}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={isTractionCategory ? "text-blue-600" : "text-gray-600"}>
                        {category.icon}
                      </div>
                      <span
                        className={`text-sm font-medium truncate ${
                          isTractionCategory ? "text-blue-900" : "text-gray-900"
                        }`}
                      >
                        {category.nameRu}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                        isTractionCategory ? "text-blue-600 bg-blue-100" : "text-gray-500 bg-white"
                      }`}
                    >
                      {category.objects.length}
                    </span>
                  </button>

                  {/* Category Objects */}
                  {isExpanded && (
                    <div className="bg-white">
                      <div className="grid grid-cols-2 gap-1 p-1.5">
                        {category.objects.map((object) => (
                          <div
                            key={object.id}
                            draggable={object.id !== "no-locomotive"}
                            onDragStart={(e) => handleDragStart(e, object)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-1 p-2 rounded border transition-all group ${
                              object.id === "no-locomotive"
                                ? "border-gray-200 bg-gray-50 cursor-default opacity-60"
                                : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-move"
                            }`}
                            title={object.description}
                          >
                            {/* Icon */}
                            <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-50 group-hover:bg-white transition-colors">
                              {object.icon}
                            </div>
                            {/* Label */}
                            <span className="text-xs text-center text-gray-700 group-hover:text-blue-700 leading-tight line-clamp-2">
                              {object.nameRu}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer with instructions */}
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            Перетащите объект на холст для размещения
          </p>
        </div>
      </div>
    </div>
  );
}
