import React, { useState } from "react";
import { Save, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import ChartEditor from "./ChartEditor";
import CanvasScreenshot from "./CanvasScreenshot";
import { useAuth } from "../contexts/AuthContext";
// @ts-ignore
import demaImg from "./images/dema.png";
import demaNoBottomImg from "./images/dema_no_bottom.png";
import demaNoProfileImg from "./images/dema_no_profile.png";
import demaNoTopImg from "./images/dema_no_top.png";
import demaNoRegimesImg from "./images/dema_no_regimes.png";
import demaSpeedOnlyImg from "./images/dema_no_top_no_profile_no_regimes.png";
import demaNoTopNoProfileImg from "./images/dema_no_top_no_profile.png";
import demaNoTopNoRegimesImg from "./images/dema_no_top_no_regimes.png";
import type { ChartData } from "../types/chart-data";

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
}: MainCanvasProps) {
  const [chartTitle, setChartTitle] = useState(activeChart?.title || "");
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
    onShowLoading("Сохранение...");
    console.log('Идет сохранение:', placedObjects);
  };

  const handleUpdateChartData = (updates: Partial<ChartData>) => {
    if (updates.workflow && "regimeArrows" in updates.workflow) {
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
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ marginRight: "4px" }}>
      {activeChart ? (
        <>
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <Input
              value={chartTitle}
              onChange={handleTitleChange}
              className="max-w-md border-none shadow-none pl-3 focus-visible:ring-0"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!isDataValid}
              >
                <Save className="w-4 h-4 mr-2" />
                Сохранить
              </Button>
              {!isDataValid && (
                <p className="text-sm text-red-600 max-w-xs">
                  Исправьте ошибки
                </p>
              )}
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Экспорт в PDF
              </Button>
            </div>
          </div>

          {/* Canvas или Editor */}
          {user?.role === "admin" ? (
            <ChartEditor
              chartData={activeChart}
              onUpdateChartData={handleUpdateChartData}
            />
          ) : (
            <CanvasScreenshot
              imageUrl={demaImg}
              imageNoTopUrl={demaNoTopImg}
              imageNoBottomUrl={demaNoBottomImg}
              imageSpeedOnlyUrl={demaSpeedOnlyImg}
              imageNoRegimesUrl={demaNoRegimesImg}
              imageNoProfileUrl={demaNoProfileImg}
              imageNoTopNoRegimesUrl={demaNoTopNoRegimesImg}
              imageNoTopNoProfileUrl={demaNoTopNoProfileImg}
              placedObjects={placedObjects}
              onPlacedObjectsChange={onPlacedObjectsChange}
              selectedObjectId={selectedObjectId}
              onSelectObject={onSelectObject}
            />
          )}
        </>
      ) : (
        /* Default/Welcome State */
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="bg-gray-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl text-gray-700 mb-2">
              Режимная карта не выбрана
            </h2>
            <p className="text-gray-500">
              Создайте новую режимную карту или выберите существующую, чтобы начать работу
            </p>
          </div>
        </div>
      )}
    </div>
  );
}