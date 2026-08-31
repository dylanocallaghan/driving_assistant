const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';

export const env = {
  appName: 'IrishDrive AI',
  appEnv,
  isDevelopment: appEnv === 'development',
} as const;
