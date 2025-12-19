import React, { useRef, useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Plus,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  Collapsible,
  CollapsibleTrigger,
} from "./ui/collapsible";
import Stage1CalculationParams from "./Stage1CalculationParams";
import type {
  ChartData,
} from "../types/chart-data";

interface WorkspaceSidebarProps {
  collapsed: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  onToggleCollapse: () => void;
  charts: { id: string; title: string }[];
  activeChart: ChartData | null;
  onSelectChart: (chart: { id: string; title: string }) => void;
  onCreateNew: () => void;
  onImportVisio: () => void;
  onUpdateChartData: (updates: Partial<ChartData>) => void;
  onValidationChange: (isValid: boolean) => void;
  onLogout: () => void;
  onShowLoading: (message: string) => void;
}

export default function WorkspaceSidebar({
  collapsed,
  width,
  onWidthChange,
  onToggleCollapse,
  charts,
  activeChart,
  onSelectChart,
  onCreateNew,
  onImportVisio,
  onUpdateChartData,
  onValidationChange,
  onLogout,
  onShowLoading,
}: WorkspaceSidebarProps) {
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [segmentErrors, setSegmentErrors] = useState<
    Set<string>
  >(new Set());
  const [chartsExpanded, setChartsExpanded] = useState(true);

  // Выбраная опция
  const [chosenAction, setСhosenAction] =
    useState<string>("start");

  // Замените состояние accordionValue
  const [accordionValue, setAccordionValue] = useState<
    string[]
  >(["stage1"]);

  // Обновите useEffect для автоматического раскрытия этапов
  useEffect(() => {
    if (!activeChart?.workflow) {
      setAccordionValue(["stage1"]);
      return;
    }

    const newValue: string[] = [];

    // Всегда показываем stage1 если есть workflow
    newValue.push("stage1");

    // Когда optimal curve рассчитан, добавляем stage2 (was stage3)
    if (activeChart.workflow.optimalSpeedCurve) {
      newValue.push("stage2");
    }

    setAccordionValue(newValue);
  }, [
    activeChart?.id, // Add id to re-run when chart changes
    activeChart?.workflow?.trackSection,
    activeChart?.workflow?.locomotive,
    activeChart?.workflow?.optimalSpeedCurve,
    activeChart?.workflow?.actualSpeedCurve,
  ]);

  // Validate track segments continuity
  useEffect(() => {
    if (!activeChart) {
      onValidationChange(true);
      return;
    }

    const segments = [...activeChart.trackSegments].sort(
      (a, b) => a.startCoord - b.startCoord,
    );
    const errors = new Set<string>();

    for (let i = 0; i < segments.length - 1; i++) {
      if (segments[i].endCoord !== segments[i + 1].startCoord) {
        errors.add(segments[i].id);
        errors.add(segments[i + 1].id);
      }
    }

    setSegmentErrors(errors);
    onValidationChange(errors.size === 0);
  }, [
    activeChart?.trackSegments,
    onValidationChange,
    activeChart,
  ]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 340 && newWidth <= 600) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener(
        "mousemove",
        handleMouseMove,
      );
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, onWidthChange]);

  if (collapsed) {
    return (
      <div className="w-12 h-full bg-gray-800 text-white flex flex-col items-center py-4 transition-all duration-300 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-700 rounded transition-colors hover:text-white"
          aria-label="Expand sidebar"
          title="Развернуть боковую панель"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={sidebarRef}
      className="flex flex-col transition-all duration-300 relative h-full flex-shrink-0"
      style={{
        width: `${width}px`,
        zIndex: "3",
        paddingRight: "12px",
        //overflow: "hidden",
      }}
    >
      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 hover:bg-blue-500 cursor-col-resize transition-all z-10 bg-gray-300"
        onMouseDown={() => setIsResizing(true)}
      />

      {/* Header - Fixed at top */}
      <div className="p-4 pr-0 flex items-center justify-between border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5" />
          <span style={{ fontSize: "15px" }}>
            Пользователь ТестТест
          </span>
        </div>
          <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLogout}
                  className="p-2 hover:bg-gray-700 rounded transition-colors h-auto w-auto hover:text-white"
                  aria-label="Logout"
                  title="Выйти из профиля"
                >
                  <LogOut className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  className="p-2 hover:bg-gray-700 rounded transition-colors h-auto w-auto hover:text-white"
                  aria-label="Collapse sidebar"
                  title="Свернуть боковую панель"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

          </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar">
        <div className="p-4 space-y-4 pb-6">
          {/* Action Buttons */}
          <div
            style={{ alignItems: "baseline" }}
            className={`space-y-2 ${chosenAction === "start" ? "" : "flex items-center gap-2"}`}
          >
            <Button
              onClick={() => {
                setChartsExpanded(false);
                setСhosenAction("createNew");
                onCreateNew();
              }}
              className={`${chosenAction === "start" ? "w-full" : chosenAction === "createNew" || chosenAction === "" ? "flex-1" : "w-auto"} bg-blue-600 hover:bg-blue-700 justify-start`}
              title="Создать новую режимную карту"
            >
              <Plus
                className={`w-4 h-4 ${chosenAction === "createNew" || chosenAction === "" || chosenAction === "choseOne" ? "m-0" : "mr-2"}`}
              />
              {chosenAction !== "createNew" &&
              chosenAction !== "" &&
              chosenAction !== "start"
                ? ""
                : "Создать новую карту"}
            </Button>
            {chosenAction === "createNew" /*
              <>
                <Button
                  onClick={onImportVisio}
                  variant="outline"
                  className="justify-start bg-white text-gray-500 hover:bg-gray-600 border-gray-400 hover:text-white"
                  title="Импортировать диаграмму из Microsoft Visio"
                >
                  <Upload
                    className={`w-4 h-4  ${chosenAction === "createNew" || chosenAction === "choseOne" ? "m-0" : "mr-2"} hover:text-white`}
                  />
                </Button>*/ ? (
              <Button
                onClick={() => {
                  setСhosenAction("");
                  setChartsExpanded(true);
                }}
                variant="outline"
                className="justify-start bg-white text-gray-500 hover:bg-gray-600 border-gray-400 hover:text-white"
                title="Мои режимные карты"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            ) : (
              /* </>*/
              /*(
              <Button
                onClick={onImportVisio}
                variant="outline"
                className={`${chosenAction === "start" ? "w-full" : "w-auto"} justify-start bg-white text-gray-500 hover:bg-gray-600 border-gray-400 hover:text-white`}
                title="Импортировать диаграмму из Microsoft Visio"
              >
                <Upload
                  className={`w-4 h-4 ${chosenAction !== "start" ? "m-0" : "mr-2"} hover:text-white`}
                />
                {chosenAction === "start"
                  ? "Импортировать файл Visio"
                  : ""}
              </Button>
            )*/ <></>
            )}
            {chosenAction === "choseOne" ? (
              <Button
                style={{
                  alignItems: "baseline",
                  marginBottom: "8px",
                  paddingRight: "12px",
                  paddingLeft: "12px",
                  alignSelf: "center",
                }}
                onClick={() => {
                  setСhosenAction("");
                  setChartsExpanded(true);
                }}
                variant="outline"
                className="justify-start bg-white text-gray-500 flex-1 justify-center hover:bg-gray-600 border-gray-400 hover:text-white"
                title="Мои режимные карты"
              >
                Мои режимные карты
              </Button>
            ) : (
              <></>
            )}
          </div>

          {chosenAction === "createNew" ? (
            <></>
          ) : (
            <Separator className="bg-gray-700" />
          )}

          {/* Existing Charts - Collapsible */}
          {chosenAction !== "createNew" && (
            <Collapsible
              open={chartsExpanded}
              onOpenChange={setChartsExpanded}
            >
              {chartsExpanded ? (
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="text-gray-700 flex-1">
                    Мои режимные карты
                  </h3>
                  <CollapsibleTrigger asChild>
                    <button
                      className="p-1 h-auto hover:bg-gray-700 transition-colors flex-shrink-0 rounded-md text-gray-400 hover:text-white w-auto"
                      title={
                        chartsExpanded
                          ? "Свернуть список"
                          : "Развернуть список"
                      }
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          chartsExpanded ? "" : "-rotate-90"
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                </div>
              ) : (
                <></>
              )}
              {chartsExpanded ? (
                <ScrollArea className="h-[150px] rounded border border-gray-400" style={{height: 'fit-content'}}>
                  {charts.map((chart) => (
                    <button
                      key={chart.id}
                      style={{ fontSize: "14px" }}
                      onClick={() => {
                        setChartsExpanded(false);
                        setСhosenAction("choseOne");
                        onSelectChart(charts[0]);
                      }}
                      className={`w-full text-left px-3 py-2 rounded transition-colors hover:bg-gray-300 text-gray-600 text-sm
             ${
               activeChart?.id === chart.id
                 ? "bg-gray-600 text-white"
                 : ""
             }`}
                    >
                      {chart.title}
                    </button>
                  ))}
                </ScrollArea>
              ) : (
                <></>
              )}
            </Collapsible>
          )}
          {!chartsExpanded &&
          activeChart &&
          chosenAction !== "createNew" ? (
            <button
              style={{ fontSize: "14px" }}
              className={`w-full text-left px-3 py-2 rounded background-color: var(--input-background); text-gray-800 text-sm border
             `}
            >
              {activeChart?.title}
            </button>
          ) : (
            <></>
          )}

          {/* NEW WORKFLOW - Staged approach */}
          {activeChart && (
            <>
              <Separator
                className="bg-gray-700"
                style={{ marginBottom: "0" }}
              />
                <Accordion
                  type="multiple"
                  value={accordionValue}
                  onValueChange={setAccordionValue}
                  className="w-full"
                >
                  {/* STAGE 1: Track Section Selection */}
                  <AccordionItem
                    value="stage1"
                    className="border-gray-700"
                  >
                    <AccordionTrigger className="text-gray-700 hover:text-gray-500 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0">
                          Параметры задания на расчет
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-1">
                      <Stage1CalculationParams
                        workflow={
                          activeChart.workflow || {
                            currentStage: 1,
                          }
                        }
                        onUpdateWorkflow={(updates) => {
                          onUpdateChartData({
                            workflow: {
                              ...(activeChart.workflow || {
                                currentStage: 1,
                              }),
                              ...updates,
                            },
                          });
                        }}
                        isOld={activeChart?.age === "old"}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
            </>
          )}
        </div>
      </div>
    </div>
  );
}