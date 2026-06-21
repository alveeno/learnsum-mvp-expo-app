import { Ionicons } from "@expo/vector-icons";
import { router, Stack, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/ui/Button";
import { clearEditing } from "../../components/onboarding/tutorOnboarding";
import { saveTutorEdits } from "../../components/tutor/tutorEditStore";
import { ApiError } from "../../lib/api";

/**
 * The final step of the Profile "Change preferences" edit flow.
 *
 * The edit queue pushes this once the chosen onboarding screens have all been
 * walked. It flushes the edited store to the backend in one shot (saveTutorEdits
 * → the five edit endpoints), then returns to /tutor-home. On a real error it
 * lets the tutor retry or back out without saving. (Not part of first-time
 * onboarding — only reached via edit mode.)
 */

const HOME = "/tutor-home" as Href;

export default function TutorEditSave() {
  const [status, setStatus] = useState<"saving" | "error">("saving");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  const run = () => {
    setStatus("saving");
    saveTutorEdits()
      .then(() => {
        clearEditing();
        router.dismissTo(HOME);
      })
      .catch((err) => {
        setMessage(
          err instanceof ApiError && !err.isNetworkError
            ? err.message
            : "Couldn't save your changes. Check your connection and try again.",
        );
        setStatus("error");
      });
  };

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goBackWithoutSaving = () => {
    clearEditing();
    router.dismissTo(HOME);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* No swipe-back: the edit queue is finished; the buttons drive navigation. */}
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.center}>
        {status === "saving" ? (
          <>
            <ActivityIndicator color="#2D6A4F" size="large" />
            <Text style={styles.title}>Saving your changes…</Text>
            <Text style={styles.sub}>Updating your profile.</Text>
          </>
        ) : (
          <>
            <View style={styles.errIcon}>
              <Ionicons name="cloud-offline-outline" size={34} color="#E63946" />
            </View>
            <Text style={styles.title}>Couldn&apos;t save</Text>
            <Text style={styles.sub}>{message}</Text>
            <View style={styles.actions}>
              <Button label="Try again" variant="primary" onPress={run} />
              <Button
                label="Go back without saving"
                variant="ghost"
                onPress={goBackWithoutSaving}
                style={styles.ghostBtn}
              />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 6 },
  errIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FDE8EA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { marginTop: 14, fontSize: 20, fontWeight: "700", color: "#16201C", textAlign: "center" },
  sub: { marginTop: 4, fontSize: 14.5, color: "#6B7280", lineHeight: 21, textAlign: "center" },
  actions: { alignSelf: "stretch", marginTop: 26, gap: 6 },
  ghostBtn: { marginTop: 2 },
});
