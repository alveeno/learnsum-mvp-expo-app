import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { LoginSheet } from "../components/auth/LoginSheet";
import { homeForRole, resolveLaunchDestination } from "../components/auth/launch";
import { LanguagePicker } from "../components/i18n/LanguagePicker";
import { useT } from "../components/i18n/LanguageProvider";
import { type TranslationKey } from "../components/i18n/translations";
import { getRefreshToken, hasToken, type Role } from "../lib/api";

type UserTypeKey = "student" | "parent" | "tutor";

type UserType = {
  key: UserTypeKey;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
  /** The "coloured version" shown in the icon circle when selected. */
  color: string;
  route:
    | "/onboarding/StudentEducationLevel"
    | "/onboarding/ParentNumChild"
    | "/tutor-home";
};

const USER_TYPES: UserType[] = [
  {
    key: "student",
    labelKey: "role.student",
    descKey: "role.student.desc",
    icon: "school",
    color: "#2D6A4F", // Forest Green
    route: "/onboarding/StudentEducationLevel",
  },
  {
    key: "parent",
    labelKey: "role.parent",
    descKey: "role.parent.desc",
    icon: "people",
    color: "#F4A923", // Gold
    route: "/onboarding/ParentNumChild",
  },
  {
    key: "tutor",
    labelKey: "role.tutor",
    descKey: "role.tutor.desc",
    icon: "book",
    color: "#2D6A4F", // Forest Green
    // Tutors land on the home feed first; "Complete profile" there starts onboarding.
    route: "/tutor-home",
  },
];

export default function Index() {
  const t = useT();
  // Which role card is currently selected (only one at a time, or none).
  const [selectedKey, setSelectedKey] = useState<UserTypeKey | null>(null);
  // Login bottom-sheet (placeholder — not wired to a backend yet).
  const [loginOpen, setLoginOpen] = useState(false);
  // On a cold start, if a session was restored (app/_layout.tsx ran restoreToken
  // before this mounts), resolve where to land BEFORE showing anything — so a
  // logged-in user never flashes this welcome screen. Only "checks" when there's
  // actually a session to resolve; otherwise we go straight to the welcome UI.
  const [checking, setChecking] = useState(() => hasToken() || getRefreshToken() != null);

  useEffect(() => {
    if (!checking) return;
    let cancelled = false;
    void (async () => {
      const dest = await resolveLaunchDestination();
      if (cancelled) return;
      if (dest) router.replace(dest);
      else setChecking(false); // no valid session → show the welcome screen
    })();
    return () => {
      cancelled = true;
    };
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedType = USER_TYPES.find((u) => u.key === selectedKey) ?? null;

  const handleContinue = () => {
    if (selectedType) {
      router.push(selectedType.route);
    }
  };

  // A returning user logs in from the sheet → route to their role's home. Tutor
  // lands on the tutor app shell; student/parent on the placeholder /feed. An
  // unknown role (e.g. the __DEV__ offline fallback, where the profile can't be
  // fetched) defaults to the tutor home — that's the path in active development.
  // `replace` so Back doesn't return to this screen.
  const handleLoggedIn = (role: Role | null) => {
    setLoginOpen(false);
    router.replace(homeForRole(role));
  };

  // While resolving a restored session, show a brand splash instead of the
  // welcome UI (avoids a flash of "pick your role" for an already-logged-in user).
  if (checking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.splash}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Ionicons name="school" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>
              <Text style={styles.logoLearn}>Learn</Text>
              <Text style={styles.logoSum}>Sum</Text>
            </Text>
          </View>
          <ActivityIndicator color="#2D6A4F" style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Language switcher — globe opens a bottom-sheet of languages. */}
        <View style={styles.topBar}>
          <LanguagePicker />
        </View>

        {/* Logo block centred in the upper half */}
        <View style={styles.logoSection}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Ionicons name="school" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>
              <Text style={styles.logoLearn}>Learn</Text>
              <Text style={styles.logoSum}>Sum</Text>
            </Text>
          </View>
          <Text style={styles.subtitle}>{t("welcome.tagline")}</Text>
        </View>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          <Text style={styles.iAmA}>{t("welcome.iAmA")}</Text>

          <View style={styles.cardRow}>
            {USER_TYPES.map((type) => {
              const isSelected = type.key === selectedKey;
              return (
                <Card
                  key={type.key}
                  selected={isSelected}
                  accessibilityLabel={t(type.labelKey)}
                  onPress={() => setSelectedKey(type.key)}
                  style={styles.card}
                >
                  <View
                    style={[
                      styles.cardIconCircle,
                      // Grey when resting, the role's colour when selected.
                      isSelected && { backgroundColor: type.color },
                    ]}
                  >
                    <Ionicons
                      name={type.icon}
                      size={22}
                      color={isSelected ? "#FFFFFF" : "#6B7280"}
                    />
                  </View>
                  <Text style={styles.cardLabel}>{t(type.labelKey)}</Text>
                  <Text style={styles.cardDescription}>{t(type.descKey)}</Text>
                </Card>
              );
            })}
          </View>

          <Text style={styles.memberPrompt}>{t("welcome.member")}</Text>
          <Button
            label={t("welcome.login")}
            variant="accent"
            style={styles.loginButton}
            onPress={() => setLoginOpen(true)}
          />

          {/* Continue appears only once a role is selected. */}
          {selectedType && (
            <Button
              label={t("common.continue")}
              variant="primary"
              style={styles.continueButton}
              onPress={handleContinue}
            />
          )}
        </View>
      </View>

      <LoginSheet
        visible={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoggedIn={handleLoggedIn}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    // Keep content off the very bottom edge / home indicator.
    paddingBottom: 24,
  },
  topBar: {
    paddingTop: 8,
  },
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#2D6A4F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  logoLearn: {
    color: "#2D6A4F",
  },
  logoSum: {
    color: "#F4A923",
  },
  subtitle: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  bottomSection: {
    paddingBottom: 8,
  },
  iAmA: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "600",
  },
  cardRow: {
    flexDirection: "row",
    // Even spacing between the three cards (RN >= 0.71 supports `gap`).
    gap: 12,
    marginTop: 12,
  },
  card: {
    // Each card takes an equal third of the row; min-width 0 lets them
    // shrink so captions wrap instead of pushing cards off-screen.
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    // Slightly tighter horizontal padding so three cards fit comfortably.
    paddingHorizontal: 8,
  },
  cardIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 999, // circular avatar
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "bold",
    color: "#111827",
  },
  cardDescription: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  memberPrompt: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  loginButton: {
    marginTop: 12,
    // Narrower, centred pill (per the welcome-screen design) rather than the
    // full-width Continue button below it.
    alignSelf: "center",
    paddingHorizontal: 48,
  },
  continueButton: {
    marginTop: 12,
  },
});
