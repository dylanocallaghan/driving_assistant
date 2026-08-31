import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { Camera } from 'expo-camera';

import { deriveCameraPermissionState, type CameraPermissionResponseLike } from './cameraPermissionUtils';

type CameraPermissionStateSnapshot = {
  errorMessage: string | null;
  isRefreshing: boolean;
  permissionResponse: CameraPermissionResponseLike | null;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unable to access camera permission state.';
}

export function useCameraPermissionState() {
  const [snapshot, setSnapshot] = useState<CameraPermissionStateSnapshot>({
    errorMessage: null,
    isRefreshing: true,
    permissionResponse: null,
  });

  const refreshPermissionState = useCallback(async () => {
    setSnapshot((current) => ({
      ...current,
      isRefreshing: true,
      errorMessage: null,
    }));

    try {
      const permissionResponse = await Camera.getCameraPermissionsAsync();
      setSnapshot({
        errorMessage: null,
        isRefreshing: false,
        permissionResponse: {
          canAskAgain: permissionResponse.canAskAgain,
          granted: permissionResponse.granted,
          status: permissionResponse.status,
        },
      });
    } catch (error) {
      setSnapshot({
        errorMessage: toErrorMessage(error),
        isRefreshing: false,
        permissionResponse: null,
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setSnapshot((current) => ({
      ...current,
      isRefreshing: true,
      errorMessage: null,
    }));

    try {
      const permissionResponse = await Camera.requestCameraPermissionsAsync();
      setSnapshot({
        errorMessage: null,
        isRefreshing: false,
        permissionResponse: {
          canAskAgain: permissionResponse.canAskAgain,
          granted: permissionResponse.granted,
          status: permissionResponse.status,
        },
      });
    } catch (error) {
      setSnapshot({
        errorMessage: toErrorMessage(error),
        isRefreshing: false,
        permissionResponse: null,
      });
    }
  }, []);

  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      setSnapshot((current) => ({
        ...current,
        errorMessage: toErrorMessage(error),
      }));
    }
  }, []);

  useEffect(() => {
    void refreshPermissionState();
  }, [refreshPermissionState]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') {
        void refreshPermissionState();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshPermissionState]);

  const cameraPermissionState = useMemo(() => {
    if (snapshot.isRefreshing && snapshot.permissionResponse === null && snapshot.errorMessage === null) {
      return {
        status: 'loading',
        title: 'Checking camera permission',
        body: 'IrishDrive AI is checking whether camera access has already been granted for future capabilities.',
        errorMessage: null,
        canRequestPermission: false,
        shouldOpenSettings: false,
        isGranted: false,
      } as const;
    }

    return deriveCameraPermissionState(snapshot.permissionResponse, snapshot.errorMessage);
  }, [snapshot.errorMessage, snapshot.isRefreshing, snapshot.permissionResponse]);

  return {
    cameraPermissionState,
    isRefreshing: snapshot.isRefreshing,
    openSettings,
    refreshPermissionState,
    requestPermission,
  };
}