import React, { useState } from "react";
import WorkspaceSidebar from "./WorkspaceSidebar";
import MainCanvas from "./MainCanvas";
import ImportVisioModal from "./ImportVisioModal";
import LoadingOverlay from "./LoadingOverlay";
import ScheduleSidebar from "./ScheduleSidebar";
import type {
  ChartData,
} from "../types/chart-data";
import { chartDataByID1, LOCOMOTIVES } from "../types/consts";
import VisioObjectPalette from "./VisioObjectPalette";

interface WorkspaceProps {
  onLogout: () => void;
}

export default function Workspace({
  onLogout,
}: WorkspaceProps) {
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(330);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeChart, setActiveChart] =
    useState<ChartData | null>(null);
  const [isDataValid, setIsDataValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [charts] = useState<{ id: string; title: string }[]>([
    {
      id: "1",
      title: "Режимная карта №1, участок Кропачево-Дема",
    },
    {
      id: "2",
      title:
        "Режимная карта №2, участок Санкт-Петербург - Москва",
    },
    //{ id: "3", title: "Екатеринбург-Тюмень" },
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
  };

  const handleSelectChart = (chart: {
    id: string;
    title: string;
  }) => {
    // Load full chart data (in real app, this would fetch from backend)
    // This simulates existing completed charts with full workflow data

    // Different data for each existing chart
    //@ts-ignore
    const chartDataByID: { [key: string]: ChartData } = {
      ...chartDataByID1,
    };

    const fullChart =
      chartDataByID[chart.id] || chartDataByID["1"];
    setActiveChart(fullChart);
  };

  const handleUpdateChartData = (
    updates: Partial<ChartData>,
  ) => {
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

  return (
    <>
      <LoadingOverlay
        isVisible={isLoading}
        message={loadingMessage}
      />
      <div className="h-screen w-screen flex overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <WorkspaceSidebar
          collapsed={sidebarCollapsed}
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          onToggleCollapse={() =>
            setSidebarCollapsed(!sidebarCollapsed)
          }
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

        {/* Main Canvas */}
        <MainCanvas
          sidebarCollapsed={sidebarCollapsed}
          activeChart={activeChart}
          onUpdateChartTitle={(title) =>
            handleUpdateChartData({ title })
          }
          onUpdateChartData={handleUpdateChartData}
          isDataValid={isDataValid}
          onShowLoading={handleShowLoading}
        />
        {activeChart && (
        <VisioObjectPalette
          collapsed={paletteCollapsed}
          onToggleCollapse={() => setPaletteCollapsed(!paletteCollapsed)}
          selectedLocomotive={LOCOMOTIVES[0]}
      />)}

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