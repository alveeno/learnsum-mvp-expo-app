import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

/**
 * Placeholder category-selection screen.
 *
 * Exists only so navigation (Continue / Skip) works. It reads the
 * `educationLevel` route param to prove the selection was passed forward;
 * the real category UI is not built yet.
 */
export default function CategorySelection() {
  const { educationLevel } = useLocalSearchParams<{ educationLevel?: string }>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable style={styles.backButton} hitSlop={8} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#2D6A4F" />
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.title}>Category selection</Text>
          <Text style={styles.subtitle}>Coming soon.</Text>
          <Text style={styles.passed}>
            Education level passed in: {educationLevel ?? "(skipped)"}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#F9F9F7",
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  subtitle: { marginTop: 8, fontSize: 14, color: "#6B7280" },
  passed: { marginTop: 16, fontSize: 14, fontWeight: "600", color: "#2D6A4F" },
});
