import { describe, expect, it } from 'vitest';

import { detectDrivingEvents } from './detectDrivingEvents';
import type { DetectDrivingEventsInput } from './eventModels';
import { summarizeGpsSamples } from './gpsUtils';
import { summarizeMotionSamples } from './motionUtils';
import type { ActiveSessionGpsState, ActiveSessionMotionState, GpsSample, MotionSample, MotionStreamState } from './models';

function createGpsState(samples: GpsSample[]): ActiveSessionGpsState {
  return {
    status: 'recording',
    errorMessage: null,
    samples,
    sampleCount: samples.length,
    distanceMeters: 0,
    latestSpeedMps: samples[samples.length - 1]?.speedMps ?? null,
    latestAccuracyMeters: samples[samples.length - 1]?.accuracyMeters ?? null,
    elapsedSeconds: 12,
    startedAtMs: samples[0]?.timestamp ?? null,
    telemetrySummary: summarizeGpsSamples(samples),
  };
}

function createMotionStreamState(samples: MotionSample[]): MotionStreamState {
  return {
    status: 'recording',
    errorMessage: null,
    samples,
    sampleCount: samples.length,
    invalidSampleCount: 0,
    latestSample: samples[samples.length - 1] ?? null,
    latestMagnitude: samples[samples.length - 1]
      ? Math.sqrt(
          samples[samples.length - 1].x * samples[samples.length - 1].x +
            samples[samples.length - 1].y * samples[samples.length - 1].y +
            samples[samples.length - 1].z * samples[samples.length - 1].z,
        )
      : null,
    peakMagnitude: samples.reduce((peak, sample) => {
      const magnitude = Math.sqrt(sample.x * sample.x + sample.y * sample.y + sample.z * sample.z);
      return Math.max(peak, magnitude);
    }, 0),
    telemetrySummary: summarizeMotionSamples(samples, 0),
  };
}

function createMotionState(accelerometerSamples: MotionSample[], gyroscopeSamples: MotionSample[]): ActiveSessionMotionState {
  return {
    accelerometer: createMotionStreamState(accelerometerSamples),
    gyroscope: createMotionStreamState(gyroscopeSamples),
    startedAtMs: accelerometerSamples[0]?.timestamp ?? gyroscopeSamples[0]?.timestamp ?? null,
  };
}

function createInput(gpsSamples: GpsSample[], accelerometerSamples: MotionSample[], gyroscopeSamples: MotionSample[]): DetectDrivingEventsInput {
  return {
    sessionId: 'session-1',
    gpsState: createGpsState(gpsSamples),
    motionState: createMotionState(accelerometerSamples, gyroscopeSamples),
  };
}

