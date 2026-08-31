import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CompletedDrivingSession } from '../session/completedSession';

const COMPLETED_SESSIONS_STORAGE_KEY = 'irishdrive.sessions.completed.v1';

export async function saveCompletedDrivingSession(session: CompletedDrivingSession): Promise<void> {
  const sessions = await listCompletedDrivingSessions();
  const deduplicatedSessions = [session, ...sessions.filter((existingSession) => existingSession.id !== session.id)];

  await AsyncStorage.setItem(COMPLETED_SESSIONS_STORAGE_KEY, JSON.stringify(deduplicatedSessions));
}

export async function listCompletedDrivingSessions(): Promise<CompletedDrivingSession[]> {
  const rawValue = await AsyncStorage.getItem(COMPLETED_SESSIONS_STORAGE_KEY);

  return parseCompletedDrivingSessions(rawValue);
}

export async function getCompletedDrivingSessionById(sessionId: string): Promise<CompletedDrivingSession | null> {
  const sessions = await listCompletedDrivingSessions();
  return sessions.find((session) => session.id === sessionId) ?? null;
}

export function parseCompletedDrivingSessions(rawValue: string | null): CompletedDrivingSession[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isCompletedDrivingSession);
  } catch {
    return [];
  }
}

function isCompletedDrivingSession(value: unknown): value is CompletedDrivingSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Record<string, unknown>;

  return (
    typeof session.id === 'string' &&
    typeof session.startedAt === 'string' &&
    typeof session.endedAt === 'string' &&
    typeof session.savedAt === 'string' &&
    session.schemaVersion === 1 &&
    isGpsState(session.gps) &&
    isMotionState(session.motion) &&
    isEventDetectionStore(session.eventDetection)
  );
}

function isGpsState(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const gpsState = value as Record<string, unknown>;
  return Array.isArray(gpsState.samples) && gpsState.telemetrySummary !== undefined;
}

function isMotionState(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const motionState = value as Record<string, unknown>;
  return (
    motionState.accelerometer !== undefined &&
    motionState.gyroscope !== undefined &&
    isMotionStreamState(motionState.accelerometer) &&
    isMotionStreamState(motionState.gyroscope)
  );
}

function isMotionStreamState(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const streamState = value as Record<string, unknown>;
  return Array.isArray(streamState.samples) && streamState.telemetrySummary !== undefined;
}

function isEventDetectionStore(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const eventDetectionStore = value as Record<string, unknown>;
  return Array.isArray(eventDetectionStore.events) && Array.isArray(eventDetectionStore.warnings);
}