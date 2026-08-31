import { describe, expect, it } from 'vitest';

import { createCompletedDrivingSession } from './completedSession';
import type { DrivingEventDetectionState } from './eventModels';
import { initialGpsTelemetrySummary } from './gpsUtils';
import { initialMotionTelemetrySummary } from './motionUtils';
import type { ActiveSessionGpsState, ActiveSessionMotionState, MotionStreamState } from './models';

const baseGpsState: ActiveSessionGpsState = {
  status: 'stopped',
  errorMessage: null,
  samples: [{ timestamp: 1, latitude: 53.34, longitude: -6.26, accuracyMeters: 5, speedMps: 7 }],
  sampleCount: 1,
  distanceMeters: 12,
  latestSpeedMps: 7,
  latestAccuracyMeters: 5,
  elapsedSeconds: 10,
  startedAtMs: 1,
  telemetrySummary: {
    ...initialGpsTelemetrySummary,
    latestLocation: { latitude: 53.34, longitude: -6.26 },
    validSpeedSampleCount: 1,
    maxRecordedSpeedMps: 7,
    averageRecordedSpeedMps: 7,
  },
};

const baseMotionStream: MotionStreamState = {
  status: 'stopped',
  errorMessage: null,
  samples: [{ timestamp: 1, x: 1, y: 0, z: 0 }],
  sampleCount: 1,
  invalidSampleCount: 0,
  latestSample: { timestamp: 1, x: 1, y: 0, z: 0 },
  latestMagnitude: 1,
  peakMagnitude: 1,
  telemetrySummary: {
    ...initialMotionTelemetrySummary,
    averageMagnitude: 1,
    latestTimestamp: 1,
    validSampleCount: 1,
  },
};

const baseMotionState: ActiveSessionMotionState = {
  accelerometer: baseMotionStream,
  gyroscope: baseMotionStream,
  startedAtMs: 1,
};

const baseEventDetectionState: Pick<DrivingEventDetectionState, 'events' | 'warnings'> = {
  events: [
    {
      category: 'Vehicle Control',
      confidence: 0.8,
      detectionMethod: 'test',
      detectorVersion: '1',
      endTime: 2,
      eventId: 'hard_braking',
      eventType: 'hard_braking',
      evidence: { speedDropMps: 2.5 },
      requiredData: ['gps', 'accelerometer'],
      scoringEnabled: false,
      sessionId: 'session-1',
      severity: 'minor',
      source: ['gps', 'accelerometer'],
      startTime: 1,
      status: 'MVP',
    },
  ],
  warnings: [],
};

describe('createCompletedDrivingSession', () => {
  it('creates a completed session artifact with copied telemetry and events', () => {
    const result = createCompletedDrivingSession({
      endedAt: '2026-08-31T10:01:00.000Z',
      eventDetectionState: baseEventDetectionState,
      gpsState: baseGpsState,
      motionState: baseMotionState,
      sessionId: 'session-1',
      startedAt: '2026-08-31T10:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.session.id).toBe('session-1');
    expect(result.session.gps.samples).toEqual(baseGpsState.samples);
    expect(result.session.motion.accelerometer.samples).toEqual(baseMotionState.accelerometer.samples);
    expect(result.session.eventDetection.events).toEqual(baseEventDetectionState.events);

    baseGpsState.samples[0].latitude = 0;
    expect(result.session.gps.samples[0].latitude).toBe(53.34);
  });

  it('rejects invalid timestamps', () => {
    const result = createCompletedDrivingSession({
      endedAt: 'invalid',
      eventDetectionState: baseEventDetectionState,
      gpsState: baseGpsState,
      motionState: baseMotionState,
      sessionId: 'session-1',
      startedAt: '2026-08-31T10:00:00.000Z',
    });

    expect(result).toEqual({
      ok: false,
      message: 'Unable to save session. Session timestamps are invalid.',
    });
  });

  it('rejects an empty session identifier', () => {
    const result = createCompletedDrivingSession({
      endedAt: '2026-08-31T10:01:00.000Z',
      eventDetectionState: baseEventDetectionState,
      gpsState: baseGpsState,
      motionState: baseMotionState,
      sessionId: ' ',
      startedAt: '2026-08-31T10:00:00.000Z',
    });

    expect(result).toEqual({
      ok: false,
      message: 'Unable to save session. Session identifier is missing.',
    });
  });
});