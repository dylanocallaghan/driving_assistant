import type { DrivingEventDetectionSnapshot, DeveloperSimulationScenario } from './eventModels';
import { summarizeGpsSamples } from './gpsUtils';
import { magnitudeFromMotionSample, summarizeMotionSamples } from './motionUtils';
import type { ActiveSessionGpsState, ActiveSessionMotionState, GpsSample, MotionSample, MotionStreamState } from './models';

export function applyDeveloperSimulationSnapshot(
  snapshot: DrivingEventDetectionSnapshot,
): DrivingEventDetectionSnapshot {
  if (!snapshot.sessionId || !snapshot.developerSimulationScenario) {
    return snapshot;
  }

  return buildScenarioSnapshot(snapshot, snapshot.developerSimulationScenario);
}

export function getDeveloperSimulationLabel(scenario: DeveloperSimulationScenario | null): string | null {
  switch (scenario) {
    case 'hard_braking':
      return 'Hard braking simulation';
    case 'harsh_acceleration':
      return 'Harsh acceleration simulation';
    case 'lateral_instability':
      return 'Lateral instability simulation';
    case 'gps_quality_degraded':
      return 'GPS degradation simulation';
    case 'sensor_data_gap':
      return 'Sensor data gap simulation';
    case 'session_data_insufficient':
      return 'Insufficient session data simulation';
    case null:
    default:
      return null;
  }
}

function buildScenarioSnapshot(
  snapshot: DrivingEventDetectionSnapshot,
  scenario: DeveloperSimulationScenario,
): DrivingEventDetectionSnapshot {
  const baseTimestamp = getBaseTimestamp(snapshot);

  switch (scenario) {
    case 'hard_braking':
      return {
        ...snapshot,
        gpsState: createGpsState([
          { timestamp: baseTimestamp, latitude: 53.34, longitude: -6.26, accuracyMeters: 5, speedMps: 12 },
          { timestamp: baseTimestamp + 1500, latitude: 53.34008, longitude: -6.26, accuracyMeters: 5, speedMps: 9 },
          { timestamp: baseTimestamp + 3000, latitude: 53.34014, longitude: -6.26, accuracyMeters: 5, speedMps: 8.5 },
        ]),
        motionState: createMotionState(
          createAccelerometerSeries(baseTimestamp, [1, 1.13, 1.16, 1.14, 1.11, 1.05, 1, 1]),
          createGyroscopeSeries(baseTimestamp, [0.1, 0.1, 0.08, 0.08, 0.06, 0.06, 0.05, 0.05]),
        ),
      };
    case 'harsh_acceleration':
      return {
        ...snapshot,
        gpsState: createGpsState([
          { timestamp: baseTimestamp, latitude: 53.34, longitude: -6.26, accuracyMeters: 5, speedMps: 3 },
          { timestamp: baseTimestamp + 1500, latitude: 53.34005, longitude: -6.26, accuracyMeters: 5, speedMps: 5.9 },
          { timestamp: baseTimestamp + 3000, latitude: 53.34014, longitude: -6.26, accuracyMeters: 5, speedMps: 6.3 },
        ]),
        motionState: createMotionState(
          createAccelerometerSeries(baseTimestamp, [1, 1.12, 1.14, 1.13, 1.11, 1.06, 1, 1]),
          createGyroscopeSeries(baseTimestamp, [0.1, 0.1, 0.08, 0.08, 0.06, 0.06, 0.05, 0.05]),
        ),
      };
    case 'lateral_instability':
      return {
        ...snapshot,
        gpsState: createGpsState([
          { timestamp: baseTimestamp, latitude: 53.34, longitude: -6.26, accuracyMeters: 5, speedMps: 8 },
          { timestamp: baseTimestamp + 1500, latitude: 53.3401, longitude: -6.26, accuracyMeters: 5, speedMps: 8 },
          { timestamp: baseTimestamp + 3000, latitude: 53.3401, longitude: -6.2597, accuracyMeters: 5, speedMps: 8 },
          { timestamp: baseTimestamp + 4500, latitude: 53.3402, longitude: -6.2597, accuracyMeters: 5, speedMps: 8 },
          { timestamp: baseTimestamp + 6000, latitude: 53.3402, longitude: -6.2594, accuracyMeters: 5, speedMps: 8 },
        ]),
        motionState: createMotionState(
          createAccelerometerSeries(baseTimestamp, [1, 1.1, 1.09, 1.11, 1.1, 1.09, 1.02, 1]),
          createGyroscopeSeries(baseTimestamp, [0.1, 0.4, 0.38, 0.45, 0.42, 0.37, 0.1, 0.1]),
        ),
      };
    case 'gps_quality_degraded':
      return {
        ...snapshot,
        gpsState: createGpsState([
          { timestamp: baseTimestamp, latitude: 53.34, longitude: -6.26, accuracyMeters: 5, speedMps: 6 },
          { timestamp: baseTimestamp + 1000, latitude: 53.34004, longitude: -6.26, accuracyMeters: 12, speedMps: 6.1 },
          { timestamp: baseTimestamp + 2000, latitude: 53.34008, longitude: -6.26, accuracyMeters: 52, speedMps: 6.2 },
        ]),
        motionState: createMotionState(
          createAccelerometerSeries(baseTimestamp, [1, 1.01, 1, 1.02, 1, 1.01, 1, 1]),
          createGyroscopeSeries(baseTimestamp, [0.05, 0.05, 0.04, 0.04, 0.03, 0.03, 0.03, 0.03]),
        ),
      };
    case 'sensor_data_gap':
      return {
        ...snapshot,
        gpsState: createGpsState([
          { timestamp: baseTimestamp, latitude: 53.34, longitude: -6.26, accuracyMeters: 5, speedMps: 6 },
          { timestamp: baseTimestamp + 7000, latitude: 53.34012, longitude: -6.26, accuracyMeters: 5, speedMps: 6.1 },
          { timestamp: baseTimestamp + 8000, latitude: 53.34018, longitude: -6.26, accuracyMeters: 5, speedMps: 6.2 },
        ]),
        motionState: createMotionState(
          [
            { timestamp: baseTimestamp, x: 1, y: 0, z: 0 },
            { timestamp: baseTimestamp + 250, x: 1, y: 0, z: 0 },
            { timestamp: baseTimestamp + 500, x: 1, y: 0, z: 0 },
            { timestamp: baseTimestamp + 750, x: 1, y: 0, z: 0 },
            { timestamp: baseTimestamp + 2000, x: 1, y: 0, z: 0 },
            { timestamp: baseTimestamp + 2250, x: 1, y: 0, z: 0 },
            { timestamp: baseTimestamp + 2500, x: 1, y: 0, z: 0 },
            { timestamp: baseTimestamp + 2750, x: 1, y: 0, z: 0 },
          ],
          [
            { timestamp: baseTimestamp, x: 0.05, y: 0, z: 0 },
            { timestamp: baseTimestamp + 250, x: 0.05, y: 0, z: 0 },
            { timestamp: baseTimestamp + 500, x: 0.05, y: 0, z: 0 },
            { timestamp: baseTimestamp + 750, x: 0.05, y: 0, z: 0 },
            { timestamp: baseTimestamp + 2000, x: 0.05, y: 0, z: 0 },
            { timestamp: baseTimestamp + 2250, x: 0.05, y: 0, z: 0 },
            { timestamp: baseTimestamp + 2500, x: 0.05, y: 0, z: 0 },
            { timestamp: baseTimestamp + 2750, x: 0.05, y: 0, z: 0 },
          ],
        ),
      };
    case 'session_data_insufficient':
      return {
        ...snapshot,
        gpsState: createGpsState([
          { timestamp: baseTimestamp, latitude: 53.34, longitude: -6.26, accuracyMeters: 5, speedMps: 4 },
        ]),
        motionState: createMotionState(
          [{ timestamp: baseTimestamp, x: 1, y: 0, z: 0 }],
          [{ timestamp: baseTimestamp, x: 0.05, y: 0, z: 0 }],
        ),
      };
    default:
      return snapshot;
  }
}

