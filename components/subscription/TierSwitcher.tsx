import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { setTier, useTier, type Tier } from "./tierStore";
import { C } from "../tutor/tutorData";
import { tapLight } from "../ui/feedback";

/**
 * Temporary tier switcher (Free / Premium / Deluxe) for the Profile tab.
 *
 * A throwaway testing control — it flips the local mock `tierStore` so you can
 * see how each subscription tier behaves (contact reply gating, WhatsApp/WeChat
 * visibility, daily quota) without any real payment. Remove once a real
 * subscription/paywall is wired.
 */

const TIERS: { key: Tier; label: string; sub: string }[] = [
  { key: "free", label: "Free", sub: "0/day" },
  { key: "premium", label: "Premium", sub: "1/day" },
  { key: "deluxe", label: "Deluxe", sub: "3/day" },
];

export function TierSwitcher() {
  const tier = useTier();
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Ionicons name="flask-outline" size={14} color={C.muted} />
        <Text style={styles.label}>Test tier (temporary)</Text>
      </View>
      <View style={styles.segment}>
        {TIERS.map((t) => {
          const on = tier === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => {
                tapLight();
                setTier(t.key);
              }}
              style={[styles.seg, on && styles.segOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.segLabel, on && styles.segLabelOn]}>{t.label}</Text>
              <Text style={[styles.segSub, on && styles.segSubOn]}>{t.sub}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 22 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, marginLeft: 2 },
  label: { fontSize: 12.5, fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  segment: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  seg: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 11 },
  segOn: { backgroundColor: C.green },
  segLabel: { fontSize: 14.5, fontWeight: "800", color: C.ink },
  segLabelOn: { color: "#fff" },
  segSub: { fontSize: 11, fontWeight: "700", color: C.muted, marginTop: 2 },
  segSubOn: { color: "rgba(255,255,255,0.85)" },
});
