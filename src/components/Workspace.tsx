import React, { useState } from 'react';

import { layers } from '@/types/types';

import { chartDataByID1 } from '../data/consts';
import { useAuth } from '../contexts/AuthContext';
import { useAppDispatch } from '../store/hooks';
import { setCurrentChartData } from '../store/workflowSlice';
import type { ChartData } from '../types/chart-data';

import ImportVisioModal from './ImportVisioModal';
import LoadingOverlay from './LoadingOverlay';
import MainCanvas from './MainCanvas';
import ScheduleSidebar from './ScheduleSidebar';
import VisioObjectPalette from './VisioObjectPalette';
import WorkspaceSidebar from './WorkspaceSidebar';

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
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(330);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeChart, setActiveChart] = useState<ChartData | null>(null);
  const [isDataValid, setIsDataValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);

  // Выбраная опция
  const [chosenAction, setСhosenAction] = useState<string>('start');

  const dispatch = useAppDispatch();

  // Состояние для размещенных объектов
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);

  // Состояние для выбранного объекта
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  const [charts] = useState<{ id: string; title: string }[]>([
    {
      id: '1',
      title: 'Режимная карта №1, участок Кропачево-Дема',
    },
    {
      id: '2',
      title: 'Режимная карта №2, участок Санкт-Петербург - Москва',
    },
  ]);

  const [visibleLayers, setVisibleLayers] = useState<layers>({
    gradientCurve: false,
    regimeMarkers: false,
    profileCurve: false,
    optSpeedCurve: false,
    regimes2: false,
    borders: false,
  });

  const [availableLayers, setAvailableLayers] = useState<layers>({
    gradientCurve: false,
    regimeMarkers: false,
    profileCurve: false,
    optSpeedCurve: false,
    regimes2: false,
    borders: false,
  });

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
    dispatch(setCurrentChartData(newChart));
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

    const fullChart = /*chartDataByID[chart.id] ||*/ chartDataByID['1'];
    setActiveChart(fullChart);
    dispatch(setCurrentChartData(fullChart));

    // Очищаем размещенные объекты при переключении карты
    // В будущем здесь будет загрузка сохраненных объектов из fullChart
    setPlacedObjects([]);
    setSelectedObjectId(null);
  };

  const handleUpdateChartData = (updates: Partial<ChartData>) => {
    if (activeChart) {
      console.debug('[Workspace] handleUpdateChartData called', {
        keys: Object.keys(updates),
        canvasObjects: (updates as any).canvasObjects ? (updates as any).canvasObjects.length : undefined,
        timestamp: Date.now(),
      });
      const updated = { ...activeChart, ...updates };
      setActiveChart(updated);
      dispatch(setCurrentChartData(updated));
    }
  };

  const handleShowLoading = (message: string) => {
    setLoadingMessage(message);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1800);
  };

  // Обработчики для размещенных объектов
  const handlePlacedObjectsChange = (objects: PlacedObject[]) => {
    setPlacedObjects(objects);
  };

  const handleSelectObject = (id: string | null) => {
    setSelectedObjectId(id);
  };

  const handleUpdateObject = (id: string, updates: Partial<PlacedObject>) => {
    setPlacedObjects((prev) =>
      prev.map((obj) => {
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
    setPlacedObjects((prev) => prev.filter((obj) => obj.id !== id));
    if (selectedObjectId === id) {
      // Выбираем последний добавленный объект или null
      const remaining = placedObjects.filter((obj) => obj.id !== id);
      setSelectedObjectId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  // Admin-specific handlers for ChartEditor canvas objects
  const handleDeleteCanvasObject = (id: string) => {
    if (!activeChart) return;
    console.debug('[Workspace] Admin delete canvas object', {
      id,
      beforeCount: activeChart.canvasObjects?.length,
    });
    const updatedObjects = (activeChart.canvasObjects || []).filter((obj) => obj.id !== id);
    handleUpdateChartData({ canvasObjects: updatedObjects });
    if (selectedObjectId === id) {
      const remaining = updatedObjects;
      setSelectedObjectId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  const handleSelectCanvasObject = (id: string | null) => {
    console.debug('[Workspace] Admin select canvas object', { id });
    setSelectedObjectId(id);
  };

  const handleUpdateCanvasObject = (id: string, updates: Partial<any>) => {
    if (!activeChart) return;
    console.debug('[Workspace] Admin update canvas object', { id, updates });
    const updatedObjects = (activeChart.canvasObjects || []).map((obj) =>
      obj.id === id ? { ...obj, ...updates } : obj
    );
    handleUpdateChartData({ canvasObjects: updatedObjects });
  };

  // Convert activeChart.canvasObjects to PlacedObject format for VisioObjectPalette
  const getCanvasObjectsAsPlacedObjects = () => {
    if (!activeChart?.canvasObjects) return [];
    return activeChart.canvasObjects.map((obj) => ({
      id: obj.id,
      objectType: {
        id: obj.subtype || obj.type,
        name: obj.label || obj.type,
        nameRu: obj.label || obj.type,
        category: 'other' as const,
        icon: <div />,
      },
      position: { x: obj.x, y: obj.y },
      coordinate: obj.x,
      stationName: obj.label || '',
    }));
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
          visibleLayers={visibleLayers}
          setVisibleLayers={setVisibleLayers}
          chosenAction={chosenAction}
          setСhosenAction={setСhosenAction}
          availableLayers={availableLayers}
          setAvailableLayers={setAvailableLayers}
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
          visibleLayers={visibleLayers}
          setVisibleLayers={setVisibleLayers}
          chosenAction={chosenAction}
          setСhosenAction={setСhosenAction}
          availableLayers={availableLayers}
          setAvailableLayers={setAvailableLayers}
        />

        {/* Visio Object Palette (справа) */}
        {activeChart && (
          <VisioObjectPalette
            selectedObjectId={selectedObjectId}
            placedObjects={user?.role === 'admin' ? getCanvasObjectsAsPlacedObjects() : placedObjects}
            onDeleteObject={user?.role === 'admin' ? handleDeleteCanvasObject : handleDeleteObject}
            onSelectObject={user?.role === 'admin' ? handleSelectCanvasObject : handleSelectObject}
            onUpdateObject={user?.role === 'admin' ? handleUpdateCanvasObject : handleUpdateObject}
            collapsed={paletteCollapsed}
            onToggleCollapse={() => setPaletteCollapsed(!paletteCollapsed)}
          />
        )}

        {/* Import Visio Modal */}
        <ImportVisioModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />

        {/* Schedule Sidebar */}
        <ScheduleSidebar chartData={activeChart} />
      </div>
    </>
  );
}
