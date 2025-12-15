import React, { useState, useEffect } from "react";
import {
  Edit2,
  Plus,
  X,
  Scale,
  Train,
  Zap,
  Package,
  Hash,
  Weight,
  Route,
  MapPin,
  Clock,
  Navigation,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import type { WorkflowState } from "../types/chart-data";
import {
  LOCOMOTIVES,
  WAGON_TYPES,
  ROADS,
} from "../types/consts";
import { tracks } from "../types/tracks";

interface Stage1CalculationParamsProps {
  workflow: WorkflowState;
  onUpdateWorkflow: (updates: Partial<WorkflowState>) => void;
  isOld?: boolean;
}

export default function Stage1CalculationParams({
  workflow,
  onUpdateWorkflow,
  isOld = false,
}: Stage1CalculationParamsProps) {
  const [wagonGroupsModalOpen, setWagonGroupsModalOpen] =
    useState(false);
  const [speedLimitsModalOpen, setSpeedLimitsModalOpen] =
    useState(false);

  // Wagon Groups modal state
  const [newWagonType, setNewWagonType] = useState("");
  const [newWagonQuantity, setNewWagonQuantity] =
    useState<number>(1);
  const [newWagonMass, setNewWagonMass] = useState<number>(0);

  // Speed Limits modal state
  const [newSpeedStartCoord, setNewSpeedStartCoord] =
    useState<number>(0);
  const [newSpeedEndCoord, setNewSpeedEndCoord] =
    useState<number>(0);
  const [newSpeedLimit, setNewSpeedLimit] = useState<number>(0);

  // Track previous scale to detect changes
  const [previousScale, setPreviousScale] = useState(
    workflow.scale || "1:1",
  );

  // Auto-populate fields when predefined section data is available
  useEffect(() => {
    if (
      isOld &&
      workflow.trackSection &&
      workflow.trackSection.stations &&
      workflow.trackSection.stations.length > 0
    ) {
      const stations = workflow.trackSection.stations;
      const firstStation = stations[0];
      const lastStation = stations[stations.length - 1];

      // Auto-populate fields if not already set
      if (!workflow.departureStation) {
        // Find matching road objects from ROADS constant
        const departureRoadObj = ROADS.find(
          (r) => r.name === firstStation.road,
        ) || ROADS[0];
        const arrivalRoadObj = ROADS.find(
          (r) => r.name === lastStation.road,
        ) || ROADS[0];

        onUpdateWorkflow({
          departureRoad: departureRoadObj,
          departureStation: firstStation.stationName,
          arrivalRoad: arrivalRoadObj,
          arrivalStation: lastStation.stationName,
          grossTrainMass: workflow.mass || 0,
          travelTime: workflow.time || 0,
          numberOfUnits: (workflow as any).locomotiveQuantity || 1,
        });
      }
    }
  }, [
    isOld,
    workflow.trackSection,
    workflow.departureStation,
    workflow.mass,
    workflow.time,
    onUpdateWorkflow,
  ]);

  // Initialize default values
  const scale = workflow.scale || "1:1";
  const movementType = workflow.movementType || "Грузовое";
  const tractionType =
    workflow.tractionType || "Электрическая тяга";
  const locomotive = workflow.locomotive || LOCOMOTIVES[0];
  const numberOfUnits = workflow.numberOfUnits || 1;
  const grossTrainMass = workflow.grossTrainMass || 0;
  const wagonGroups = workflow.wagonGroups || [];
  const calculationType =
    workflow.calculationType || "Действующий участок";
  const departureRoad = workflow.departureRoad || ROADS[0];
  const departureStation = workflow.departureStation;
  const arrivalRoad = workflow.arrivalRoad || ROADS[0];
  const arrivalStation = workflow.arrivalStation;
  const travelTime = workflow.travelTime || 0;
  const dateRange = workflow.dateRange || {
    from: null,
    to: null,
  };
  const customSpeedLimits = workflow.customSpeedLimits || [];

  // Handle scale changes after initial track load
  useEffect(() => {
    // Only trigger if:
    // 1. Scale has changed
    // 2. Track section exists (Step 1 completed)
    // 3. Not in old/predefined mode
    if (
      scale !== previousScale &&
      workflow.trackSection &&
      !isOld
    ) {
      setPreviousScale(scale);

      // Calculate new pixelsPerKm based on selected scale
      let pixelsPerKm = 100;
      switch (scale) {
        case "1:1":
          pixelsPerKm = 1000;
          break;
        case "1:5":
          pixelsPerKm = 200;
          break;
        case "1:10":
          pixelsPerKm = 100;
          break;
        case "1:50":
          pixelsPerKm = 20;
          break;
        case "1:100":
          pixelsPerKm = 10;
          break;
      }

      // Update the initialCanvasScale - this will trigger canvas redraw
      onUpdateWorkflow({
        initialCanvasScale: pixelsPerKm,
      });
    }
  }, [
    scale,
    workflow.trackSection,
    previousScale,
    isOld,
    onUpdateWorkflow,
  ]);

  // Get all unique stations from tracks
  const allStations = tracks
    .flatMap((track) => track.stations || [])
    .filter(
      (station, index, self) =>
        self.findIndex(
          (s) => s.stationName === station.stationName,
        ) === index,
    )
    .map((station) => station.stationName)
    .sort();

  const handleAddWagonGroup = () => {
    if (!newWagonType) return;

    const wagonType = WAGON_TYPES.find(
      (w) => w.name === newWagonType,
    );
    if (!wagonType) return;

    const newGroup = {
      id: `wg-${Date.now()}`,
      wagonType: newWagonType,
      quantity: newWagonQuantity,
      mass: newWagonMass,
    };

    onUpdateWorkflow({
      wagonGroups: [...wagonGroups, newGroup],
    });

    setNewWagonType("");
    setNewWagonQuantity(1);
    setNewWagonMass(0);
  };

  const handleRemoveWagonGroup = (id: string) => {
    onUpdateWorkflow({
      wagonGroups: wagonGroups.filter((g) => g.id !== id),
    });
  };

  const handleAddSpeedLimit = () => {
    const newLimit = {
      id: `csl-${Date.now()}`,
      startCoord: newSpeedStartCoord,
      endCoord: newSpeedEndCoord,
      allowedSpeed: newSpeedLimit,
    };

    onUpdateWorkflow({
      customSpeedLimits: [...customSpeedLimits, newLimit],
    });

    setNewSpeedStartCoord(0);
    setNewSpeedEndCoord(0);
    setNewSpeedLimit(0);
  };

  const handleRemoveSpeedLimit = (id: string) => {
    onUpdateWorkflow({
      customSpeedLimits: customSpeedLimits.filter(
        (l) => l.id !== id,
      ),
    });
  };

  const handleFormSubmit = () => {
    // Find the track section based on selected stations
    if (departureStation && arrivalStation) {
      // For prototype, just use the first track that contains either station
      const matchingTrack = tracks.find((track) =>
        track.stations?.some(
          (s) =>
            s.stationName === departureStation ||
            s.stationName === arrivalStation,
        ),
      );

      if (matchingTrack) {
        // Calculate initial canvas scale based on selected scale
        // Base: 1:100 → 1 km = 10 pixels
        // Derive other ratios:
        // 1:1 → 1 km = 1000 pixels
        // 1:5 → 1 km = 200 pixels
        // 1:10 → 1 km = 100 pixels
        // 1:50 → 1 km = 20 pixels
        // 1:100 → 1 km = 10 pixels
        let pixelsPerKm = 100; // Default for 1:10

        if (isOld) {
          // For existing/pre-selected track sections → always use 1:10 scale
          pixelsPerKm = 100;
        } else {
          // For new track sections, use selected scale
          switch (scale) {
            case "1:1":
              pixelsPerKm = 1000;
              break;
            case "1:5":
              pixelsPerKm = 200;
              break;
            case "1:10":
              pixelsPerKm = 100;
              break;
            case "1:50":
              pixelsPerKm = 20;
              break;
            case "1:100":
              pixelsPerKm = 10;
              break;
          }
        }

        // Generate optimal speed curve
        const trackLength = matchingTrack.length;
        const speedCurve: { km: number; speed: number }[] = [];

        // Generate smooth curve respecting speed restrictions
        for (let km = 0; km <= trackLength; km += 0.5) {
          // Find applicable speed limit
          const limit = matchingTrack.speedLimits.find(
            (sl) => km >= sl.startCoord && km <= sl.endCoord,
          );
          const maxSpeed = limit ? limit.limitValue : 120;

          // Generate realistic energy-optimal acceleration/deceleration curve
          let speed: number;
          const progress = km / trackLength;

          if (progress < 0.1) {
            // Acceleration from start - stay under limit
            const targetSpeed = maxSpeed * 0.9;
            speed = Math.min(
              targetSpeed,
              targetSpeed * (progress / 0.1),
            );
          } else if (progress > 0.85) {
            // Deceleration to end
            const decelerationProgress = (1 - progress) / 0.15;
            const targetSpeed = maxSpeed * 0.9;
            speed = Math.min(
              targetSpeed,
              targetSpeed * decelerationProgress,
            );
          } else {
            // Cruise at optimal efficiency
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

        // Generate initial regime arrows
        const regimeArrows: any[] = [];

        // Create a simple set of regime arrows for demonstration
        if (
          locomotive?.tractionModes &&
          locomotive.tractionModes.length > 0
        ) {
          const arrowLength = trackLength / 5; // Divide into 5 segments
          for (let i = 0; i < 5; i++) {
            const startKm = i * arrowLength;
            const endKm = Math.min(
              (i + 1) * arrowLength,
              trackLength,
            );

            // Alternate between different traction modes
            const modeIndex =
              i % locomotive.tractionModes.length;
            const mode = locomotive.tractionModes[modeIndex];

            regimeArrows.push({
              id: `arrow-${Date.now()}-${i}`,
              modeId: mode.id,
              startKm,
              endKm,
            });
          }
        }

        onUpdateWorkflow({
          trackSection: matchingTrack,
          optimalSpeedCurve: speedCurve,
          regimeArrows,
          initialCanvasScale: pixelsPerKm,
          currentStage: 2,
        });
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Scale */}
      <div className="relative" title="Масштаб">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
          <Scale className="w-4 h-4" />
        </div>
        <Select
          value={scale}
          onValueChange={(value: any) =>
            onUpdateWorkflow({ scale: value })
          }
        >
          <SelectTrigger className="bg-white border-gray-400 text-gray-600 pl-10">
            <SelectValue placeholder="Масштаб" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1:1">1:1</SelectItem>
            <SelectItem value="1:5">1:5</SelectItem>
            <SelectItem value="1:10">1:10</SelectItem>
            <SelectItem value="1:50">1:50</SelectItem>
            <SelectItem value="1:100">1:100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Movement Type */}
      <div className="relative" title="Тип движения">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 z-10">
          <Package className="w-4 h-4" />
        </div>
        <Select
          value={movementType}
          onValueChange={(value: any) =>
            onUpdateWorkflow({ movementType: value })
          }
        >
          <SelectTrigger className="bg-white border-gray-400 text-gray-600 pl-10">
            <SelectValue placeholder="Тип движения" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Грузовое">Грузовое</SelectItem>
            <SelectItem value="Пассажирское">
              Пассажирское
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Traction Type */}
      <div className="relative" title="Тип тяги">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 z-10">
          <Zap className="w-4 h-4" />
        </div>
        <Select
          value={tractionType}
          onValueChange={(value: any) =>
            onUpdateWorkflow({ tractionType: value })
          }
        >
          <SelectTrigger className="bg-white border-gray-400 text-gray-600 pl-10">
            <SelectValue placeholder="Тип тяги" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Электрическая тяга">
              Электрическая тяга
            </SelectItem>
            <SelectItem value="Дизельная тяга">
              Дизельная тяга
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Locomotive */}
      <div className="relative" title="Локомотив">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 z-10">
          <Train className="w-4 h-4" />
        </div>
        <Select
          value={locomotive.id}
          onValueChange={(value) => {
            const loc = LOCOMOTIVES.find((l) => l.id === value);
            if (loc) onUpdateWorkflow({ locomotive: loc });
          }}
        >
          <SelectTrigger className="bg-white border-gray-400 text-gray-600 pl-10">
            <SelectValue placeholder="Локомотив" />
          </SelectTrigger>
          <SelectContent>
            {LOCOMOTIVES.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Number of units */}
      <div className="relative" title="количество единиц">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
          <Hash className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            value={numberOfUnits}
            onChange={(e) =>
              onUpdateWorkflow({
                numberOfUnits: parseInt(e.target.value) || 1,
              })
            }
            className="bg-white border-gray-400 text-gray-600 pl-10"
          />
          <span className="text-gray-500 text-sm whitespace-nowrap">
            количество единиц
          </span>
        </div>
      </div>

      {/* Composition Section */}
      <div className="pt-2 border-t border-gray-300">
        <h3 className="text-sm text-gray-700 mb-3">Состав</h3>

        {/* Gross train mass */}
        <div
          className="relative mb-3"
          title="Масса состава, брутто, т."
        >
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <Weight className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              value={grossTrainMass}
              onChange={(e) =>
                onUpdateWorkflow({
                  grossTrainMass:
                    parseFloat(e.target.value) || 0,
                })
              }
              className="bg-white border-gray-400 text-gray-600 pl-10"
            />
            <span className="text-gray-500 text-sm whitespace-nowrap">
              Масса состава, брутто, т.
            </span>
          </div>
        </div>

        {/* Wagon Groups */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-gray-700">
              {`Группы вагонов (${wagonGroups.length})`}
            </Label>
            <Button
              size="sm"
              variant="ghost"
              title="Редактировать"
              onClick={() => setWagonGroupsModalOpen(true)}
              className="h-6 w-6 p-0 text-gray-500 hover:bg-gray-300 hover:text-gray-700"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Section Parameters */}
      <div className="pt-3 border-t border-gray-300 space-y-3">
        {/* Calculation Type */}
        <div className="relative" title="Тип расчета">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 z-10">
            <Route className="w-4 h-4" />
          </div>
          <Select
            value={calculationType}
            onValueChange={(value: any) =>
              onUpdateWorkflow({ calculationType: value })
            }
          >
            <SelectTrigger className="bg-white border-gray-400 text-gray-600 pl-10">
              <SelectValue placeholder="Тип расчета" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Действующий участок">
                Действующий участок
              </SelectItem>
              <SelectItem value="Designed Section">
                Проектируемый участок
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Departure Station Road */}
        <div
          className="relative"
          title="Дорога станции отправления"
        >
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 z-10">
            <Navigation className="w-4 h-4" />
          </div>
          <Select
            value={
              (departureRoad?.value ?? ROADS[0].value).toString()
            }
            onValueChange={(value) => {
              const road = ROADS.find(
                (r) => r.value.toString() === value,
              );
              if (road)
                onUpdateWorkflow({ departureRoad: road });
            }}
          >
            <SelectTrigger className="bg-white border-gray-400 text-gray-600 pl-10">
              <SelectValue placeholder="Дорога станции отправления" />
            </SelectTrigger>
            <SelectContent>
              {ROADS.map((road) => (
                <SelectItem
                  key={road.value}
                  value={road.value.toString()}
                >
                  {road.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Departure Station */}
        <div className="relative" title="Станция отправления">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 z-10">
            <MapPin className="w-4 h-4" />
          </div>
          <Select
            value={departureStation}
            onValueChange={(value) =>
              onUpdateWorkflow({ departureStation: value })
            }
          >
            <SelectTrigger className="bg-white border-gray-400 text-gray-600 pl-10">
              <SelectValue placeholder="Станция отправления" />
            </SelectTrigger>
            <SelectContent>
              {allStations.map((station) => (
                <SelectItem key={station} value={station}>
                  {station}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Arrival Station Road */}
        <div
          className="relative"
          title="Дорога станции прибытия"
        >
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 z-10">
            <Navigation className="w-4 h-4" />
          </div>
          <Select
            value={
              (arrivalRoad?.value ?? ROADS[0].value).toString()
            }
            onValueChange={(value) => {
              const road = ROADS.find(
                (r) => r.value.toString() === value,
              );
              if (road) onUpdateWorkflow({ arrivalRoad: road });
            }}
          >
            <SelectTrigger className="bg-white border-gray-400 text-gray-600 pl-10">
              <SelectValue placeholder="Дорога станции прибытия" />
            </SelectTrigger>
            <SelectContent>
              {ROADS.map((road) => (
                <SelectItem
                  key={road.value}
                  value={road.value.toString()}
                >
                  {road.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Arrival Station */}
        <div className="relative" title="Станция прибытия">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 z-10">
            <MapPin className="w-4 h-4" />
          </div>
          <Select
            value={arrivalStation}
            onValueChange={(value) =>
              onUpdateWorkflow({ arrivalStation: value })
            }
          >
            <SelectTrigger className="bg-white border-gray-400 text-gray-600 pl-10">
              <SelectValue placeholder="Станция прибытия" />
            </SelectTrigger>
            <SelectContent>
              {allStations.map((station) => (
                <SelectItem key={station} value={station}>
                  {station}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Travel time */}
        <div className="relative" title="Время хода, мин.">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              value={travelTime}
              onChange={(e) =>
                onUpdateWorkflow({
                  travelTime: parseInt(e.target.value) || 0,
                })
              }
              className="bg-white border-gray-400 text-gray-600 pl-10"
            />
            <span className="text-gray-500 text-sm whitespace-nowrap">
              Время хода, мин.
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-gray-700">
              {`Ограничения скорости (${customSpeedLimits.length})`}
            </Label>
            <Button
              size="sm"
              variant="ghost"
              title="Редактировать"
              onClick={() => setSpeedLimitsModalOpen(true)}
              className="h-6 w-6 p-0 text-gray-500 hover:bg-gray-300 hover:text-gray-700"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Form button */}
        <Button
          onClick={handleFormSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
          disabled={!departureStation || !arrivalStation}
        >
          Сформировать и рассчитать
        </Button>
      </div>

      {/* Wagon Groups Modal */}
      <Dialog
        open={wagonGroupsModalOpen}
        onOpenChange={setWagonGroupsModalOpen}
      >
        <DialogContent className="max-w-[65vw] max-h-[75vh] w-[65vw]" >
          <DialogHeader >
            <DialogTitle>Группы вагонов</DialogTitle>
            <DialogDescription>
              Добавьте или удалите группы вагонов для состава
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto max-h-[70vh]">
            {/* Existing wagon groups table */}
            <div className="border border-gray-300 rounded">
              <table className="w-full text-sm">
                <thead className="bg-white">
                  <tr>
                    <th className="text-left p-2 text-gray-500 bg-white border border-gray-400">
                      Наименование
                    </th>
                    <th className="text-left p-2 text-gray-500 bg-white border border-gray-400">
                      Количество
                    </th>
                    <th className="text-left p-2 text-gray-500 bg-white border border-gray-400">
                      Масса вагона, брутто, т.
                    </th>
                    <th className="text-left p-2 text-gray-500 bg-white border border-gray-400">
                      Действие
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wagonGroups.map((group) => (
                    <tr key={group.id} className="bg-white">
                      <td className="pl-4 text-gray-600 bg-white border border-gray-400 border" style={{paddingLeft: 12}}>
                        {group.wagonType}
                      </td>
                      <td className="pl-4 text-gray-600 bg-white border-gray-400 border" style={{paddingLeft: 12}}>
                        {group.quantity}
                      </td>
                      <td className="pl-4 text-gray-600 bg-white border-gray-400 border" style={{paddingLeft: 12}}>
                        {group.mass}
                      </td>
                      <td className="p-2 border-gray-400 border" style={{textAlign: 'center'}}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleRemoveWagonGroup(group.id)
                          }
                          title="Удалить"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {/* Add new row */}
                  <tr className="bg-gray-50">
                    <td className="bg-white border border-gray-400">
                      <Select
                        value={newWagonType}
                        onValueChange={setNewWagonType}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="Выбор вагона" />
                        </SelectTrigger>
                        <SelectContent>
                          {WAGON_TYPES.map((wagon) => (
                            <SelectItem
                              key={wagon.name}
                              value={wagon.name}
                            >
                              {wagon.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="bg-white border border-gray-400" style={{paddingLeft: 4}}>
                      <Input
                        type="number"
                        min="1"
                        value={newWagonQuantity}
                        onChange={(e) =>
                          setNewWagonQuantity(
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="h-9 bg-white"
                        style={{borderRadius: 0, boxShadow: 'none', border: 'none'}}
                      />
                    </td>
                    <td className="bg-white border border-gray-400" style={{paddingLeft: 4}}>
                      <Input
                        type="number"
                        min="0"
                        value={newWagonMass}
                        onChange={(e) =>
                          setNewWagonMass(
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="h-9 bg-white"
                        style={{borderRadius: 0, boxShadow: 'none', border: 'none'}}
                      />
                    </td>
                    <td className="bg-white border border-gray-400 p-1" style={{textAlign: 'center'}}>
                      <Button
                        size="sm"
                        onClick={handleAddWagonGroup}
                        disabled={!newWagonType}
                        title="Добавить"
                        className="h-9 bg-blue-600 hover:bg-blue-700"

                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Speed Limits Modal */}
      <Dialog
        open={speedLimitsModalOpen}
        onOpenChange={setSpeedLimitsModalOpen}
      >
        <DialogContent className="max-w-[65vw] max-h-[75vh] w-[65vw]" >
          <DialogHeader>
            <DialogTitle style={{color: '#374151 !important'}} className="text-grey-700">Ограничения скорости</DialogTitle>
            <DialogDescription>
              Добавьте или удалите ограничения скорости для
              участка
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto max-h-[70vh]">
            <div className="border border-gray-300 rounded">
              <table className="w-full text-sm">
                <thead className="bg-white ">
                  <tr>
                    <th className="text-left p-2 text-gray-600 bg-white border border-gray-400">
                      Кордината начала ограничения
                    </th>
                    <th className="text-left p-2 text-gray-600 bg-white border border-gray-400">
                      Кордината конца ограничения
                    </th>
                    <th className="text-left p-2 text-gray-600 bg-white border border-gray-400">
                      Допустимое значение скорости, км/ч
                    </th>
                    <th className="text-left p-2 text-gray-600 bg-white border border-gray-400">
                      Действие
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customSpeedLimits.map((limit) => (
                    <tr key={limit.id} className="bg-white">
                      <td className="text-gray-600 bg-white border border-gray-400" style={{paddingLeft: 12}}>
                        {limit.startCoord}
                      </td>
                      <td className="text-gray-600 bg-white border border-gray-400" style={{paddingLeft: 12}}>
                        {limit.endCoord}
                      </td>
                      <td className="text-gray-600 bg-white border border-gray-400" style={{paddingLeft: 12}}>
                        {limit.allowedSpeed}
                      </td>
                      <td className="p-2 bg-white border border-gray-400" style={{textAlign: 'center'}}>
                        <Button
                          size="sm"
                          title="Удалить"
                          variant="ghost"
                          onClick={() =>
                            handleRemoveSpeedLimit(limit.id)
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          style={{textAlign: 'center'}}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {/* Add new row */}
                  <tr className="bg-gray-50" >
                    <td className="bg-white border border-gray-400" style={{paddingLeft: 4}}>
                      <Input
                        type="number"
                        min="0"
                        value={newSpeedStartCoord}
                        onChange={(e) =>
                          setNewSpeedStartCoord(
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="h-9 bg-white pl-4 mr-4"
                        style={{borderRadius: 0, boxShadow: 'none', border: 'none'}}
                      />
                    </td>
                    <td className="bg-white border border-gray-400" style={{paddingLeft: 4}}>
                      <Input
                        type="number"
                        min="0"
                        value={newSpeedEndCoord}
                        onChange={(e) =>
                          setNewSpeedEndCoord(
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="h-9 bg-white pl-4 mr-4"
                        style={{borderRadius: 0, boxShadow: 'none', border: 'none'}}
                      />
                    </td>
                    <td className="bg-white border border-gray-400" style={{paddingLeft: 4}}>
                      <Input
                        type="number"
                        min="0"
                        value={newSpeedLimit}
                        onChange={(e) =>
                          setNewSpeedLimit(
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="h-9 bg-white pl-4 mr-4"
                        style={{borderRadius: 0, boxShadow: 'none', border: 'none'}}
                      />
                    </td>
                    <td className="p-2 bg-white border border-gray-400" style={{textAlign: 'center'}}>
                      <Button
                        size="sm"
                        onClick={handleAddSpeedLimit}
                        className="h-9 bg-blue-600 hover:bg-blue-700"
                        title="Добавить"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}