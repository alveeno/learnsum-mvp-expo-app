/**
 * Public tutor profile — `/tutors/[slug]`.
 *
 * A real, shareable route (unlike the in-shell overlay `TutorProfileView`) for
 * the seeker side: tapping a tutor anywhere in the seeker shell pushes here. It
 * reuses the shared `TutorProfileContent` (bio/feed body + WhatsApp/WeChat
 * contact, fed by `GET /api/tutors/[slug]` with a sample-data fallback), and adds
 * a Save action bar wired to the shared saved-tutor store so the bookmark stays
 * in sync with the Saved tab.
 *
 * English-only, sample-data fallback (see CLAUDE.md).
 */
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text } from "react-native";

import { useSavedTutors } from "../../components/seeker/savedTutors";
import { TutorProfileContent } from "../../components/tutor/TutorProfileContent";
import { C } from "../../components/tutor/tutorData";
import { tapLight } from "../../components/ui/feedback";

export default function PublicTutorProfile() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const id = slug ?? "";
  const { ids, toggle } = useSavedTutors();
  const saved = ids.has(id);

  return (
    <SafeAreaView style={styles.safe}>
      <TutorProfileContent
        id={id}
        onBack={() => router.back()}
        contactMode="seeker"
        actions={
          <Pressable
            onPress={() => {
              tapLight();
              toggle(id);
            }}
            style={[styles.saveBar, saved ? styles.saveOn : styles.saveOff]}
            accessibilityRole="button"
            accessibilityLabel={saved ? "Saved" : "Save tutor"}
          >
            <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={18} color={saved ? "#fff" : C.green} />
            <Text style={[styles.saveText, { color: saved ? "#fff" : C.green }]}>{saved ? "Saved" : "Save tutor"}</Text>
          </Pressable>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  saveBar: {
    height: 46,
    borderRadius: 23,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveOn: { backgroundColor: C.green },
  saveOff: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: C.green },
  saveText: { fontSize: 14.5, fontWeight: "800" },
});
