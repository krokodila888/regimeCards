import React, { useState } from "react";
import {
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import type {
  WorkflowState,
  RegimeArrow,
} from "../types/chart-data";

interface Stage3RegimeEditingProps {
  workflow: WorkflowState;
  onUpdateWorkflow: (updates: Partial<WorkflowState>) => void;
  isLocked: boolean;
  onShowLoading: (message: string) => void;
}

export default function Stage3RegimeEditing({
  workflow,
  onUpdateWorkflow,
  isLocked,
  onShowLoading,
}: Stage3RegimeEditingProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedModeId, setSelectedModeId] = useState<
    string | null
  >(null);
  const [instructionsOpen, setInstructionsOpen] =
    useState(false);

  // Helper function to get sidebar arrow color (lighter for visibility)
  const getSidebarArrowColor = (
    canvasColor: string,
  ): string => {
    const colorMap: { [key: string]: string } = {
      "#22c55e": "#4ade80", // green -> lighter green
      "#16a34a": "#22c55e", // dark green -> green
      "#3b82f6": "#60a5fa", // blue -> lighter blue
      "#1d4ed8": "#3b82f6", // dark blue -> blue
      "#f59e0b": "#fbbf24", // amber -> lighter amber
      "#d97706": "#f59e0b", // dark amber -> amber
      "#a855f7": "#c084fc", // purple -> lighter purple
      "#7c3aed": "#a855f7", // dark purple -> purple
      "#d1d5db": "#e5e7eb", // gray -> lighter gray
      "#8b5cf6": "#a78bfa", // violet -> lighter violet
      "#10b981": "#34d399", // emerald -> lighter emerald
      "#059669": "#10b981", // dark emerald -> emerald
    };
    return colorMap[canvasColor] || canvasColor;
  };

  const handleSelectMode = (modeId: string) => {
    setSelectedModeId(modeId);

    // Auto-place a sample arrow for demo purposes
    // In a full implementation, this would be triggered by canvas click
    const trackLength = workflow.trackSection?.length || 200;
    const existingArrows = workflow.regimeArrows || [];

    // Calculate next arrow position
    let startKm = 0;
    if (existingArrows.length > 0) {
      const lastArrow =
        existingArrows[existingArrows.length - 1];
      startKm = lastArrow.endKm;
    }

    // Don't add if we're past the end
    if (startKm >= trackLength) {
      return;
    }

    const arrowLength = Math.min(20, trackLength - startKm);
    const endKm = Math.min(startKm + arrowLength, trackLength);

    const newArrow: RegimeArrow = {
      id: `arrow-${Date.now()}`,
      modeId,
      startKm,
      endKm,
    };

    onUpdateWorkflow({
      regimeArrows: [...existingArrows, newArrow],
    });
  };

  const handleCalculateActualCurve = async () => {
    if (
      !workflow.regimeArrows ||
      workflow.regimeArrows.length === 0
    )
      return;

    setIsCalculating(true);
    onShowLoading("Calculating actual speed curve...");
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Generate actual speed curve based on regime arrows with proper smoothing
    const trackLength = workflow.trackSection?.length || 200;
    const rawCurve: { km: number; speed: number }[] = [];

    // Step 1: Generate raw speed values for each point
    for (let km = 0; km <= trackLength; km += 0.5) {
      // Find which arrow applies at this km
      const arrow = workflow.regimeArrows.find(
        (a) => km >= a.startKm && km <= a.endKm,
      );

      if (!arrow) {
        // No arrow - use very low speed or zero
        rawCurve.push({ km, speed: 0 });
        continue;
      }

      // Get the mode for this arrow
      const mode = workflow.locomotive?.tractionModes.find(
        (m) => m.id === arrow.modeId,
      );

      // Get speed limit at this position
      const speedLimits =
        workflow.trackSection?.speedLimits || [];
      const limit = speedLimits.find(
        (sl) => km >= sl.startCoord && km <= sl.endCoord,
      );
      const maxSpeed = limit ? limit.limitValue : 120;

      // Calculate relative position within arrow (0 to 1)
      const relativePos =
        (km - arrow.startKm) / (arrow.endKm - arrow.startKm);

      // Calculate base target speed based on mode
      let targetSpeed = maxSpeed * 0.9; // Base 90% efficiency

      // Mode-specific adjustments (based on power settings)
      if (
        mode?.label.includes("100%") ||
        mode?.label.includes("MAX")
      ) {
        targetSpeed = maxSpeed * 0.95;
      } else if (mode?.label.includes("85%")) {
        targetSpeed = maxSpeed * 0.93;
      } else if (
        mode?.label.includes("80%") ||
        mode?.label.includes("70%")
      ) {
        targetSpeed = maxSpeed * 0.92;
      } else if (
        mode?.label.includes("50%") ||
        mode?.label.includes("60%")
      ) {
        targetSpeed = maxSpeed * 0.88;
      } else if (
        mode?.label.includes("30%") ||
        mode?.label.includes("40%")
      ) {
        targetSpeed = maxSpeed * 0.82;
      } else if (
        mode?.label.toLowerCase().includes("выбег") ||
        mode?.label.toLowerCase().includes("coasting")
      ) {
        targetSpeed = maxSpeed * 0.75; // Coasting mode - lower speed
      } else if (
        mode?.label.includes("СП-4ОП") ||
        mode?.label.includes("2СП-4ОП")
      ) {
        targetSpeed = maxSpeed * 0.9; // 4-position controller modes
      } else if (mode?.label.includes("Р\\т СП")) {
        targetSpeed = maxSpeed * 0.91; // Rheostatic braking mode
      }

      // Apply smooth acceleration at arrow start and smooth deceleration at arrow end
      let speed = targetSpeed;
      const transitionLength = 0.15; // 15% of arrow length for transitions

      if (relativePos < transitionLength) {
        // Smooth acceleration at start
        const accelProgress = relativePos / transitionLength;
        const prevSpeed =
          km > 0
            ? rawCurve[rawCurve.length - 1]?.speed || 0
            : 0;
        speed =
          prevSpeed +
          ((targetSpeed - prevSpeed) *
            (1 - Math.cos(accelProgress * Math.PI))) /
            2;
      } else if (relativePos > 1 - transitionLength) {
        // Check if there's a next arrow
        const nextArrow = workflow.regimeArrows.find(
          (a) => a.startKm === arrow.endKm,
        );

        if (nextArrow) {
          // Smooth transition to next arrow's speed
          const decelProgress =
            (relativePos - (1 - transitionLength)) /
            transitionLength;

          // Estimate next arrow's target speed
          const nextMode =
            workflow.locomotive?.tractionModes.find(
              (m) => m.id === nextArrow.modeId,
            );
          let nextTargetSpeed = maxSpeed * 0.9;
          if (
            nextMode?.label.includes("100%") ||
            nextMode?.label.includes("MAX")
          ) {
            nextTargetSpeed = maxSpeed * 0.95;
          } else if (
            nextMode?.label.includes("80%") ||
            nextMode?.label.includes("70%")
          ) {
            nextTargetSpeed = maxSpeed * 0.92;
          } else if (
            nextMode?.label.includes("50%") ||
            nextMode?.label.includes("60%")
          ) {
            nextTargetSpeed = maxSpeed * 0.88;
          } else if (
            nextMode?.label.includes("30%") ||
            nextMode?.label.includes("40%")
          ) {
            nextTargetSpeed = maxSpeed * 0.82;
          }

          speed =
            targetSpeed +
            ((nextTargetSpeed - targetSpeed) *
              (1 - Math.cos(decelProgress * Math.PI))) /
              2;
        }
      }

      // Add very subtle variation for realism (much smaller than before)
      speed += Math.sin(km * 0.8 + relativePos * 3) * 1.5;

      // Ensure speed never exceeds limit and is non-negative
      speed = Math.max(0, Math.min(speed, maxSpeed));

      rawCurve.push({ km, speed });
    }

    // Step 2: Apply smoothing filter to remove sharp peaks
    // Use a moving average filter for additional smoothing
    const smoothedCurve: { km: number; speed: number }[] = [];
    const windowSize = 5; // 5-point moving average

    for (let i = 0; i < rawCurve.length; i++) {
      let sum = 0;
      let count = 0;

      for (
        let j = -Math.floor(windowSize / 2);
        j <= Math.floor(windowSize / 2);
        j++
      ) {
        const index = i + j;
        if (index >= 0 && index < rawCurve.length) {
          sum += rawCurve[index].speed;
          count++;
        }
      }

      smoothedCurve.push({
        km: rawCurve[i].km,
        speed: sum / count,
      });
    }

    // Step 3: Ensure curve starts and ends at zero
    // Force first few points to create smooth acceleration from 0
    if (smoothedCurve.length > 0) {
      smoothedCurve[0].speed = 0;

      // Find first non-zero target speed
      let targetStartSpeed = smoothedCurve[4]?.speed || 60;

      // Smooth ramp up over first 4 points (2 km)
      for (
        let i = 1;
        i < Math.min(4, smoothedCurve.length);
        i++
      ) {
        const progress = i / 4;
        smoothedCurve[i].speed =
          (targetStartSpeed *
            (1 - Math.cos(progress * Math.PI))) /
          2;
      }

      // Force last point to be exactly 0
      smoothedCurve[smoothedCurve.length - 1].speed = 0;

      // Smooth ramp down over last 4 points (2 km)
      const lastIndex = smoothedCurve.length - 1;
      let targetEndSpeed =
        smoothedCurve[lastIndex - 4]?.speed || 60;

      for (
        let i = 1;
        i < Math.min(4, smoothedCurve.length);
        i++
      ) {
        const progress = i / 4;
        const index = lastIndex - i;
        if (index > 0) {
          smoothedCurve[index].speed =
            (targetEndSpeed *
              (1 - Math.cos((1 - progress) * Math.PI))) /
            2;
        }
      }
    }

    onUpdateWorkflow({ actualSpeedCurve: smoothedCurve });
    setIsCalculating(false);
  };

  if (isLocked) {
    return (
      <div className="text-center text-gray-500 text-sm py-8">
        Завершите предыдущие этапы
      </div>
    );
  }

  if (!workflow.locomotive || !workflow.optimalSpeedCurve) {
    return (
      <div className="text-center text-gray-500 text-sm py-8">
        Рассчитайте оптимальную кривую скорости
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Palette */}
      <div>
        <div className="text-xs text-gray-500 mb-2">
          Выберите режим тяги для размещения на холсте:
        </div>
        <ScrollArea className="h-[220px] rounded border border-gray-400">
          <div className="p-3 space-y-2">
            {workflow.locomotive.tractionModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleSelectMode(mode.id)}
                className={`w-full p-3 rounded transition-colors ${
                  selectedModeId === mode.id
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-gray-300 text-gray-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Arrow Icon */}
                  <div className="flex-shrink-0">
                    <ArrowRight
                      className="w-6 h-6"
                      style={{
                        color: getSidebarArrowColor(mode.color),
                        strokeDasharray:
                          mode.lineStyle === "dashed"
                            ? "4 4"
                            : mode.lineStyle === "dotted"
                              ? "1 3"
                              : "none",
                      }}
                    />
                  </div>

                  {/* Label - only arrow name */}
                  <div className="flex-1 min-w-0 text-left">
                    <div
                      className="text-sm break-words whitespace-normal"
                      style={{ overflowWrap: "anywhere" }}
                    >
                      {mode.label}
                    </div>
                  </div>

                  {/* Color Indicator */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: getSidebarArrowColor(
                        mode.color,
                      ),
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Calculate Actual Curve Button - Primary Action */}
      {workflow.regimeArrows &&
        workflow.regimeArrows.length > 0 && (
          <Button
            onClick={handleCalculateActualCurve}
            disabled={isCalculating}
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
                Расчёт фактической кривой...
              </>
            ) : (
              "Рассчитать фактическую кривую скорости"
            )}
          </Button>
        )}

      {/* Actual Curve Calculated */}
      {workflow.actualSpeedCurve && (
        <div className="p-3 text-xs text-green-800">
          <div className="text-xs text-green-800 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Фактическая кривая скорости рассчитана
          </div>
        </div>
      )}
    </div>
  );
}