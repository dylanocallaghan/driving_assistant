import { detectDrivingEvents } from './detectDrivingEvents';
import { applyDeveloperSimulationSnapshot } from './developerSimulation';
import type { DrivingEventDetectionSnapshot, DrivingEventDetectionState } from './eventModels';

export const initialDrivingEventDetectionState: DrivingEventDetectionState = {
  status: 'idle',
  sessionId: null,
  events: [],
  warnings: [],
  eventCount: 0,
  warningCount: 0,
  developerSimulationScenario: null,
};

export function deriveDrivingEventDetectionState(snapshot: DrivingEventDetectionSnapshot): DrivingEventDetectionState {
  if (!snapshot.sessionId) {
    return initialDrivingEventDetectionState;
  }

  const effectiveSnapshot = applyDeveloperSimulationSnapshot(snapshot);
  const sessionId = effectiveSnapshot.sessionId ?? snapshot.sessionId;

  const result = detectDrivingEvents({
    sessionId,
    gpsState: effectiveSnapshot.gpsState,
    motionState: effectiveSnapshot.motionState,
  });

  return {
    status: 'detecting',
    sessionId,
    events: result.events,
    warnings: result.warnings,
    eventCount: result.events.length,
    warningCount: result.warnings.length,
    developerSimulationScenario: snapshot.developerSimulationScenario ?? null,
  };
}