/**
 * Seeker (parent / student) profile — `/seekers/[id]`.
 *
 * Where a tutor lands when they tap a parent/student from the Analytics
 * "profile viewers" list or their Saved tab. Reuses `SeekerProfileContent`
 * (preferences + child level/age, with contact locked behind the daily quota).
 *
 * English-only, sample-data fallback (see CLAUDE.md).
 */
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, StyleSheet } from "react-native";

import { SeekerProfileContent } from "../../components/seeker-profile/SeekerProfileContent";

export default function SeekerProfile() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <SafeAreaView style={styles.safe}>
      <SeekerProfileContent id={id ?? ""} onBack={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
});
