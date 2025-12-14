// Data structures for the locomotive regime chart

export interface TrackSegment {
  id: string;
  startCoord: number;
  endCoord: number;
  stationName: string;
}

export interface SpeedLimit {
  id: string;
  startCoord: number;
  endCoord: number;
  limitValue: number;
}

export interface PathProfile {
  id: string;
  startCoord: number;
  endCoord: number;
  slopePromille: number;
}

export interface CanvasObject {
  id: string;
  type:
    | "signal"
    | "switch"
    | "crossing"
    | "tunnel"
    | "bridge"
    | "viaduct"
    | "neutral-section";
  subtype?: string;
  label?: string;
  x: number;
  y: number;
  data?: any;
}

// NEW: Workflow-related types
export interface TrackSection {
  id: string;
  name: string;
  length: number; // km
  speedLimits: SpeedLimit[];
  pathProfiles: PathProfile[];
  stations: TrackSegment[]; // Station names and positions
}

export interface Locomotive {
  id: string;
  name: string;
  tractionModes: TractionMode[];
  length: number;
  mass: number;
}

export interface TractionMode {
  id: string;
  label: string;
  lineStyle: "solid" | "dashed" | "dotted";
  color: string;
}

export interface TrainComposition {
  id: string;
  name: string;
  wagons: { type: string; quantity: number }[];
}

export interface RegimeArrow {
  id: string;
  modeId: string;
  startKm: number;
  endKm: number;
}

export type OperationMode =
  | "acceleration" // разгон (blue)
  | "stable" // стабильная скорость (yellow)
  | "coasting" // выбег (green)
  | "braking" // торможение (red)
  | "limit-traction" // огр. скор. (тяга) (purple)
  | "limit-braking"; // огр. скор. (торм.) (orange)

export interface OperationModeSegment {
  startKm: number;
  endKm: number;
  mode: OperationMode;
}

export interface WagonGroup {
  id: string;
  wagonType: string;
  quantity: number;
  mass: number;
}

export interface CustomSpeedLimit {
  id: string;
  startCoord: number;
  endCoord: number;
  allowedSpeed: number;
}

export interface WorkflowState {
  currentStage: 1 | 2 | 3;
  // Calculation Task Parameters
  scale?: "1:1" | "1:5" | "1:10" | "1:50" | "1:100";
  initialCanvasScale?: number; // pixels per km based on scale selection
  movementType?: "Not selected" | "Freight" | "Passenger";
  tractionType?: "Electric Traction" | "Diesel Traction";
  numberOfUnits?: number;
  grossTrainMass?: number;
  wagonGroups?: WagonGroup[];
  // Section Parameters
  calculationType?: "Existing Section" | "Designed Section";
  departureRoad?: { value: number; name: string };
  departureStation?: string;
  arrivalRoad?: { value: number; name: string };
  arrivalStation?: string;
  travelTime?: number;
  dateRange?: { from: Date | null; to: Date | null };
  customSpeedLimits?: CustomSpeedLimit[];
  // Original workflow fields
  trackSection?: TrackSection;
  locomotive?: Locomotive;
  trainComposition?: TrainComposition | "none" | "custom";
  customComposition?: { type: string; quantity: number }[];
  optimalSpeedCurve?: { km: number; speed: number }[];
  regimeArrows?: RegimeArrow[];
  actualSpeedCurve?: { km: number; speed: number }[];
}

export interface ChartData {
  id: string;
  title: string;
  trackSegments: TrackSegment[];
  speedLimits: SpeedLimit[];
  pathProfiles: PathProfile[];
  canvasObjects: CanvasObject[];
  // NEW: Workflow state
  workflow?: WorkflowState;
  age?: "old";
}