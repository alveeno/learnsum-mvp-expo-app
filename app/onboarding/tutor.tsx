import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function TutorOnboarding() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable style={styles.backButton} hitSlop={8} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#2D6A4F" />
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.title}>Tutor onboarding</Text>
          <Text style={styles.subtitle}>Coming soon.</Text>
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
});
