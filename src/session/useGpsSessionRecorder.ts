import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';

import { distanceBetweenSamplesMeters } from './distance';
import { calculateElapsedSeconds, initialGpsState, summarizeGpsSamples, toGpsErrorMessage, toGpsSample } from './gpsUtils';
import type { ActiveSessionGpsState, GpsRecordingStatus, GpsSample, StartGpsRecordingResult } from './models';

export function useGpsSessionRecorder() {
  const [gpsState, setGpsState] = useState<ActiveSessionGpsState>(initialGpsState);

  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSampleRef = useRef<GpsSample | null>(null);

  const clearTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const clearLocationSubscription = useCallback(() => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(
    (status: GpsRecordingStatus = 'stopped', errorMessage: string | null = null) => {
      clearLocationSubscription();
      clearTimer();
      lastSampleRef.current = null;

      setGpsState((previousState) => ({
        ...previousState,
        status,
        errorMessage,
        elapsedSeconds: calculateElapsedSeconds(previousState.startedAtMs),
      }));
    },
    [clearLocationSubscription, clearTimer],
  );

  const startRecording = useCallback(async (): Promise<StartGpsRecordingResult> => {
    if (locationSubscriptionRef.current) {
      return { ok: true };
    }

    setGpsState((previousState) => ({
      ...previousState,
      status: 'requesting-permission',
      errorMessage: null,
    }));

    try {
      const permissionResponse = await Location.requestForegroundPermissionsAsync();

      if (!permissionResponse.granted) {
        const message = permissionResponse.canAskAgain
          ? 'Location permission is required to record GPS speed, distance travelled, and GPS accuracy during a session.'
          : 'Location permission is blocked. Enable location access for IrishDrive AI in iPhone settings, then retry.';

        setGpsState((previousState) => ({
          ...previousState,
          status: 'permission-denied',
          errorMessage: message,
        }));

        return { ok: false, message };
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        const message = 'GPS data unavailable. Turn on Location Services and retry.';

        setGpsState((previousState) => ({
          ...previousState,
          status: 'error',
          errorMessage: message,
        }));

        return { ok: false, message };
      }

      const startedAtMs = Date.now();
      lastSampleRef.current = null;

      setGpsState({
        ...initialGpsState,
        status: 'recording',
        startedAtMs,
      });

      clearTimer();
      elapsedTimerRef.current = setInterval(() => {
        setGpsState((previousState) => ({
          ...previousState,
          elapsedSeconds: calculateElapsedSeconds(previousState.startedAtMs),
        }));
      }, 1000);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 1000,
          distanceInterval: 1,
          mayShowUserSettingsDialog: true,
        },
        (locationUpdate) => {
          const sample = toGpsSample(locationUpdate);

          setGpsState((previousState) => {
            const nextSamples = [...previousState.samples, sample];
            let nextDistanceMeters = previousState.distanceMeters;

            if (lastSampleRef.current) {
              nextDistanceMeters += distanceBetweenSamplesMeters(lastSampleRef.current, sample);
            }

            lastSampleRef.current = sample;

            return {
              ...previousState,
              status: 'recording',
              errorMessage: null,
              samples: nextSamples,
              sampleCount: nextSamples.length,
              distanceMeters: nextDistanceMeters,
              latestSpeedMps: sample.speedMps,
              latestAccuracyMeters: sample.accuracyMeters,
              elapsedSeconds: calculateElapsedSeconds(previousState.startedAtMs),
              telemetrySummary: summarizeGpsSamples(nextSamples),
            };
          });
        },
      );

      locationSubscriptionRef.current = subscription;

      return { ok: true };
    } catch (error) {
      stopRecording('error', `Unable to start GPS recording. ${toGpsErrorMessage(error)}`);
      return {
        ok: false,
        message: `Unable to start GPS recording. ${toGpsErrorMessage(error)}`,
      };
    }
  }, [clearTimer, stopRecording]);

  useEffect(() => {
    if (gpsState.status !== 'recording') {
      return;
    }

    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState !== 'active') {
        return;
      }

      void (async () => {
        try {
          const permissionResponse = await Location.getForegroundPermissionsAsync();

          if (!permissionResponse.granted) {
            stopRecording('permission-denied', 'Location permission was revoked. GPS recording stopped.');
          }
        } catch {
          stopRecording('error', 'GPS data unavailable. Unable to verify location permission.');
        }
      })();
    });

    return () => {
      subscription.remove();
    };
  }, [gpsState.status, stopRecording]);

  useEffect(() => {
    return () => {
      clearLocationSubscription();
      clearTimer();
      lastSampleRef.current = null;
    };
  }, [clearLocationSubscription, clearTimer]);

  return {
    gpsState,
    startRecording,
    stopRecording,
  };
}
