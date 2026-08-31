import type * as Location from 'expo-location';

import type { ActiveSessionGpsState, GpsSample, GpsTelemetrySummary } from './models';

export const initialGpsTelemetrySummary: GpsTelemetrySummary = {
  latestLocation: null,
  validSpeedSampleCount: 0,
  invalidSpeedSampleCount: 0,
  maxRecordedSpeedMps: null,
  averageRecordedSpeedMps: null,
  largestSampleGapMs: 0,
};

export const initialGpsState: ActiveSessionGpsState = {
  status: 'idle',
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

export function calculateElapsedSeconds(startedAtMs: number | null, nowMs: number = Date.now()): number {
  if (!startedAtMs) {
    return 0;
  }

  return Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
}

export function normalizeGpsAccuracyMeters(accuracy: number | null | undefined): number | null {
  return typeof accuracy === 'number' && Number.isFinite(accuracy) ? accuracy : null;
}

export function normalizeGpsSpeedMps(speed: number | null | undefined): number | null {
  return typeof speed === 'number' && Number.isFinite(speed) && speed >= 0 ? speed : null;
}

export function toGpsSample(location: Pick<Location.LocationObject, 'coords'>, timestamp: number = Date.now()): GpsSample {
  return {
    timestamp,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracyMeters: normalizeGpsAccuracyMeters(location.coords.accuracy),
    speedMps: normalizeGpsSpeedMps(location.coords.speed),
  };
}

export function summarizeGpsSamples(samples: GpsSample[]): GpsTelemetrySummary {
  if (samples.length === 0) {
    return initialGpsTelemetrySummary;
  }

  let validSpeedSampleCount = 0;
  let invalidSpeedSampleCount = 0;
  let speedSumMps = 0;
  let maxRecordedSpeedMps: number | null = null;
  let largestSampleGapMs = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];

    if (sample.speedMps === null) {
      invalidSpeedSampleCount += 1;
    } else {
      validSpeedSampleCount += 1;
      speedSumMps += sample.speedMps;
      maxRecordedSpeedMps = maxRecordedSpeedMps === null ? sample.speedMps : Math.max(maxRecordedSpeedMps, sample.speedMps);
    }

    if (index > 0) {
      largestSampleGapMs = Math.max(largestSampleGapMs, sample.timestamp - samples[index - 1].timestamp);
    }
  }

  const latestSample = samples[samples.length - 1];

  return {
    latestLocation: {
      latitude: latestSample.latitude,
      longitude: latestSample.longitude,
    },
    validSpeedSampleCount,
    invalidSpeedSampleCount,
    maxRecordedSpeedMps,
    averageRecordedSpeedMps: validSpeedSampleCount > 0 ? speedSumMps / validSpeedSampleCount : null,
    largestSampleGapMs,
  };
}

export function toGpsErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'GPS data unavailable. Please try again.';
}