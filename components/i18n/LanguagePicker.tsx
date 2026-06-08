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

  const current = LANGUAGES.find((l) => l.id === lang);
  const currentName = current ? current.native || current.label : "";
  const buttonText = t("lang.button", { lang: currentName });

  return (
    <>
      <Pressable
        style={[styles.pill, style]}
        hitSlop={8}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={buttonText}
      >
        <Ionicons name="globe-outline" size={20} color="#2D6A4F" />
        <Text style={styles.pillText}>{buttonText}</Text>
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
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#F9F9F7",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pillText: { fontSize: 14, fontWeight: "700", color: "#2D6A4F" },
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
