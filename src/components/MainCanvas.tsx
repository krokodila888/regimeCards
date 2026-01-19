import { Save, FileText } from 'lucide-react';
import React, { useState } from 'react';

import { layers } from '@/types/types';

import { useAuth } from '../contexts/AuthContext';
import type { ChartData } from '../types/chart-data';

import CanvasScreenshot from './CanvasScreenshot';
import ChartEditor from './ChartEditor';
import demaStartWithBoardsNoProfile from './images/dema_boards_no_top_no_profile_no_regimes.png';
import demaStartWithBoardsAndProfile from './images/dema_boards_no_top_no_regimes.png';
import demaNoBottomImg from './images/dema_no_bottom.png';
import demaNoProfileImg from './images/dema_no_profile.png';
import demaNoRegimesImg from './images/dema_no_regimes.png';
import demaNoTopImg from './images/dema_no_top.png';
import demaNoTopNoProfileImg from './images/dema_no_top_no_profile.png';
import demaSpeedOnlyImg from './images/dema_no_top_no_profile_no_regimes.png';
import demaImg from './images/dema_no_top_no_profile_no_regimes.png';
import emptyField from './images/dema_no_top_no_profile_no_regimes_no_boards_no_speed.png';
import demaNoTopNoRegimesImg from './images/dema_no_top_no_regimes.png';
import demaOptImg from './images/dema_opt.png';
import demaOptNoBottomImg from './images/dema_opt_no-bottom.png';
import demaOptNoProfileImg from './images/dema_opt_no-profile.png';
import demaOptNoRegimesImg from './images/dema_opt_no-regimes.png';
import demaOptNoTopImg from './images/dema_opt_no-top.png';
import demaOptNoTopNoProfileImg from './images/dema_opt_no-top_no-profile.png';
import demaOptSpeedOnlyImg from './images/dema_opt_no-top_no-profile_no-regimes.png';
import demaOptNoTopNoRegimesImg from './images/dema_opt_no-top_no-regimes.png';
import demaEmptyProfileImg from './images/dema_profile_no-others.png';
import demaRealImg from './images/dema_regimes.png';
import demaRealNoBottomImg from './images/dema_regimes_no-bottom.png';
import demaRealNoProfileImg from './images/dema_regimes_no-profile.png';
import demaRealNoRegimesImg from './images/dema_regimes_no-regimes.png';
import demaRealNoTopImg from './images/dema_regimes_no-top.png';
import demaRealNoTopNoProfileImg from './images/dema_regimes_no-top_no-profile.png';
import demaRealNoTopNoRegimesImg from './images/dema_regimes_no-top_no-regimes.png';
import demaRealSpeedOnlyImg from './images/dema_regimes_speed-only.png';
import { Button } from './ui/button';
import { Input } from './ui/input';

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
  stationName?: string; // Для названий станций
};

interface MainCanvasProps {
  sidebarCollapsed: boolean;
  activeChart: ChartData | null;
  onUpdateChartTitle: (title: string) => void;
  onUpdateChartData: (updates: Partial<ChartData>) => void;
  isDataValid: boolean;
  onShowLoading: (message: string) => void;
  placedObjects: PlacedObject[];
  onPlacedObjectsChange: (objects: PlacedObject[]) => void;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  visibleLayers: layers;
  setVisibleLayers: React.Dispatch<React.SetStateAction<layers>>;
  chosenAction: string;
  setСhosenAction: React.Dispatch<React.SetStateAction<string>>;
  availableLayers: layers;
  setAvailableLayers: React.Dispatch<React.SetStateAction<layers>>;
}

