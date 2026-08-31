import { beforeEach, describe, expect, it, vi } from 'vitest';

const { asyncStorageMock } = vi.hoisted(() => ({
  asyncStorageMock: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: asyncStorageMock,
}));

import { createCompletedDrivingSession } from '../session/completedSession';
import { initialGpsTelemetrySummary } from '../session/gpsUtils';
import { initialMotionTelemetrySummary } from '../session/motionUtils';
import type { ActiveSessionGpsState, ActiveSessionMotionState, MotionStreamState } from '../session/models';
import {
  getCompletedDrivingSessionById,
  listCompletedDrivingSessions,
  parseCompletedDrivingSessions,
  saveCompletedDrivingSession,
} from './completedSessionStorage';

const gpsState: ActiveSessionGpsState = {
  status: 'stopped',
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

const motionStream: MotionStreamState = {
  status: 'stopped',
  errorMessage: null,
  samples: [],
  sampleCount: 0,
  invalidSampleCount: 0,
  latestSample: null,
  latestMagnitude: null,
  peakMagnitude: 0,
  telemetrySummary: initialMotionTelemetrySummary,
};

const motionState: ActiveSessionMotionState = {
  accelerometer: motionStream,
  gyroscope: motionStream,
  startedAtMs: null,
};

const createdSession = createCompletedDrivingSession({
  endedAt: '2026-08-31T10:01:00.000Z',
  eventDetectionState: { events: [], warnings: [] },
  gpsState,
  motionState,
  sessionId: 'session-1',
  startedAt: '2026-08-31T10:00:00.000Z',
});

if (!createdSession.ok) {
  throw new Error('Failed to create test session');
}

describe('completedSessionStorage', () => {
  beforeEach(() => {
    asyncStorageMock.getItem.mockReset();
    asyncStorageMock.setItem.mockReset();
  });

  it('parses valid stored sessions and filters malformed records', () => {
    expect(
      parseCompletedDrivingSessions(
        JSON.stringify([
          createdSession.session,
          { id: 'bad' },
        ]),
      ),
    ).toEqual([createdSession.session]);
  });

  it('returns an empty array for malformed persisted data', () => {
    expect(parseCompletedDrivingSessions('{bad json')).toEqual([]);
  });

  it('saves completed sessions and keeps the latest version first', async () => {
    asyncStorageMock.getItem.mockResolvedValueOnce(JSON.stringify([createdSession.session]));
    asyncStorageMock.setItem.mockResolvedValueOnce(undefined);

    await saveCompletedDrivingSession({ ...createdSession.session, endedAt: '2026-08-31T10:02:00.000Z' });

    expect(asyncStorageMock.setItem).toHaveBeenCalledTimes(1);
    const savedPayload = JSON.parse(asyncStorageMock.setItem.mock.calls[0][1]);
    expect(savedPayload).toHaveLength(1);
    expect(savedPayload[0].endedAt).toBe('2026-08-31T10:02:00.000Z');
  });

  it('lists and retrieves stored sessions', async () => {
    asyncStorageMock.getItem.mockResolvedValue(JSON.stringify([createdSession.session]));

    await expect(listCompletedDrivingSessions()).resolves.toEqual([createdSession.session]);
    await expect(getCompletedDrivingSessionById('session-1')).resolves.toEqual(createdSession.session);
    await expect(getCompletedDrivingSessionById('missing')).resolves.toBeNull();
  });

  it('propagates storage failures when saving', async () => {
    asyncStorageMock.getItem.mockRejectedValueOnce(new Error('storage failed'));

    await expect(saveCompletedDrivingSession(createdSession.session)).rejects.toThrow('storage failed');
  });
});