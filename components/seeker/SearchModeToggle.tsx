import { Pressable, StyleSheet, Text, View } from "react-native";

import { C } from "../tutor/tutorData";
import { tapLight } from "../ui/feedback";

/** Tutors / Students segmented toggle for the Search tabs. */
export type SearchMode = "tutors" | "students";

export function SearchModeToggle({ mode, onChange }: { mode: SearchMode; onChange: (m: SearchMode) => void }) {
  return (
    <View style={styles.wrap}>
      {(["tutors", "students"] as const).map((m) => {
        const on = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => {
              if (m !== mode) {
                tapLight();
                onChange(m);
              }
            }}
            style={[styles.seg, on && styles.segOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.segText, on && styles.segTextOn]}>{m === "tutors" ? "Tutors" : "Students"}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", gap: 6, backgroundColor: C.surface, borderRadius: 14, padding: 5, borderWidth: 1, borderColor: C.hairline },
  seg: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 9, borderRadius: 10 },
  segOn: { backgroundColor: C.green },
  segText: { fontSize: 14, fontWeight: "800", color: C.ink },
  segTextOn: { color: "#fff" },
});