function createGpsState(samples: GpsSample[]): ActiveSessionGpsState {
  return {
    status: 'recording',
    errorMessage: null,
    samples,
    sampleCount: samples.length,
    distanceMeters: 0,
    latestSpeedMps: samples[samples.length - 1]?.speedMps ?? null,
    latestAccuracyMeters: samples[samples.length - 1]?.accuracyMeters ?? null,
    elapsedSeconds: Math.max(0, Math.floor((samples[samples.length - 1]?.timestamp ?? 0 - (samples[0]?.timestamp ?? 0)) / 1000)),
    startedAtMs: samples[0]?.timestamp ?? null,
    telemetrySummary: summarizeGpsSamples(samples),
  };
}

function createMotionState(accelerometerSamples: MotionSample[], gyroscopeSamples: MotionSample[]): ActiveSessionMotionState {
  return {
    accelerometer: createMotionStreamState(accelerometerSamples),
    gyroscope: createMotionStreamState(gyroscopeSamples),
    startedAtMs: accelerometerSamples[0]?.timestamp ?? gyroscopeSamples[0]?.timestamp ?? null,
  };
}

function createMotionStreamState(samples: MotionSample[]): MotionStreamState {
  const latestSample = samples[samples.length - 1] ?? null;

  return {
    status: 'recording',
    errorMessage: null,
    samples,
    sampleCount: samples.length,
    invalidSampleCount: 0,
    latestSample,
    latestMagnitude: latestSample ? magnitudeFromMotionSample(latestSample) : null,
    peakMagnitude: samples.reduce((peak, sample) => {
      return Math.max(peak, magnitudeFromMotionSample(sample));
    }, 0),
    telemetrySummary: summarizeMotionSamples(samples, 0),
  };
}

function createAccelerometerSeries(baseTimestamp: number, magnitudes: number[]): MotionSample[] {
  return magnitudes.map((magnitude, index) => ({
    timestamp: baseTimestamp + index * 250,
    x: magnitude,
    y: 0,
    z: 0,
  }));
}

function createGyroscopeSeries(baseTimestamp: number, magnitudes: number[]): MotionSample[] {
  return magnitudes.map((magnitude, index) => ({
    timestamp: baseTimestamp + index * 250,
    x: magnitude,
    y: 0,
    z: 0,
  }));
}

function getBaseTimestamp(snapshot: DrivingEventDetectionSnapshot): number {
  return Math.max(
    snapshot.gpsState.samples[snapshot.gpsState.samples.length - 1]?.timestamp ?? 0,
    snapshot.motionState.accelerometer.samples[snapshot.motionState.accelerometer.samples.length - 1]?.timestamp ?? 0,
    snapshot.motionState.gyroscope.samples[snapshot.motionState.gyroscope.samples.length - 1]?.timestamp ?? 0,
    snapshot.gpsState.startedAtMs ?? 0,
    snapshot.motionState.startedAtMs ?? 0,
    Date.now(),
  ) + 1000;
}