describe('detectDrivingEvents', () => {
  it('detects hard braking from GPS speed drop plus accelerometer corroboration', () => {
    const result = detectDrivingEvents(
      createInput(
        [
          { timestamp: 0, latitude: 53.34, longitude: -6.26, accuracyMeters: 5, speedMps: 10 },
          { timestamp: 2000, latitude: 53.3401, longitude: -6.26, accuracyMeters: 5, speedMps: 7 },
          { timestamp: 3500, latitude: 53.34015, longitude: -6.26, accuracyMeters: 5, speedMps: 6.5 },
        ],
        [
          { timestamp: 500, x: 1, y: 0, z: 0 },
          { timestamp: 1000, x: 1.15, y: 0, z: 0 },
          { timestamp: 1500, x: 1.14, y: 0, z: 0 },
          { timestamp: 2000, x: 1.12, y: 0, z: 0 },
          { timestamp: 2500, x: 1.1, y: 0, z: 0 },
          { timestamp: 3000, x: 1, y: 0, z: 0 },
          { timestamp: 3500, x: 1, y: 0, z: 0 },
          { timestamp: 4000, x: 1, y: 0, z: 0 },
        ],
        Array.from({ length: 8 }, (_, index) => ({ timestamp: index * 500, x: 0, y: 0, z: 0.1 })),
      ),
    );

    expect(result.events.some((event) => event.eventType === 'hard_braking')).toBe(true);
  });

  it('detects harsh acceleration from GPS speed increase plus accelerometer corroboration', () => {
    const result = detectDrivingEvents(
      createInput(
        [
          { timestamp: 0, latitude: 53.34, longitude: -6.26, accuracyMeters: 5, speedMps: 3 },
          { timestamp: 1500, latitude: 53.34005, longitude: -6.26, accuracyMeters: 5, speedMps: 5.8 },
          { timestamp: 3000, latitude: 53.34015, longitude: -6.26, accuracyMeters: 5, speedMps: 6.2 },
        ],
        [
          { timestamp: 250, x: 1, y: 0, z: 0 },
          { timestamp: 750, x: 1.13, y: 0, z: 0 },
          { timestamp: 1250, x: 1.14, y: 0, z: 0 },
          { timestamp: 1750, x: 1.12, y: 0, z: 0 },
          { timestamp: 2250, x: 1.11, y: 0, z: 0 },
          { timestamp: 2750, x: 1.08, y: 0, z: 0 },
          { timestamp: 3250, x: 1, y: 0, z: 0 },
          { timestamp: 3750, x: 1, y: 0, z: 0 },
        ],
        Array.from({ length: 8 }, (_, index) => ({ timestamp: index * 500, x: 0, y: 0, z: 0.1 })),
      ),
    );

    expect(result.events.some((event) => event.eventType === 'harsh_acceleration')).toBe(true);
  });

  it('detects lateral instability from gyroscope, accelerometer, and GPS trajectory changes', () => {
    const result = detectDrivingEvents(
      createInput(
        [
          { timestamp: 0, latitude: 53.34, longitude: -6.26, accuracyMeters: 5, speedMps: 8 },
          { timestamp: 1500, latitude: 53.3401, longitude: -6.26, accuracyMeters: 5, speedMps: 8 },
          { timestamp: 3000, latitude: 53.3401, longitude: -6.2597, accuracyMeters: 5, speedMps: 8 },
          { timestamp: 4500, latitude: 53.3402, longitude: -6.2597, accuracyMeters: 5, speedMps: 8 },
          { timestamp: 6000, latitude: 53.3402, longitude: -6.2594, accuracyMeters: 5, speedMps: 8 },
        ],
        [
          { timestamp: 500, x: 1, y: 0, z: 0 },
          { timestamp: 1500, x: 1.1, y: 0, z: 0 },
          { timestamp: 2500, x: 1.09, y: 0, z: 0 },
          { timestamp: 3500, x: 1.11, y: 0, z: 0 },
          { timestamp: 4500, x: 1.1, y: 0, z: 0 },
          { timestamp: 5500, x: 1.09, y: 0, z: 0 },
          { timestamp: 6500, x: 1.02, y: 0, z: 0 },
          { timestamp: 7500, x: 1, y: 0, z: 0 },
        ],
        [
          { timestamp: 500, x: 0.1, y: 0, z: 0 },
          { timestamp: 1500, x: 0.4, y: 0, z: 0 },
          { timestamp: 2500, x: 0.38, y: 0, z: 0 },
          { timestamp: 3500, x: 0.45, y: 0, z: 0 },
          { timestamp: 4500, x: 0.42, y: 0, z: 0 },
          { timestamp: 5500, x: 0.37, y: 0, z: 0 },
          { timestamp: 6500, x: 0.1, y: 0, z: 0 },
          { timestamp: 7500, x: 0.1, y: 0, z: 0 },
        ],
      ),
    );

    expect(result.events.some((event) => event.eventType === 'lateral_instability')).toBe(true);
  });

  it('emits data-quality warnings when telemetry is sparse or degraded', () => {
    const result = detectDrivingEvents(
      createInput(
        [
          { timestamp: 0, latitude: 53.34, longitude: -6.26, accuracyMeters: 50, speedMps: 4 },
          { timestamp: 7000, latitude: 53.3401, longitude: -6.26, accuracyMeters: 60, speedMps: 4 },
        ],
        [{ timestamp: 0, x: 1, y: 0, z: 0 }],
        [{ timestamp: 0, x: 0.1, y: 0, z: 0 }],
      ),
    );

    expect(result.warnings.map((event) => event.eventType)).toEqual(
      expect.arrayContaining(['gps_quality_degraded', 'sensor_data_gap', 'session_data_insufficient']),
    );
  });
});