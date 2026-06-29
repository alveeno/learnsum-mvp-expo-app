/**
 * Match check-in — the screen a 10-minute reminder notification deep-links to.
 *
 * Asks "Did you start having lessons with [name]?" and, on either answer, clears
 * the matching pending state (seeker contact or tutor match) and routes the user
 * home. Reached via `data.url = /match-checkin?side=…&id=…&name=…` (see
 * components/match/notifications.ts).
 */
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { resolveSeekerContact } from "../components/match/seekerContact";
import { resolveTutorMatch } from "../components/match/tutorMatch";
import { C } from "../components/tutor/tutorData";
import { tapMedium } from "../components/ui/feedback";

export default function MatchCheckIn() {
  const { side, id, name } = useLocalSearchParams<{ side?: string; id?: string; name?: string }>();
  const isSeeker = side !== "tutor";
  const who = name || (isSeeker ? "the tutor" : "the student");

  const answer = (started: boolean) => {
    tapMedium();
    if (isSeeker) resolveSeekerContact(started);
    else resolveTutorMatch(id ?? "", started);
    router.replace(isSeeker ? "/feed" : "/tutor-home");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.iconOuter}>
          <MaterialIcons name="school" size={34} color={C.greenD} />
        </View>
        <Text style={styles.title}>Did you start having lessons?</Text>
        <Text style={styles.sub}>
          Let us know how it went with <Text style={styles.name}>{who}</Text>. Either way, you&apos;re free to
          reach out to someone new.
        </Text>
        <View style={styles.row}>
          <Pressable style={[styles.btn, styles.no]} onPress={() => answer(false)} accessibilityRole="button" accessibilityLabel="No">
            <Text style={styles.btnText}>No</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.yes]} onPress={() => answer(true)} accessibilityRole="button" accessibilityLabel="Yes">
            <Text style={styles.btnText}>Yes</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  iconOuter: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.greenTint, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { fontSize: 23, fontWeight: "800", color: C.ink, textAlign: "center", letterSpacing: -0.4 },
  sub: { fontSize: 15, lineHeight: 22, color: C.muted, textAlign: "center", marginTop: 10, marginBottom: 28 },
  name: { fontWeight: "800", color: C.ink },
  row: { flexDirection: "row", gap: 12, alignSelf: "stretch" },
  btn: { flex: 1, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  yes: { backgroundColor: C.green },
  no: { backgroundColor: C.destructive },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
