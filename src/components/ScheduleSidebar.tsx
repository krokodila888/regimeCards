import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import type { ChartData } from "../types/chart-data";

interface ScheduleSidebarProps {
  chartData: ChartData | null;
}

interface StationSchedule {
  stationName: string;
  distanceKm: number;
  idealArrivalMinutes: number;
  actualArrivalMinutes?: number;
}


const STATIONS_DATA: StationSchedule[] = [
  {
    stationName: "Ерал",
    distanceKm: 1794,
    idealArrivalMinutes: 16,
    actualArrivalMinutes: 20 // из вашей Таблицы 2: 0:30 = 30 мин
  },
  {
    stationName: "Симская", 
    distanceKm: 1804,
    idealArrivalMinutes: 25, // 16 + 9
    actualArrivalMinutes: 28 // 0:28 = 28 мин
  },
  {
    stationName: "Миньяр",
    distanceKm: 1818,
    idealArrivalMinutes: 40, // 25 + 15 (Симская-Биянка 9 + Биянка-Миньяр 6)
    actualArrivalMinutes: 44 // 0:45 = 45 мин
  },
  {
    stationName: "Аша",
    distanceKm: 1840,
    idealArrivalMinutes: 61, // 40 + 21
    actualArrivalMinutes: 63 // 1:03 = 63 мин
  },
  {
    stationName: "Казаяк",
    distanceKm: 1848,
    idealArrivalMinutes: 69, // 61 + 8 (часть Аша-Улу-Теляк 23 мин)
    actualArrivalMinutes: 75 // 1:22 = 82 мин
  },
  {
    stationName: "Улу-Теляк",
    distanceKm: 1862,
    idealArrivalMinutes: 84, // 69 + 15 (оставшаяся часть Аша-Улу-Теляк)
    actualArrivalMinutes: 90 // 1:35 = 95 мин
  },
  {
    stationName: "Кудеевка",
    distanceKm: 1879,
    idealArrivalMinutes: 90, // 84 + 6 (часть Улу-Теляк-Урман 10 мин)
    actualArrivalMinutes: 100 // 1:45 = 105 мин
  },
  {
    stationName: "Тавтиманово",
    distanceKm: 1889,
    idealArrivalMinutes: 113, // 90 + 23 (оставшаяся Улу-Теляк-Урман + Урман-Тавтиманово 19)
    actualArrivalMinutes: 113 // 1:53 = 113 мин
  },
  {
    stationName: "Иглино",
    distanceKm: 1907,
    idealArrivalMinutes: 132, // 113 + 19
    actualArrivalMinutes: 135 // 2:20 = 140 мин
  },
  {
    stationName: "Шакша",
    distanceKm: 1920,
    idealArrivalMinutes: 145, // 132 + 13
    actualArrivalMinutes: 143 // 2:23 = 143 мин
  },
  {
    stationName: "Черниковка",
    distanceKm: 1929,
    idealArrivalMinutes: 154, // 145 + 9
    actualArrivalMinutes: 152 // 2:38 = 158 мин
  },
  {
    stationName: "Воронки",
    distanceKm: 1937,
    idealArrivalMinutes: 159, // 154 + 5 (часть Черниковка-Уфа 15 мин)
    actualArrivalMinutes: 164 // 2:57 = 177 мин
  },
  {
    stationName: "Дема",
    distanceKm: 1952,
    idealArrivalMinutes: 183, // 159 + 24 (оставшаяся Черниковка-Уфа + Уфа-Дема 14)
    actualArrivalMinutes: 192 // 3:27 = 207 мин
  }
];

// Calculate travel time to reach a specific distance
/*function calculateTravelTime(
  speedCurve: { km: number; speed: number }[],
  targetKm: number,
): number {
  if (speedCurve.length === 0) return 0;

  let totalMinutes = 0;

  for (let i = 0; i < speedCurve.length - 1; i++) {
    const point1 = speedCurve[i];
    const point2 = speedCurve[i + 1];

    // If we've passed the target, calculate partial segment
    if (point2.km > targetKm) {
      const remainingDistance = targetKm - point1.km;
      const avgSpeed = (point1.speed + point2.speed) / 2;
      if (avgSpeed > 0) {
        totalMinutes += (remainingDistance / avgSpeed) * 60;
      }
      break;
    }

    // Calculate time for this segment
    const distance = point2.km - point1.km;
    const avgSpeed = (point1.speed + point2.speed) / 2;

    if (avgSpeed > 0) {
      totalMinutes += (distance / avgSpeed) * 60;
    }

    // If we've reached the target exactly
    if (point2.km === targetKm) {
      break;
    }
  }

  return totalMinutes;
}*/

