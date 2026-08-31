import type { DrivingEventDetectionState } from './eventModels';
import type { ActiveSessionGpsState, ActiveSessionMotionState } from './models';

export type CompletedDrivingSession = {
  eventDetection: {
    events: DrivingEventDetectionState['events'];
    warnings: DrivingEventDetectionState['warnings'];
  };
  gps: ActiveSessionGpsState;
  id: string;
  motion: ActiveSessionMotionState;
  savedAt: string;
  startedAt: string;
  endedAt: string;
  schemaVersion: 1;
};

export type CreateCompletedDrivingSessionResult =
  | {
      ok: true;
      session: CompletedDrivingSession;
    }
  | {
      ok: false;
      message: string;
    };

type CreateCompletedDrivingSessionInput = {
  endedAt: string;
  eventDetectionState: Pick<DrivingEventDetectionState, 'events' | 'warnings'>;
  gpsState: ActiveSessionGpsState;
  motionState: ActiveSessionMotionState;
  sessionId: string;
  startedAt: string;
};

export function createCompletedDrivingSession(input: CreateCompletedDrivingSessionInput): CreateCompletedDrivingSessionResult {
  if (!input.sessionId.trim()) {
    return { ok: false, message: 'Unable to save session. Session identifier is missing.' };
  }

  const startedAtMs = Date.parse(input.startedAt);
  const endedAtMs = Date.parse(input.endedAt);

  if (Number.isNaN(startedAtMs) || Number.isNaN(endedAtMs)) {
    return { ok: false, message: 'Unable to save session. Session timestamps are invalid.' };
  }

  if (endedAtMs < startedAtMs) {
    return { ok: false, message: 'Unable to save session. Session end time precedes start time.' };
  }

  return {
    ok: true,
    session: {
      eventDetection: {
        events: cloneEvents(input.eventDetectionState.events),
        warnings: cloneEvents(input.eventDetectionState.warnings),
      },
      gps: cloneGpsState(input.gpsState),
      id: input.sessionId,
      motion: cloneMotionState(input.motionState),
      savedAt: new Date().toISOString(),
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      schemaVersion: 1,
    },
  };
}

function cloneEvents(events: DrivingEventDetectionState['events']) {
  return events.map((event) => ({
    ...event,
    evidence: { ...event.evidence },
    requiredData: [...event.requiredData],
    source: [...event.source],
  }));
}

function cloneGpsState(gpsState: ActiveSessionGpsState): ActiveSessionGpsState {
  return {
    ...gpsState,
    samples: gpsState.samples.map((sample) => ({ ...sample })),
    telemetrySummary: gpsState.telemetrySummary.latestLocation
      ? {
          ...gpsState.telemetrySummary,
          latestLocation: { ...gpsState.telemetrySummary.latestLocation },
        }
      : { ...gpsState.telemetrySummary },
  };
}

function cloneMotionState(motionState: ActiveSessionMotionState): ActiveSessionMotionState {
  return {
    ...motionState,
    accelerometer: cloneMotionStreamState(motionState.accelerometer),
    gyroscope: cloneMotionStreamState(motionState.gyroscope),
  };
}

function cloneMotionStreamState(streamState: ActiveSessionMotionState['accelerometer']) {
  return {
    ...streamState,
    latestSample: streamState.latestSample ? { ...streamState.latestSample } : null,
    samples: streamState.samples.map((sample) => ({ ...sample })),
    telemetrySummary: { ...streamState.telemetrySummary },
  };
}