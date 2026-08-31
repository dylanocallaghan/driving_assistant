import { describe, expect, it } from 'vitest';

import {
  canStartMotionRecording,
  formatMotionAxes,
  formatMotionMagnitude,
  initialMotionTelemetrySummary,
  magnitudeFromMotionSample,
  normalizeMotionAxisValue,
  summarizeMotionSamples,
  toMotionSample,
} from './motionUtils';

describe('canStartMotionRecording', () => {
  it('returns true when no subscriptions exist', () => {
    expect(canStartMotionRecording(false, false)).toBe(true);
  });

  it('returns false when accelerometer subscription exists', () => {
    expect(canStartMotionRecording(true, false)).toBe(false);
  });

  it('returns false when gyroscope subscription exists', () => {
    expect(canStartMotionRecording(false, true)).toBe(false);
  });

  it('returns false when both subscriptions exist', () => {
    expect(canStartMotionRecording(true, true)).toBe(false);
  });
});

describe('formatMotionMagnitude', () => {
  it('formats null as N/A', () => {
    expect(formatMotionMagnitude(null)).toBe('N/A');
  });

  it('formats magnitude to two decimals', () => {
    expect(formatMotionMagnitude(12.3456)).toBe('12.35');
  });
});

describe('formatMotionAxes', () => {
  it('formats null as N/A', () => {
    expect(formatMotionAxes(null)).toBe('N/A');
  });

  it('formats axes to two decimals and slash-separated output', () => {
    expect(
      formatMotionAxes({
        timestamp: 123,
        x: 1.111,
        y: -2.225,
        z: 0,
      }),
    ).toBe('1.11 / -2.23 / 0.00');
  });
});

describe('normalizeMotionAxisValue', () => {
  it('preserves finite axis values', () => {
    expect(normalizeMotionAxisValue(1.25)).toBe(1.25);
  });

  it('normalizes invalid axis values to null', () => {
    expect(normalizeMotionAxisValue(Number.NaN)).toBeNull();
    expect(normalizeMotionAxisValue(undefined)).toBeNull();
  });
});

describe('toMotionSample', () => {
  it('maps valid motion readings into a sample', () => {
    expect(toMotionSample({ x: 1, y: 2, z: 3 }, 100)).toEqual({
      timestamp: 100,
      x: 1,
      y: 2,
      z: 3,
    });
  });

  it('returns null when any axis is invalid', () => {
    expect(toMotionSample({ x: Number.NaN, y: 2, z: 3 }, 100)).toBeNull();
  });
});

describe('magnitudeFromMotionSample', () => {
  it('computes sample magnitude', () => {
    expect(magnitudeFromMotionSample({ timestamp: 0, x: 3, y: 4, z: 12 })).toBe(13);
  });
});

describe('summarizeMotionSamples', () => {
  it('returns the initial summary for no valid samples', () => {
    expect(summarizeMotionSamples([], 2)).toEqual({
      ...initialMotionTelemetrySummary,
      invalidSampleCount: 2,
    });
  });

  it('summarizes continuity and magnitude for valid motion samples', () => {
    expect(
      summarizeMotionSamples(
        [
          { timestamp: 1000, x: 1, y: 0, z: 0 },
          { timestamp: 1250, x: 0, y: 2, z: 0 },
          { timestamp: 1750, x: 0, y: 0, z: 3 },
        ],
        1,
      ),
    ).toEqual({
      averageMagnitude: 2,
      invalidSampleCount: 1,
      largestSampleGapMs: 500,
      latestTimestamp: 1750,
      validSampleCount: 3,
    });
  });
});