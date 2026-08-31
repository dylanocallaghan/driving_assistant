import { describe, expect, it } from 'vitest';

import {
  calculateElapsedSeconds,
  initialGpsState,
  initialGpsTelemetrySummary,
  normalizeGpsAccuracyMeters,
  normalizeGpsSpeedMps,
  summarizeGpsSamples,
  toGpsErrorMessage,
  toGpsSample,
} from './gpsUtils';

describe('initialGpsState', () => {
  it('starts idle with no captured telemetry', () => {
    expect(initialGpsState.status).toBe('idle');
    expect(initialGpsState.sampleCount).toBe(0);
    expect(initialGpsState.latestSpeedMps).toBeNull();
    expect(initialGpsState.telemetrySummary).toEqual(initialGpsTelemetrySummary);
  });
});

describe('calculateElapsedSeconds', () => {
  it('returns zero when a session has not started', () => {
    expect(calculateElapsedSeconds(null, 5000)).toBe(0);
  });

  it('returns whole elapsed seconds for an active session', () => {
    expect(calculateElapsedSeconds(1000, 4500)).toBe(3);
  });
});

describe('normalizeGpsAccuracyMeters', () => {
  it('preserves finite accuracy values', () => {
    expect(normalizeGpsAccuracyMeters(12.5)).toBe(12.5);
  });

  it('normalizes invalid accuracy values to null', () => {
    expect(normalizeGpsAccuracyMeters(Number.NaN)).toBeNull();
    expect(normalizeGpsAccuracyMeters(undefined)).toBeNull();
  });
});

describe('normalizeGpsSpeedMps', () => {
  it('preserves valid non-negative finite speed values', () => {
    expect(normalizeGpsSpeedMps(0)).toBe(0);
    expect(normalizeGpsSpeedMps(6.8)).toBe(6.8);
  });

  it('normalizes negative or invalid speed values to null', () => {
    expect(normalizeGpsSpeedMps(-1)).toBeNull();
    expect(normalizeGpsSpeedMps(Number.NaN)).toBeNull();
    expect(normalizeGpsSpeedMps(undefined)).toBeNull();
  });
});

describe('toGpsSample', () => {
  it('maps valid GPS telemetry into a normalized sample', () => {
    expect(
      toGpsSample(
        {
          coords: {
            accuracy: 8,
            latitude: 53.34,
            longitude: -6.26,
            speed: 5.5,
          },
        } as never,
        123,
      ),
    ).toEqual({
      timestamp: 123,
      latitude: 53.34,
      longitude: -6.26,
      accuracyMeters: 8,
      speedMps: 5.5,
    });
  });

  it('normalizes invalid accuracy and negative speed in GPS samples', () => {
    expect(
      toGpsSample(
        {
          coords: {
            accuracy: Number.NaN,
            latitude: 53.34,
            longitude: -6.26,
            speed: -1,
          },
        } as never,
        456,
      ),
    ).toEqual({
      timestamp: 456,
      latitude: 53.34,
      longitude: -6.26,
      accuracyMeters: null,
      speedMps: null,
    });
  });
});

describe('toGpsErrorMessage', () => {
  it('returns the original error message when available', () => {
    expect(toGpsErrorMessage(new Error('gps failed'))).toBe('gps failed');
  });

  it('returns a fallback message for unknown errors', () => {
    expect(toGpsErrorMessage('gps failed')).toBe('GPS data unavailable. Please try again.');
  });
});

describe('summarizeGpsSamples', () => {
  it('returns the initial summary for empty samples', () => {
    expect(summarizeGpsSamples([])).toEqual(initialGpsTelemetrySummary);
  });

  it('summarizes location continuity and speed availability for scored-session inputs', () => {
    expect(
      summarizeGpsSamples([
        { timestamp: 1000, latitude: 53.34, longitude: -6.26, accuracyMeters: 7, speedMps: 5 },
        { timestamp: 2500, latitude: 53.34005, longitude: -6.25995, accuracyMeters: 8, speedMps: null },
        { timestamp: 5000, latitude: 53.3401, longitude: -6.2599, accuracyMeters: 9, speedMps: 7 },
      ]),
    ).toEqual({
      latestLocation: {
        latitude: 53.3401,
        longitude: -6.2599,
      },
      validSpeedSampleCount: 2,
      invalidSpeedSampleCount: 1,
      maxRecordedSpeedMps: 7,
      averageRecordedSpeedMps: 6,
      largestSampleGapMs: 2500,
    });
  });
});