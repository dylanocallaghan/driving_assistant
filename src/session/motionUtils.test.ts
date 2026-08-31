import { describe, expect, it } from 'vitest';

import { canStartMotionRecording, formatMotionAxes, formatMotionMagnitude } from './motionUtils';

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