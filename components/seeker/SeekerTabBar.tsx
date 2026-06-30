/**
 * Seeker (student/parent) bottom tab bar — Home / Search / Chat / Saved / Account.
 *
 * Same visual language as the tutor `TabBar` (filled green glyph when active,
 * grey outline when not) but a seeker-appropriate tab set: no Analytics/Premium
 * lock; Saved shows a small count badge.
 */
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { C } from "../tutor/tutorData";

export type SeekerTabId = "home" | "search" | "chat" | "saved" | "account";

const TABS: { id: SeekerTabId; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { id: "home", icon: "home", label: "Home" },
  { id: "search", icon: "search", label: "Search" },
  { id: "chat", icon: "chatbubble-ellipses", label: "Chat" },
  { id: "saved", icon: "bookmark", label: "Saved" },
  { id: "account", icon: "person", label: "Profile" },
];

export function SeekerTabBar({
  tab,
  onSelect,
  savedCount,
  bottomInset,
}: {
  tab: SeekerTabId;
  onSelect: (id: SeekerTabId) => void;
  savedCount: number;
  bottomInset: number;
}) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(bottomInset, 6) }]}>
      {TABS.map((tb) => {
        const on = tb.id === tab;
        const iconName = (on ? tb.icon : `${tb.icon}-outline`) as keyof typeof Ionicons.glyphMap;
        const showCount = tb.id === "saved" && savedCount > 0;
        return (
          <Pressable key={tb.id} onPress={() => onSelect(tb.id)} style={styles.item}>
            <View>
              <Ionicons name={iconName} size={24} color={on ? C.green : C.unselIc} />
              {showCount && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{savedCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, { color: on ? C.green : C.unselIc, fontWeight: on ? "700" : "600" }]}>
              {tb.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 7,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
    backgroundColor: "#fff",
  },
  item: { alignItems: "center", gap: 3, paddingHorizontal: 6 },
  label: { fontSize: 10 },
  countBadge: {
    position: "absolute",
    top: -4,
    right: -7,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  countText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
