import React, { useState } from "react";
import WorkspaceSidebar from "./WorkspaceSidebar";
import MainCanvas from "./MainCanvas";
import ImportVisioModal from "./ImportVisioModal";
import LoadingOverlay from "./LoadingOverlay";
import ScheduleSidebar from "./ScheduleSidebar";
import VisioObjectPalette from "./VisioObjectPalette";
import type { ChartData } from "../types/chart-data";
import { chartDataByID1, LOCOMOTIVES } from "../types/consts";

// Типы для размещенных объектов
type PaletteObject = {
  id: string;
  name: string;
  nameRu: string;
  icon: React.ReactNode;
  category: string;
  description?: string;
};

type PlacedObject = {
  id: string;
  objectType: PaletteObject;
  coordinate: number;
  position: { x: number; y: number };
  stationName?: string; // Добавлено для названий станций
};

interface WorkspaceProps {
  onLogout: () => void;
}

export default function Workspace({ onLogout }: WorkspaceProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(330);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeChart, setActiveChart] = useState<ChartData | null>(null);
  const [isDataValid, setIsDataValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  
  // Состояние для размещенных объектов
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  
  // Состояние для выбранного объекта
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  
  const [charts] = useState<{ id: string; title: string }[]>([
    {
      id: "1",
      title: "Режимная карта №1, участок Кропачево-Дема",
    },
    {
      id: "2",
      title: "Режимная карта №2, участок Санкт-Петербург - Москва",
    },
  ]);

  const handleCreateNewChart = () => {
    const newChart: ChartData = {
      id: Date.now().toString(),
      title: `Новая режимная карта ${charts.length + 1}`,
      trackSegments: [],
      speedLimits: [],
      pathProfiles: [],
      canvasObjects: [],
      workflow: {
        currentStage: 1,
      },
    };
    setActiveChart(newChart);
    // Очищаем размещенные объекты при создании новой карты
    setPlacedObjects([]);
    setSelectedObjectId(null);
  };

  const handleSelectChart = (chart: { id: string; title: string }) => {
    // Load full chart data (in real app, this would fetch from backend)
    //@ts-ignore
    const chartDataByID: { [key: string]: ChartData } = {
      ...chartDataByID1,
    };

    const fullChart = chartDataByID[chart.id] || chartDataByID["1"];
    setActiveChart(fullChart);
    
    // Очищаем размещенные объекты при переключении карты
    // В будущем здесь будет загрузка сохраненных объектов из fullChart
    setPlacedObjects([]);
    setSelectedObjectId(null);
  };

  const handleUpdateChartData = (updates: Partial<ChartData>) => {
    if (activeChart) {
      setActiveChart({ ...activeChart, ...updates });
    }
  };

  const handleShowLoading = (message: string) => {
    setLoadingMessage(message);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2500);
  };

   // Обработчики для размещенных объектов
  const handlePlacedObjectsChange = (objects: PlacedObject[]) => {
    setPlacedObjects(objects);
  };

  const handleSelectObject = (id: string | null) => {
    setSelectedObjectId(id);
  };

  const handleUpdateObject = (id: string, updates: Partial<PlacedObject>) => {
    setPlacedObjects(prev => 
      prev.map(obj => {
        if (obj.id === id) {
          const updatedObj = { ...obj, ...updates };
          
          // Если изменилась координата, нужно пересчитать позицию X
          // Это будет сделано в CanvasScreenshot через useEffect
          
          return updatedObj;
        }
        return obj;
      })
    );
  };

  const handleDeleteObject = (id: string) => {
    setPlacedObjects(prev => prev.filter(obj => obj.id !== id));
    if (selectedObjectId === id) {
      // Выбираем последний добавленный объект или null
      const remaining = placedObjects.filter(obj => obj.id !== id);
      setSelectedObjectId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  return (
    <>
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
      <div className="h-screen w-screen flex overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <WorkspaceSidebar
          collapsed={sidebarCollapsed}
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          charts={charts}
          activeChart={activeChart}
          onSelectChart={handleSelectChart}
          onCreateNew={handleCreateNewChart}
          onImportVisio={() => setShowImportModal(true)}
          onUpdateChartData={handleUpdateChartData}
          onValidationChange={setIsDataValid}
          onLogout={onLogout}
          onShowLoading={handleShowLoading}
        />

        {/* Main Canvas with placed objects props */}
        <MainCanvas
          sidebarCollapsed={sidebarCollapsed}
          activeChart={activeChart}
          onUpdateChartTitle={(title) => handleUpdateChartData({ title })}
          onUpdateChartData={handleUpdateChartData}
          isDataValid={isDataValid}
          onShowLoading={handleShowLoading}
          // Новые пропсы для размещенных объектов
          placedObjects={placedObjects}
          onPlacedObjectsChange={handlePlacedObjectsChange}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleSelectObject}
        />

        {/* Visio Object Palette (справа) */}
        {activeChart && (
          <VisioObjectPalette
            selectedObjectId={selectedObjectId}
            placedObjects={placedObjects}
            onDeleteObject={handleDeleteObject}
            onSelectObject={handleSelectObject}
            onUpdateObject={handleUpdateObject}
            collapsed={paletteCollapsed}
            onToggleCollapse={() => setPaletteCollapsed(!paletteCollapsed)}
          />
        )}

        {/* Import Visio Modal */}
        <ImportVisioModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
        />

        {/* Schedule Sidebar */}
        <ScheduleSidebar chartData={activeChart} />
      </div>
    </>
  );
}