import { describe, expect, it } from 'vitest';

import { applyDeveloperSimulationSnapshot } from './developerSimulation';
import { deriveDrivingEventDetectionState } from './eventDetectionState';
import type { DrivingEventDetectionSnapshot, DeveloperSimulationScenario } from './eventModels';
import { initialGpsTelemetrySummary } from './gpsUtils';
import { initialMotionTelemetrySummary } from './motionUtils';
import type { ActiveSessionGpsState, ActiveSessionMotionState, MotionStreamState } from './models';

const emptyGpsState: ActiveSessionGpsState = {
  status: 'recording',
  errorMessage: null,
  samples: [],
  sampleCount: 0,
  distanceMeters: 0,
  latestSpeedMps: null,
  latestAccuracyMeters: null,
  elapsedSeconds: 0,
  startedAtMs: null,
  telemetrySummary: initialGpsTelemetrySummary,
};

const emptyMotionStream: MotionStreamState = {
  status: 'recording',
  errorMessage: null,
  samples: [],
  sampleCount: 0,
  invalidSampleCount: 0,
  latestSample: null,
  latestMagnitude: null,
  peakMagnitude: 0,
  telemetrySummary: initialMotionTelemetrySummary,
};

const emptyMotionState: ActiveSessionMotionState = {
  accelerometer: emptyMotionStream,
  gyroscope: emptyMotionStream,
  startedAtMs: null,
};

function createSnapshot(scenario: DeveloperSimulationScenario): DrivingEventDetectionSnapshot {
  return {
    sessionId: 'session-dev',
    gpsState: emptyGpsState,
    motionState: emptyMotionState,
    developerSimulationScenario: scenario,
  };
}

describe('applyDeveloperSimulationSnapshot', () => {
  it('injects synthetic telemetry for hard braking', () => {
    const snapshot = applyDeveloperSimulationSnapshot(createSnapshot('hard_braking'));

    expect(snapshot.gpsState.sampleCount).toBeGreaterThanOrEqual(3);
    expect(snapshot.motionState.accelerometer.sampleCount).toBeGreaterThanOrEqual(8);
  });

  it('injects synthetic sparse telemetry for insufficient-session warnings', () => {
    const snapshot = applyDeveloperSimulationSnapshot(createSnapshot('session_data_insufficient'));

    expect(snapshot.gpsState.sampleCount).toBe(1);
    expect(snapshot.motionState.accelerometer.sampleCount).toBe(1);
    expect(snapshot.motionState.gyroscope.sampleCount).toBe(1);
  });
});

describe('developer simulation integration', () => {
  it('produces the requested simulated event or warning through the derived pipeline', () => {
    const scenarios: Array<{ scenario: DeveloperSimulationScenario; expectedType: string }> = [
      { scenario: 'hard_braking', expectedType: 'hard_braking' },
      { scenario: 'harsh_acceleration', expectedType: 'harsh_acceleration' },
      { scenario: 'lateral_instability', expectedType: 'lateral_instability' },
      { scenario: 'gps_quality_degraded', expectedType: 'gps_quality_degraded' },
      { scenario: 'sensor_data_gap', expectedType: 'sensor_data_gap' },
      { scenario: 'session_data_insufficient', expectedType: 'session_data_insufficient' },
    ];

    for (const entry of scenarios) {
      const state = deriveDrivingEventDetectionState(createSnapshot(entry.scenario));
      const allTypes = [...state.events, ...state.warnings].map((event) => event.eventType);

      expect(allTypes).toContain(entry.expectedType);
    }
  });
});