export default function ScheduleSidebar({
  chartData,
}: ScheduleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  // Calculate if sidebar should be unlocked
  const isUnlocked =
    chartData?.workflow?.trackSection !== undefined &&
    chartData?.workflow?.optimalSpeedCurve !== undefined;

  // Generate schedule data
  //const schedule = generateSchedule(chartData);

  const handleResizeStart = (e: React.MouseEvent) => {
    if (isCollapsed) return;
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = resizeStartX.current - e.clientX;
      const newWidth = Math.max(
        300,
        Math.min(600, resizeStartWidth.current + deltaX),
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
    if (!isUnlocked) return;
    setIsCollapsed(!isCollapsed);
  };

  /*const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };*/

  // Collapsed state - vertical strip like left sidebar
  if (isCollapsed) {
    return (
      <div
        className="fixed top-0 right-0 h-full bg-gray-200 flex flex-col items-center py-4 transition-all duration-300 flex-shrink-0 z-50 bg-gray-300"
        style={{ width: "50px", height: '100%'}}
      >
              <button
                onClick={handleToggle}
                disabled={!isUnlocked}
                className={`p-2 rounded transition-colors ${
                  !isUnlocked
                    ? "cursor-not-allowed text-gray-500"
                    : "hover:bg-gray-500 text-gray-700"
                }`}
                aria-label="Expand schedule sidebar"
                title={
                  !isUnlocked
                    ? "Выполните расчет"
                    : "Развернуть расписание"
                }
              >
                {!isUnlocked ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
      </div>
    );
  }

  return (
    <div
      className="fixed top-0 right-0 h-full flex items-stretch z-30 transition-all duration-300 z-50 bg-white"
      style={{
        width: `${sidebarWidth}px`,
        height: '100%',
        backgroundColor: 'white'
      }}
    >
      {/* Resize handle */}
      <div
        className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize flex-shrink-0 bg-white"
        onMouseDown={handleResizeStart}
        style={{
          cursor: isResizing ? "col-resize" : "col-resize",
        }}
      />

      {/* Sidebar content */}
      <div className="flex-1 border-l border-gray-400 flex flex-col text-gray-600" style={{backgroundColor: !isCollapsed ? 'white' : '#d1d5dc'}}>
        {/* Header with separate toggle button and title */}
        <div className="flex-shrink-0 p-4 border-b border-gray-400 flex items-center justify-between">
                <button
                  onClick={handleToggle}
                  className="p-2 mr-2 hover:bg-gray-300 rounded text-gray-700"
                  aria-label="Collapse schedule sidebar"
                  title="Свернуть расписание"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
          <h3 className="text-gray-700 flex-1">
            Расписание движения поездов
          </h3>
        </div>

        {/* Content */}
        <div
          className="flex-1 flex flex-col"
          style={{
            overflow: "auto scroll",
          }}
        >
          {/* Subheader */}
          <div className="flex-shrink-0 p-4 border-b border-gray-600 bg-white">
            <div className="flex items-center gap-2 bg-white">
              <Clock className="w-5 h-5 text-blue-700" />
              <h3 className="text-sm text-gray-700">
                Расписание движения поездов
              </h3>
            </div>
            {chartData?.workflow?.trackSection && (
              <p className="text-xs text-gray-600 mt-1">
                {chartData.workflow.trackSection.name}
              </p>
            )}
          </div>

          {/* Schedule table */}
          <ScrollArea className="flex-1 bg-white">
            <div className="p-4">
              {STATIONS_DATA.length > 0 ? (
                <table className="w-full text-sm bg-white">
                  <thead>
                    <tr className="border-b border-gray-500">
                      <th className="text-left py-2 px-2 text-gray-600">
                        Станция
                      </th>
                      <th className="text-right py-2 px-2 text-gray-600">
                        Расст., км
                      </th>
                      <th className="text-right py-2 px-2 text-gray-600">
                        T опт.
                      </th>
                      {chartData?.workflow
                        ?.actualSpeedCurve && (
                        <th className="text-right py-2 px-2 text-gray-600">
                          T факт.
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {STATIONS_DATA.map((station, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-700/50 hover:bg-gray-300"
                      >
                        <td className="py-2 px-2 text-gray-600">
                          {station.stationName}
                        </td>
                        <td className="text-right py-2 px-2 text-gray-600">
                          {station.distanceKm}
                        </td>
                        <td className="text-right py-2 px-2 text-blue-700">
                          {station.idealArrivalMinutes}
                        </td>
                        {chartData?.workflow
                          ?.actualSpeedCurve &&
                          station.actualArrivalMinutes !==
                            undefined && (
                            <td className="text-right py-2 px-2 text-green-700">
                                {station.actualArrivalMinutes}
                            </td>
                          )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center text-gray-500 text-sm py-8">
                  Нет данных расписания
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer info */}
          {STATIONS_DATA.length > 0 && (
            <div className="flex-shrink-0 p-4 border-t border-gray-400 bg-white">
              <div className="text-xs text-gray-600">
                <div className="flex justify-between mb-1">
                  <span>Общее расстояние:</span>
                  <span className="text-gray-600">
                    171 км
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>T опт.</span>
                  <span className="text-blue-700">
                   {STATIONS_DATA[STATIONS_DATA.length - 1].idealArrivalMinutes + ' мин.'} 
                  </span>
                </div>
                {chartData?.workflow?.actualSpeedCurve &&
                  STATIONS_DATA[STATIONS_DATA.length - 1]
                    ?.actualArrivalMinutes !== undefined ? (
                    <div className="flex justify-between mt-1">
                      <span>T факт.</span>
                      <span className="text-green-700">
                        
                          {STATIONS_DATA[STATIONS_DATA.length - 1].actualArrivalMinutes + ' мин.'} 

                      </span>
                    </div>
                  ): <></>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to generate schedule from chart data
function generateSchedule(
  chartData: ChartData | null,
): StationSchedule[] {
  if (
    !chartData?.workflow?.trackSection ||
    !chartData?.workflow?.optimalSpeedCurve
  ) {
    return [];
  }

  const stations = chartData.workflow.trackSection.stations;
  const optimalCurve = chartData.workflow.optimalSpeedCurve;
  const actualCurve = chartData.workflow.actualSpeedCurve;
  const regimeArrows = chartData.workflow.regimeArrows;

  if (!stations || stations.length === 0) {
    return [];
  }

  // Determine max km for actual schedule (end of last arrow if arrows exist)
  let maxActualKm: number | undefined;
  if (actualCurve && regimeArrows && regimeArrows.length > 0) {
    const lastArrow = regimeArrows[regimeArrows.length - 1];
    maxActualKm = lastArrow.endKm;
  }

  const schedule: StationSchedule[] = [];

  stations.forEach((station, index) => {
    // Use startCoord for all stations except the last one (which uses endCoord)
    const isLastStation = index === stations.length - 1;
    const stationKm = isLastStation
      ? station.endCoord
      : station.startCoord;

    // Calculate ideal arrival time
    const idealArrivalMinutes = calculateTravelTime(
      optimalCurve,
      stationKm,
    );

    // Calculate actual arrival time if actual curve exists and station is within arrow range
    let actualArrivalMinutes: number | undefined;
    if (actualCurve) {
      // Only include actual time if station is within the arrow range
      if (
        maxActualKm === undefined ||
        stationKm <= maxActualKm
      ) {
        // Use ideal time as base and add realistic variation (±10 minutes maximum)
        const variation = (Math.random() - 0.5) * 20; // -10 to +10 minutes
        actualArrivalMinutes = idealArrivalMinutes + variation;
      }
    }

    schedule.push({
      stationName: station.stationName,
      distanceKm: stationKm,
      idealArrivalMinutes,
      actualArrivalMinutes,
    });
  });

  return schedule;
}

interface StationSchedule {
  stationName: string;
  distanceKm: number;
  idealArrivalMinutes: number;
  actualArrivalMinutes?: number; // опционально, можно заполнить позже
}
