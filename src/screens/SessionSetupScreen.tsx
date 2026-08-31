import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type SessionSetupScreenProps = {
  onBack: () => void;
  onStartSession: () => void;
};

type CheckKey = 'mounted' | 'stationary' | 'milestoneScope';

type CheckItem = {
  key: CheckKey;
  title: string;
  body: string;
};

const checkItems: CheckItem[] = [
  {
    key: 'mounted',
    title: 'Phone is mounted securely',
    body: 'Place the phone in a secure mount before driving. This setup flow should be completed while the vehicle is stationary.',
  },
  {
    key: 'stationary',
    title: 'I will not use the phone while moving',
    body: 'IrishDrive AI should not encourage interaction during motion. Start the drive only when you can leave the phone untouched.',
  },
  {
    key: 'milestoneScope',
    title: 'I understand this milestone does not record or assess driving yet',
    body: 'Camera, GPS, sensors, telemetry, scoring, and AI coaching are not active in Session Setup. Those belong to later milestones.',
  },
];

export function SessionSetupScreen({ onBack, onStartSession }: SessionSetupScreenProps) {
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>({
    mounted: false,
    stationary: false,
    milestoneScope: false,
  });

  const allChecksCompleted = useMemo(
    () => checkItems.every((checkItem) => checks[checkItem.key]),
    [checks],
  );

  const toggleCheck = (key: CheckKey) => {
    setChecks((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} style={styles.screen}>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Session Setup</Text>
        <Text style={styles.title}>Prepare your practice session</Text>
        <Text style={styles.body}>
          Milestone 4 adds the pre-drive flow and local session lifecycle only. The exact checklist remains TBD in documentation, so this screen covers current safety confirmations without introducing later-milestone permissions or assessment logic.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pre-drive checks</Text>
        <Text style={styles.sectionBody}>Complete each confirmation before starting a practice session.</Text>
      </View>

      <View style={styles.cardsColumn}>
        {checkItems.map((checkItem) => {
          const isChecked = checks[checkItem.key];

          return (
            <Pressable
              key={checkItem.key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked }}
              onPress={() => toggleCheck(checkItem.key)}
              style={[styles.checkCard, isChecked ? styles.checkCardSelected : null]}
            >
              <View style={styles.checkRow}>
                <View style={[styles.checkIndicator, isChecked ? styles.checkIndicatorSelected : null]}>
                  {isChecked ? <View style={styles.checkIndicatorDot} /> : null}
                </View>
                <View style={styles.checkCopy}>
                  <Text style={styles.checkTitle}>{checkItem.title}</Text>
                  <Text style={styles.checkBody}>{checkItem.body}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>What this session start does now</Text>
        <Text style={styles.summaryBody}>Creates a local in-app session state and opens an active-session screen.</Text>
        <Text style={styles.summaryBody}>It does not request permissions, capture telemetry, assess driving, or persist session history.</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back to home</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!allChecksCompleted}
          onPress={onStartSession}
          style={[styles.primaryButton, !allChecksCompleted ? styles.buttonDisabled : null]}
        >
          <Text style={styles.primaryButtonText}>Start practice session</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
    gap: 18,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#0f766e',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#0f172a',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  },
  section: {
    gap: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  cardsColumn: {
    gap: 14,
  },
  checkCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  checkCardSelected: {
    borderColor: '#0f766e',
    backgroundColor: '#f0fdfa',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkIndicator: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#ffffff',
  },
  checkIndicatorSelected: {
    borderColor: '#0f766e',
  },
  checkIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#0f766e',
  },
  checkCopy: {
    flex: 1,
    gap: 4,
  },
  checkTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  checkBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },
  summaryCard: {
    backgroundColor: '#ecfeff',
    borderRadius: 20,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#155e75',
  },
  summaryBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#164e63',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0f766e',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
