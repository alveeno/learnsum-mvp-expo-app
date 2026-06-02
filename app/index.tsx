import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

type UserTypeKey = "student" | "parent" | "tutor";

type UserType = {
  key: UserTypeKey;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** The "coloured version" shown in the icon circle when selected. */
  color: string;
  route: "/onboarding/student" | "/onboarding/parent" | "/onboarding/tutor";
};

const USER_TYPES: UserType[] = [
  {
    key: "student",
    label: "Student",
    description: "I am looking for a tutor to help me learn",
    icon: "school",
    color: "#2D6A4F", // Forest Green
    route: "/onboarding/student",
  },
  {
    key: "parent",
    label: "Parent",
    description: "I am looking for a tutor for my children",
    icon: "people",
    color: "#F4A923", // Gold
    route: "/onboarding/parent",
  },
  {
    key: "tutor",
    label: "Tutor",
    description: "I want to offer my teaching services",
    icon: "book",
    color: "#2D6A4F", // Forest Green
    route: "/onboarding/tutor",
  },
];

export default function Index() {
  // Which role card is currently selected (only one at a time, or none).
  const [selectedKey, setSelectedKey] = useState<UserTypeKey | null>(null);

  const selectedType = USER_TYPES.find((t) => t.key === selectedKey) ?? null;

  const handleContinue = () => {
    if (selectedType) {
      router.push(selectedType.route);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Language switcher placeholder — left as-is for now. */}
        <View style={styles.topBar}>
          <Pressable style={styles.langButton} hitSlop={8}>
            <Ionicons name="globe-outline" size={20} color="#2D6A4F" />
          </Pressable>
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
          <Text style={styles.subtitle}>
            Find the perfect tutor within minutes.
          </Text>
        </View>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          <Text style={styles.iAmA}>I AM A...</Text>

          <View style={styles.cardRow}>
            {USER_TYPES.map((type) => {
              const isSelected = type.key === selectedKey;
              return (
                <Card
                  key={type.key}
                  selected={isSelected}
                  accessibilityLabel={type.label}
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
                  <Text style={styles.cardLabel}>{type.label}</Text>
                  <Text style={styles.cardDescription}>{type.description}</Text>
                </Card>
              );
            })}
          </View>

          <Text style={styles.memberPrompt}>Already a member?</Text>
          <Button
            label="Log in now"
            variant="accent"
            style={styles.loginButton}
            onPress={() => router.push("/auth/login")}
          />

          {/* Continue appears only once a role is selected. */}
          {selectedType && (
            <Button
              label="Continue"
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
  langButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#F9F9F7",
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
  },
  continueButton: {
    marginTop: 12,
  },
});
