export type CameraPermissionResponseLike = {
  canAskAgain: boolean;
  granted: boolean;
  status: 'granted' | 'denied' | 'undetermined' | string;
};

export type CameraPermissionStatus = 'loading' | 'not-requested' | 'granted' | 'denied-retryable' | 'denied-blocked' | 'error';

export type CameraPermissionState = {
  status: CameraPermissionStatus;
  title: string;
  body: string;
  errorMessage: string | null;
  canRequestPermission: boolean;
  shouldOpenSettings: boolean;
  isGranted: boolean;
};

export function deriveCameraPermissionState(
  permissionResponse: CameraPermissionResponseLike | null,
  errorMessage: string | null,
): CameraPermissionState {
  if (errorMessage) {
    return {
      status: 'error',
      title: 'Camera permission unavailable',
      body: 'IrishDrive AI could not read the camera permission state. Camera capture still remains disabled in this milestone.',
      errorMessage,
      canRequestPermission: true,
      shouldOpenSettings: false,
      isGranted: false,
    };
  }

  if (!permissionResponse || permissionResponse.status === 'undetermined') {
    return {
      status: 'not-requested',
      title: 'Camera permission not requested yet',
      body: 'Camera access can be reviewed here for future capabilities. This build does not start camera preview or camera recording.',
      errorMessage: null,
      canRequestPermission: true,
      shouldOpenSettings: false,
      isGranted: false,
    };
  }

  if (permissionResponse.granted) {
    return {
      status: 'granted',
      title: 'Camera permission granted',
      body: 'Camera access is available for future capabilities. This milestone still does not capture camera input during a drive.',
      errorMessage: null,
      canRequestPermission: false,
      shouldOpenSettings: false,
      isGranted: true,
    };
  }

  if (permissionResponse.canAskAgain) {
    return {
      status: 'denied-retryable',
      title: 'Camera permission denied',
      body: 'You can retry the camera permission request here. The current drive flow will continue without camera access because camera capture is not implemented yet.',
      errorMessage: null,
      canRequestPermission: true,
      shouldOpenSettings: false,
      isGranted: false,
    };
  }

  return {
    status: 'denied-blocked',
    title: 'Camera permission blocked',
    body: 'Camera access was denied and must be re-enabled from system settings if you want it available for future capabilities.',
    errorMessage: null,
    canRequestPermission: false,
    shouldOpenSettings: true,
    isGranted: false,
  };
}