import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { BottomSheet } from "../ui/BottomSheet";
import { useLanguage } from "./LanguageProvider";
import { LANGUAGES } from "./translations";

/**
 * Globe button that opens a bottom-sheet of languages. Tapping one switches the
 * whole app instantly (the active language shows a green check). Drop it onto any
 * screen; pass `style` to position the globe button.
 */
export function LanguagePicker({ style }: { style?: StyleProp<ViewStyle> }) {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        style={[styles.globe, style]}
        hitSlop={8}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t("lang.title")}
      >
        <Ionicons name="globe-outline" size={20} color="#2D6A4F" />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={t("lang.title")}>
        <View style={styles.list}>
          {LANGUAGES.map((l) => {
            const on = l.id === lang;
            return (
              <TouchableOpacity
                key={l.id}
                style={[styles.row, on && styles.rowOn]}
                activeOpacity={0.85}
                onPress={() => {
                  setLang(l.id);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={styles.rowText}>
                  {l.label}
                  {l.native ? ` · ${l.native}` : ""}
                </Text>
                {on ? (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  globe: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#F9F9F7",
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingBottom: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 58,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#F7F7F5",
    marginBottom: 10,
  },
  rowOn: { backgroundColor: "#E8F1EC" },
  rowText: { flex: 1, fontSize: 16, fontWeight: "600", color: "#16201C" },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2D6A4F",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
});
