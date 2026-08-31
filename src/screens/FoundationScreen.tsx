import { StyleSheet, Text, View } from 'react-native';

import { env } from '../config/env';

export function FoundationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{env.appName}</Text>
      <Text style={styles.subtitle}>Onboarding Complete</Text>
      <Text style={styles.body}>
        The app foundation is ready. Home screen, driving session setup, permissions, and assessment features remain in later milestones.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f766e',
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 360,
  },
});
