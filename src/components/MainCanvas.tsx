import React, { useState } from "react";
import { Save, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import ChartEditor from "./ChartEditor";
import demaImg from "/regimeCards/src/images/dema.png";
import type { ChartData } from "../types/chart-data";
import CanvasScreenshot from "./CanvasScreenshot";
import { useAuth } from "../contexts/AuthContext";

interface MainCanvasProps {
  sidebarCollapsed: boolean;
  activeChart: ChartData | null;
  onUpdateChartTitle: (title: string) => void;
  onUpdateChartData: (updates: Partial<ChartData>) => void;
  isDataValid: boolean;
  onShowLoading: (message: string) => void;
}

export default function MainCanvas({
  sidebarCollapsed,
  activeChart,
  onUpdateChartTitle,
  onUpdateChartData,
  isDataValid,
  onShowLoading,
}: MainCanvasProps) {
  const [chartTitle, setChartTitle] = useState(
    activeChart?.title || "",
  );

  const { user } = useAuth();

  React.useEffect(() => {
    if (activeChart) {
      setChartTitle(activeChart.title);
    }
  }, [activeChart]);

  const handleTitleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setChartTitle(e.target.value);
    onUpdateChartTitle(e.target.value);
  };

  const handleSave = () => {
    onShowLoading("Saving chart...");
  };

  const handleUpdateChartData = (
    updates: Partial<ChartData>,
  ) => {
    if (
      updates.workflow &&
      "regimeArrows" in updates.workflow
    ) {
      // Если обновляются стрелки, очищаем кривые скорости
      const updatedWorkflow: any = {
        ...activeChart?.workflow,
        ...updates.workflow,
        actualSpeedCurve: undefined, // Очищаем фактическую кривую
      };

      onUpdateChartData({
        ...updates,
        workflow: updatedWorkflow,
      });
    } else {
      // В остальных случаях просто передаем обновления
      onUpdateChartData(updates);
    }
  };

  return (
    <>
      <div
        className="flex-1 flex flex-col h-full overflow-hidden"
        style={{ marginRight: "76px" }}
      >
        {activeChart ? (
          <>
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <Input
                value={chartTitle}
                onChange={handleTitleChange}
                className="max-w-md border-none shadow-none pl-3 focus-visible:ring-0"
              />
              <div className="flex items-center gap-2 mr-8">
                      <span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSave}
                          disabled={!isDataValid}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Сохранить
                        </Button>
                      </span>
                    {!isDataValid && (
                        <p className="max-w-xs">
                          Исправьте ошибки
                        </p>
                    )}
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Экспорт в PDF
                </Button>
              </div>
            </div>

            {user?.role === "admin" ? (
              <ChartEditor
                chartData={activeChart}
                onUpdateChartData={handleUpdateChartData}
              />
            ) : (
              <CanvasScreenshot
                imageUrl={demaImg}
                visibleLayers={{
                      speedCurve: true,
                      limitCurve: true,
                      profileCurve: true,
                      gradientCurve: true,
                      regimeMarkers: true,
                      stationMarkers: true,
                }}
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
              <h2 className="text-gray-700 mb-2">
                Режимная карта не выбрана
              </h2>
              <p className="text-gray-500">
                Создайте новую режимную карту или выберите
                существующую, чтобы началь работу
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
