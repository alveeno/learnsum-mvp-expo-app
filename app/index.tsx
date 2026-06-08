import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { LanguagePicker } from "../components/i18n/LanguagePicker";
import { useT } from "../components/i18n/LanguageProvider";
import { type TranslationKey } from "../components/i18n/translations";

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
    | "/onboarding/TutorInspiration";
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
    route: "/onboarding/TutorInspiration",
  },
];

export default function Index() {
  const t = useT();
  // Which role card is currently selected (only one at a time, or none).
  const [selectedKey, setSelectedKey] = useState<UserTypeKey | null>(null);

  const selectedType = USER_TYPES.find((u) => u.key === selectedKey) ?? null;

  const handleContinue = () => {
    if (selectedType) {
      router.push(selectedType.route);
    }
  };

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
            onPress={() => router.push("/auth/login")}
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
  },
  continueButton: {
    marginTop: 12,
  },
});
