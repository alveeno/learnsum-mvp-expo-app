import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type UserType = {
  key: "student" | "parent" | "tutor";
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: "/onboarding/student" | "/onboarding/parent" | "/onboarding/tutor";
};

const USER_TYPES: UserType[] = [
  {
    key: "student",
    label: "Student",
    description: "I am looking for a tutor to help me learn",
    icon: "school-outline",
    route: "/onboarding/student",
  },
  {
    key: "parent",
    label: "Parent",
    description: "I am looking for a tutor for my children",
    icon: "people-outline",
    route: "/onboarding/parent",
  },
  {
    key: "tutor",
    label: "Tutor",
    description: "I want to offer my teaching services",
    icon: "book-outline",
    route: "/onboarding/tutor",
  },
];

export default function Index() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View className="flex-1 px-6">
        {/* Language switcher placeholder */}
        <View className="pt-2">
          <Pressable style={styles.langButton} hitSlop={8}>
            <Ionicons name="globe-outline" size={20} color="#2D6A4F" />
          </Pressable>
        </View>

        {/* Logo block centred in the upper half */}
        <View className="flex-1 items-center justify-center">
          <View className="flex-row items-center">
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
        <View className="pb-2">
          <Text style={styles.iAmA}>I AM A...</Text>

          <View className="flex-row gap-3 mt-3">
            {USER_TYPES.map((type) => (
              <Pressable
                key={type.key}
                style={styles.card}
                className="flex-1"
                onPress={() => router.push(type.route)}
              >
                <View style={styles.cardIconCircle}>
                  <Ionicons name={type.icon} size={22} color="#6B7280" />
                </View>
                <Text style={styles.cardLabel}>{type.label}</Text>
                <Text style={styles.cardDescription}>{type.description}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.memberPrompt}>Already a member?</Text>
          <Pressable
            style={styles.loginButton}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.loginButtonText}>Log in now</Text>
          </Pressable>
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
  langButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#F9F9F7",
    alignItems: "center",
    justifyContent: "center",
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
  iAmA: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  cardIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 999,
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
    height: 52,
    borderRadius: 999,
    backgroundColor: "#F4A923",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
});
