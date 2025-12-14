import React, { useState } from "react";
import {
  Check,
  Plus,
  Trash2,
  Loader2,
  Edit2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import type {
  Locomotive,
  TrainComposition,
  WorkflowState,
} from "../types/chart-data";

import { WAGON_TYPES, LOCOMOTIVES } from "../types/consts";

// Sample train compositions
const TRAIN_COMPOSITIONS: TrainComposition[] = [
  {
    id: "tc1",
    name: "Пассажирский состав (12 вагонов)",
    wagons: [{ type: "Пассажирский (ПТР)", quantity: 12 }],
  },
  {
    id: "tc2",
    name: "Грузовой состав (20 полувагонов)",
    wagons: [{ type: "Полувагон, 6 осей (ПТР)", quantity: 20 }],
  },
  {
    id: "tc3",
    name: "Смешанный",
    wagons: [
      { type: "Почтовый (ПТР)", quantity: 12 },
      { type: "Крытый (ПТР)", quantity: 20 },
    ],
  },
];

interface Stage2LocomotiveProps {
  workflow: WorkflowState;
  onUpdateWorkflow: (updates: Partial<WorkflowState>) => void;
  isLocked: boolean;
  onShowLoading: (message: string) => void;
}

export default function Stage2Locomotive({
  workflow,
  onUpdateWorkflow,
  isLocked,
  onShowLoading,
}: Stage2LocomotiveProps) {
  const [compositionType, setCompositionType] = useState<
    "none" | "preset" | "custom"
  >("none");
  const [isEditingComposition, setIsEditingComposition] =
    useState(false);

  const [selectedPreset, setSelectedPreset] = useState<
    string | null
  >(null);
  const [customWagons, setCustomWagons] = useState<
    { type: string; quantity: number }[]
  >([{ type: WAGON_TYPES[0].name, quantity: 1 }]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate total length and mass
  const calculateTotals = () => {
    let totalLength = workflow?.locomotive?.length || 0;
    let totalMass = workflow?.locomotive?.mass || 0;

    if (workflow.trainComposition === "none") {
      // Only locomotive
      return { totalLength, totalMass };
    }

    if (
      workflow.trainComposition === "custom" &&
      workflow.customComposition
    ) {
      workflow.customComposition.forEach((wagon) => {
        const wagonType = WAGON_TYPES.find(
          (wt) => wt.name === wagon.type,
        );
        if (wagonType) {
          totalLength += wagonType.length * wagon.quantity;
          totalMass += wagonType.mass * wagon.quantity;
        }
      });
    } else if (
      workflow.trainComposition /*&&
      workflow.trainComposition !== "none"*/ &&
      workflow.trainComposition !== "custom"
    ) {
      const composition =
        workflow.trainComposition as TrainComposition;
      composition.wagons.forEach((wagon) => {
        const wagonType = WAGON_TYPES.find(
          (wt) => wt.name === wagon.type,
        );
        if (wagonType) {
          totalLength += wagonType.length * wagon.quantity;
          totalMass += wagonType.mass * wagon.quantity;
        }
      });
    }

    return { totalLength, totalMass };
  };

  const { totalLength, totalMass } = calculateTotals();

  const handleSelectLocomotive = (locomotive: Locomotive) => {
    onUpdateWorkflow({
      locomotive,
    });
  };

  const handleChangeLocomotive = () => {
    // Clear curves and lock stage 3
    onUpdateWorkflow({
      locomotive: undefined,
      trainComposition: undefined,
      customComposition: undefined,
      optimalSpeedCurve: undefined,
      regimeArrows: undefined,
      actualSpeedCurve: undefined,
    });
  };

  const handleCalculateSpeedCurve = async () => {
    if (!workflow.locomotive || !workflow.trackSection) return;

    setIsCalculating(true);
    onShowLoading("Calculating optimal speed curve...");

    // Update composition based on type
    if (compositionType === "none") {
      onUpdateWorkflow({ trainComposition: "none" });
    } else if (compositionType === "preset" && selectedPreset) {
      const preset = TRAIN_COMPOSITIONS.find(
        (tc) => tc.id === selectedPreset,
      );
      onUpdateWorkflow({ trainComposition: preset });
    } else if (compositionType === "custom") {
      onUpdateWorkflow({
        trainComposition: "custom",
        customComposition: customWagons,
      });
    }

    // Simulate calculation with loading
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate optimal speed curve
    const trackLength = workflow.trackSection.length;
    const speedCurve: { km: number; speed: number }[] = [];

    // Generate smooth curve respecting speed restrictions
    for (let km = 0; km <= trackLength; km += 0.5) {
      // Find applicable speed limit
      const limit = workflow.trackSection.speedLimits.find(
        (sl) => km >= sl.startCoord && km <= sl.endCoord,
      );
      const maxSpeed = limit ? limit.limitValue : 120;

      // Generate realistic energy-optimal acceleration/deceleration curve
      // that ALWAYS respects speed restrictions
      let speed: number;
      const progress = km / trackLength;

      if (progress < 0.1) {
        // Acceleration from start - stay under limit
        const targetSpeed = maxSpeed * 0.9; // Target 90% of limit for efficiency
        speed = Math.min(
          targetSpeed,
          targetSpeed * (progress / 0.1),
        );
      } else if (progress > 0.85) {
        // Deceleration to end - must reach 0 at final point
        const decelerationProgress = (1 - progress) / 0.15; // 0.85 to 1.0 = 15% of track
        const targetSpeed = maxSpeed * 0.9;
        speed = Math.min(
          targetSpeed,
          targetSpeed * decelerationProgress,
        );
      } else {
        // Cruise at optimal efficiency - never exceed limit
        // Use 90-95% of limit for energy optimal curve with slight variations
        const optimalRatio =
          0.92 + Math.sin(progress * Math.PI * 4) * 0.03;
        speed = maxSpeed * optimalRatio;
      }

      // Ensure speed never exceeds the speed limit
      speed = Math.min(speed, maxSpeed);

      // Ensure first and last points are exactly 0
      if (km === 0 || km === trackLength) {
        speed = 0;
      }

      speedCurve.push({ km, speed: Math.max(0, speed) });
    }

    // Update workflow with speedCurve AND unlock stage 3 in one call
    // to avoid race condition where second update overwrites first
    onUpdateWorkflow({
      optimalSpeedCurve: speedCurve,
      currentStage: 3,
    });
    setIsCalculating(false);
  };

  const addWagonRow = () => {
    setCustomWagons([
      ...customWagons,
      { type: WAGON_TYPES[0].name, quantity: 1 },
    ]);
  };

  const removeWagonRow = (index: number) => {
    setCustomWagons(customWagons.filter((_, i) => i !== index));
  };

  const updateWagonType = (index: number, type: string) => {
    const updated = [...customWagons];
    updated[index].type = type;
    setCustomWagons(updated);
  };

  const updateWagonQuantity = (
    index: number,
    quantity: number,
  ) => {
    const updated = [...customWagons];
    updated[index].quantity = Math.max(1, quantity);
    setCustomWagons(updated);
  };

  const canCalculate =
    workflow.locomotive &&
    (compositionType === "none" ||
      (compositionType === "preset" && selectedPreset) ||
      (compositionType === "custom" &&
        customWagons.length > 0));

  if (isLocked) {
    return (
      <div className="text-center text-gray-500 text-sm py-8">
        Завершите выбор участка пути
      </div>
    );
  }

  if (workflow.optimalSpeedCurve) {
    return (
      <div className="space-y-3">
        <div className="bg-white rounded p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-700 break-words">
                Локомотив: {workflow.locomotive?.name}
              </div>
              <div className="text-sm text-gray-700 break-words">
                Состав:
                {compositionType === "none"
                  ? " Без состава"
                  : compositionType === "custom"
                    ? " Пользовательский"
                    : compositionType === "preset"
                      ? ` ${TRAIN_COMPOSITIONS.find((item) => item.id === selectedPreset)?.name}`
                      : ""}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Длина: {totalLength} км. Масса: {totalMass} т.
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleChangeLocomotive}
                    className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-600"
                    title="Изменить состав"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Изменить состав</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="text-xs text-green-800 flex items-center gap-2">
          <Check className="w-4 h-4" />
          Оптимальная кривая скорости рассчитана
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Locomotive Selection */}
      <div>
        <Label className="text-gray-600 text-xs mb-2 block">
          Выберите локомотив:
        </Label>
        <ScrollArea className="h-[94px] rounded border border-gray-700">
          <div className="p-2 space-y-1">
            {LOCOMOTIVES.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleSelectLocomotive(loc)}
                className={`w-full text-left px-3 py-2 rounded transition-colors text-sm whitespace-normal ${
                  workflow.locomotive?.id === loc.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-300 text-gray-600"
                }`}
                style={{ overflowWrap: "anywhere" }}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Train Composition */}
      {workflow.locomotive && (
        <div>
          <Label className="text-gray-600 text-xs mb-2 block">
            Состав поезда:
          </Label>

          {/* Composition Type Selection */}
          <div className="space-y-2 mb-3">
            {(!isEditingComposition ||
              (isEditingComposition &&
                compositionType === "none")) && (
              <button
                onClick={() => {
                  setCompositionType("none");
                  setSelectedPreset(null);
                }}
                className={`flex w-full text-left px-3 py-2 rounded transition-colors text-sm whitespace-normal ${
                  compositionType === "none"
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-gray-300 text-gray-600"
                }`}
                style={{
                  overflowWrap: "anywhere",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <p>Без состава</p>
                {isEditingComposition && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingComposition(false);
                      setCompositionType("none");
                      setSelectedPreset(null);
                    }}
                    className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-600"
                    title="Изменить выбор"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </button>
            )}

            {(!isEditingComposition ||
              (isEditingComposition &&
                compositionType === "preset")) && (
              <button
                onClick={() => {
                  setCompositionType("preset");
                  setIsEditingComposition(true);
                }}
                className={`flex w-full text-left px-3 py-2 rounded transition-colors text-sm whitespace-normal ${
                  compositionType === "preset"
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-gray-300 text-gray-600"
                }`}
                style={{
                  overflowWrap: "anywhere",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <p>Готовый состав</p>
                {isEditingComposition && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingComposition(false);
                      setCompositionType("none");
                      setSelectedPreset(null);
                    }}
                    className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-600"
                    title="Изменить выбор"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </button>
            )}
            {/* Preset Compositions */}
            {compositionType === "preset" && (
              <>
                <Select
                  value={selectedPreset || ""}
                  onValueChange={setSelectedPreset}
                >
                  <SelectTrigger className="bg-white border-gray-400 text-gray-600 text-sm">
                    <SelectValue placeholder="Выберите состав..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAIN_COMPOSITIONS.map((tc) => (
                      <SelectItem key={tc.id} value={tc.id}>
                        {tc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPreset ? (
                  <div className="space-y-2">
                    {TRAIN_COMPOSITIONS.find(
                      (item) => item.id === selectedPreset,
                    )?.wagons?.map((wagon, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-gray-200 rounded"
                      >
                        <Input
                          value={wagon.type}
                          onChange={undefined}
                          disabled={true}
                        ></Input>
                        <Input
                          type="number"
                          min="1"
                          disabled={true}
                          value={wagon.quantity}
                          onChange={undefined}
                          className="w-16 bg-white border-gray-500 text-gray-700 text-xs h-8"
                        />
                      </div>
                    ))}
                  </div>
                ) : undefined}
              </>
            )}

            {(!isEditingComposition ||
              (isEditingComposition &&
                compositionType === "custom")) && (
              <button
                onClick={() => {
                  setCompositionType("custom");
                  setIsEditingComposition(true);
                }}
                className={`flex w-full text-left px-3 py-2 rounded transition-colors text-sm whitespace-normal ${
                  compositionType === "custom"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-300 text-gray-600"
                }`}
                style={{
                  overflowWrap: "anywhere",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <p>Пользовательский состав</p>
                {isEditingComposition && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingComposition(false);
                      setCompositionType("none");
                      setSelectedPreset(null);
                    }}
                    className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-600"
                    title="Изменить выбор"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </button>
            )}
          </div>

          {/* Custom Composition Table */}
          {compositionType === "custom" && (
            <div className="space-y-2">
              {customWagons.map((wagon, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-200 rounded"
                >
                  <Select
                    value={wagon.type}
                    onValueChange={(val) =>
                      updateWagonType(index, val)
                    }
                  >
                    <SelectTrigger className="flex-1 bg-white border-gray-500 text-gray-700 text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WAGON_TYPES.map((type) => (
                        <SelectItem
                          key={type}
                          value={type.name}
                        >
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={wagon.quantity}
                    onChange={(e) =>
                      updateWagonQuantity(
                        index,
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className="w-16 bg-white border-gray-500 text-gray-700 text-xs h-8"
                  />
                  {customWagons.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeWagonRow(index)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={addWagonRow}
                className="w-full bg-white text-gray-700 border-gray-500 hover:bg-gray-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить вагон
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Calculate Button - Primary Action */}
      {workflow.locomotive && (
        <Button
          onClick={handleCalculateSpeedCurve}
          disabled={!canCalculate || isCalculating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          style={{
            minHeight: "50px",
            height: "auto",
            padding: "14px 18px",
            display: "inline-flex",
            flexWrap: "wrap",
            whiteSpace: "normal",
            overflowWrap: "break-word",
            textAlign: "center",
            fontSize: "15px",
            fontWeight: "700",
            letterSpacing: "0.3px",
          }}
        >
          {isCalculating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Расчёт кривой скорости...
            </>
          ) : (
            "Рассчитать оптимальную кривую скорости"
          )}
        </Button>
      )}
    </div>
  );
}