export default function MainCanvas({
  sidebarCollapsed,
  activeChart,
  onUpdateChartTitle,
  onUpdateChartData,
  isDataValid,
  onShowLoading,
  placedObjects,
  onPlacedObjectsChange,
  selectedObjectId,
  onSelectObject,
  visibleLayers,
  setVisibleLayers,
  setСhosenAction,
  chosenAction,
  availableLayers,
  setAvailableLayers,
}: MainCanvasProps) {
  const [chartTitle, setChartTitle] = useState(activeChart?.title || '');
  const { user } = useAuth();

  React.useEffect(() => {
    if (activeChart) {
      setChartTitle(activeChart.title);
    }
  }, [activeChart?.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChartTitle(e.target.value);
    onUpdateChartTitle(e.target.value);
  };

  const handleSave = () => {
    onShowLoading('Сохранение...');
    console.log('Идет сохранение:', placedObjects);
  };

  const handleUpdateChartData = (updates: Partial<ChartData>) => {
    console.debug('[MainCanvas] handleUpdateChartData called', {
      keys: Object.keys(updates),
      canvasObjects: (updates as any).canvasObjects ? (updates as any).canvasObjects.length : undefined,
      timestamp: Date.now(),
    });
    if (updates.workflow && 'regimeArrows' in updates.workflow) {
      const updatedWorkflow: any = {
        ...activeChart?.workflow,
        ...updates.workflow,
        actualSpeedCurve: undefined,
      };
      onUpdateChartData({
        ...updates,
        workflow: updatedWorkflow,
      });
    } else {
      onUpdateChartData(updates);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ marginRight: '4px' }}>
      {activeChart && chosenAction !== 'createNew' ? (
        <>
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <Input
              value={chartTitle}
              onChange={handleTitleChange}
              className="max-w-md border-none shadow-none pl-3 focus-visible:ring-0"
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={!isDataValid}>
                <Save className="w-4 h-4 mr-2" />
                Сохранить
              </Button>
              {!isDataValid && <p className="text-sm text-red-600 max-w-xs">Исправьте ошибки</p>}
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    // If admin: ChartEditor (canvas) else CanvasScreenshot
                    if (user?.role === 'admin') {
                      if ((window as any).__exportChartEditorToPdf) {
                        await (window as any).__exportChartEditorToPdf();
                      } else {
                        console.warn('Export function not available');
                      }
                    } else {
                      if ((window as any).__exportCanvasScreenshotToPdf) {
                        await (window as any).__exportCanvasScreenshotToPdf();
                      } else {
                        console.warn('Export function not available');
                      }
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Экспорт в PDF
              </Button>
            </div>
          </div>

          {/* Canvas или Editor */}
          {user?.role === 'admin' ? (
            <ChartEditor chartData={activeChart} onUpdateChartData={handleUpdateChartData} />
          ) : (
            user?.role === 'user' &&
            activeChart.workflow?.arrivalStation &&
            activeChart.workflow?.departureStation && (
              <CanvasScreenshot
                imageUrl={demaImg}
                imageNoTopUrl={demaNoTopImg}
                imageNoBottomUrl={demaNoBottomImg}
                imageSpeedOnlyUrl={demaSpeedOnlyImg}
                imageNoRegimesUrl={demaNoRegimesImg}
                imageNoProfileUrl={demaNoProfileImg}
                imageNoTopNoRegimesUrl={demaNoTopNoRegimesImg}
                imageNoTopNoProfileUrl={demaNoTopNoProfileImg}
                imageOptUrl={demaOptImg}
                imageOptNoTopUrl={demaOptNoTopImg}
                imageOptNoBottomUrl={demaOptNoBottomImg}
                imageOptSpeedOnlyUrl={demaOptSpeedOnlyImg}
                imageOptNoRegimesUrl={demaOptNoRegimesImg}
                imageOptNoProfileUrl={demaOptNoProfileImg}
                imageOptNoTopNoRegimesUrl={demaOptNoTopNoRegimesImg}
                imageOptNoTopNoProfileUrl={demaOptNoTopNoProfileImg}
                imageRealUrl={demaRealImg}
                imageRealNoTopUrl={demaRealNoTopImg}
                imageRealNoBottomUrl={demaRealNoBottomImg}
                imageRealSpeedOnlyUrl={demaRealSpeedOnlyImg}
                imageRealNoRegimesUrl={demaRealNoRegimesImg}
                imageRealNoProfileUrl={demaRealNoProfileImg}
                imageRealNoTopNoRegimesUrl={demaRealNoTopNoRegimesImg}
                imageRealNoTopNoProfileUrl={demaRealNoTopNoProfileImg}
                imageDemaEmptyProfile={demaEmptyProfileImg}
                placedObjects={placedObjects}
                onPlacedObjectsChange={onPlacedObjectsChange}
                selectedObjectId={selectedObjectId}
                onSelectObject={onSelectObject}
                visibleLayers={visibleLayers}
                setVisibleLayers={setVisibleLayers}
                chosenAction={chosenAction}
                emptyField={emptyField}
                demaStartWithBoardsNoProfile={demaStartWithBoardsNoProfile}
                demaStartWithBoardsAndProfile={demaStartWithBoardsAndProfile}
                activeChart={activeChart}
                availableLayers={availableLayers}
                setAvailableLayers={setAvailableLayers}
              />
            )
          )}
        </>
      ) : (
        /* Default/Welcome State */
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="bg-gray-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl text-gray-700 mb-2">Режимная карта не выбрана</h2>
            <p className="text-gray-500">
              Создайте новую режимную карту или выберите существующую, чтобы начать работу
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
