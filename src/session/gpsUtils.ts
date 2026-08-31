import type * as Location from 'expo-location';

import type { ActiveSessionGpsState, GpsSample } from './models';

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

export function toGpsErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'GPS data unavailable. Please try again.';
}