import type { ActiveSessionGpsState, ActiveSessionMotionState } from './models';

export type DrivingEventType =
  | 'hard_braking'
  | 'harsh_acceleration'
  | 'lateral_instability'
  | 'gps_quality_degraded'
  | 'sensor_data_gap'
  | 'session_data_insufficient';

export type DeveloperSimulationScenario = DrivingEventType;

export type DrivingEventCategory = 'Vehicle Control' | 'Vehicle Stability' | 'Assessment Coverage';

export type DrivingEventSeverity = 'informational' | 'minor' | 'moderate' | 'severe';

export type DrivingEventStatus = 'MVP';

export type DrivingEventSource = 'gps' | 'accelerometer' | 'gyroscope';

export type DrivingEvent = {
  eventId: DrivingEventType;
  sessionId: string;
  eventType: DrivingEventType;
  category: DrivingEventCategory;
  startTime: number;
  endTime: number;
  severity: DrivingEventSeverity;
  confidence: number;
  source: DrivingEventSource[];
  requiredData: DrivingEventSource[];
  evidence: Record<string, boolean | number | string | null>;
  detectionMethod: string;
  detectorVersion: string;
  status: DrivingEventStatus;
  scoringEnabled: boolean;
};

export type DetectDrivingEventsInput = {
  sessionId: string;
  gpsState: ActiveSessionGpsState;
  motionState: ActiveSessionMotionState;
};

export type DetectDrivingEventsResult = {
  events: DrivingEvent[];
  warnings: DrivingEvent[];
};

export type DrivingEventDetectionState = {
  status: 'idle' | 'detecting';
  sessionId: string | null;
  events: DrivingEvent[];
  warnings: DrivingEvent[];
  eventCount: number;
  warningCount: number;
  developerSimulationScenario: DeveloperSimulationScenario | null;
};

export type DrivingEventDetectionSnapshot = {
  sessionId: string | null;
  gpsState: ActiveSessionGpsState;
  motionState: ActiveSessionMotionState;
  developerSimulationScenario?: DeveloperSimulationScenario | null;
};