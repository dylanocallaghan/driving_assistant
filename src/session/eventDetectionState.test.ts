import { describe, expect, it } from 'vitest';

import { deriveDrivingEventDetectionState, initialDrivingEventDetectionState } from './eventDetectionState';
import type { DrivingEventDetectionSnapshot } from './eventModels';
import type { ActiveSessionGpsState, ActiveSessionMotionState, MotionStreamState } from './models';

const emptyGpsState: ActiveSessionGpsState = {
  status: 'idle',
  errorMessage: null,
  samples: [],
  sampleCount: 0,
  distanceMeters: 0,
  latestSpeedMps: null,
  latestAccuracyMeters: null,
  elapsedSeconds: 0,
  startedAtMs: null,
};

const emptyMotionStream: MotionStreamState = {
  status: 'idle',
  errorMessage: null,
  samples: [],
  sampleCount: 0,
  latestSample: null,
  latestMagnitude: null,
  peakMagnitude: 0,
};

const emptyMotionState: ActiveSessionMotionState = {
  accelerometer: emptyMotionStream,
  gyroscope: emptyMotionStream,
  startedAtMs: null,
};

function createSnapshot(overrides: Partial<DrivingEventDetectionSnapshot>): DrivingEventDetectionSnapshot {
  return {
    sessionId: null,
    gpsState: emptyGpsState,
    motionState: emptyMotionState,
    ...overrides,
  };
}

describe('deriveDrivingEventDetectionState', () => {
  it('returns the initial idle state when there is no active session', () => {
    expect(deriveDrivingEventDetectionState(createSnapshot({ sessionId: null }))).toEqual(initialDrivingEventDetectionState);
  });

  it('returns a detecting state with warnings for a fresh session with insufficient telemetry', () => {
    const state = deriveDrivingEventDetectionState(createSnapshot({ sessionId: 'session-a' }));

    expect(state.status).toBe('detecting');
    expect(state.sessionId).toBe('session-a');
    expect(state.warningCount).toBeGreaterThan(0);
    expect(state.developerSimulationScenario).toBeNull();
  });

  it('resets cleanly when a session stops and restarts with a new session id', () => {
    const activeState = deriveDrivingEventDetectionState(createSnapshot({ sessionId: 'session-a' }));
    const stoppedState = deriveDrivingEventDetectionState(createSnapshot({ sessionId: null }));
    const restartedState = deriveDrivingEventDetectionState(createSnapshot({ sessionId: 'session-b' }));

    expect(activeState.sessionId).toBe('session-a');
    expect(stoppedState).toEqual(initialDrivingEventDetectionState);
    expect(restartedState.sessionId).toBe('session-b');
    expect(restartedState.events).toEqual([]);
  });

  it('routes a developer hard braking simulation through the same derived detection state', () => {
    const state = deriveDrivingEventDetectionState(
      createSnapshot({
        sessionId: 'session-dev',
        developerSimulationScenario: 'hard_braking',
      }),
    );

    expect(state.developerSimulationScenario).toBe('hard_braking');
    expect(state.events.some((event) => event.eventType === 'hard_braking')).toBe(true);
  });

  it('clears simulated output when developer simulation is removed', () => {
    const simulatedState = deriveDrivingEventDetectionState(
      createSnapshot({
        sessionId: 'session-dev',
        developerSimulationScenario: 'sensor_data_gap',
      }),
    );
    const clearedState = deriveDrivingEventDetectionState(
      createSnapshot({
        sessionId: 'session-dev',
        developerSimulationScenario: null,
      }),
    );

    expect(simulatedState.warningCount).toBeGreaterThan(0);
    expect(clearedState.developerSimulationScenario).toBeNull();
  });
});