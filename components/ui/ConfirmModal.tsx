import { MaterialIcons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Button } from "./Button";

/**
 * Centred confirmation dialog (a warning "Are you sure?" pop-up).
 *
 * A dimmed backdrop with a white card: a gold warning badge, a title, a short
 * message, a primary action button and a low-emphasis cancel button. Tapping the
 * backdrop (or the Android back button) is treated as Cancel.
 *
 * Purely presentational and reusable — callers own the `visible` flag and the
 * two handlers (see useSkipGuard for the Skip-confirmation usage).
 */
export type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onCancel}
          accessibilityLabel={cancelLabel}
        />
        <View style={styles.card}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <MaterialIcons name="priority-high" size={20} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Button
            label={confirmLabel}
            variant="primary"
            onPress={onConfirm}
            style={styles.btn}
          />
          <Button
            label={cancelLabel}
            variant="ghost"
            onPress={onCancel}
            style={styles.btn}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
  },
  iconOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FBEBCB", // pale gold ring
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },
  iconInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F4A923", // Accent / Gold
    alignItems: "center",
    justifyContent: "center",
  },
  title: { textAlign: "center", fontSize: 19, fontWeight: "700", color: "#16201C" },
  message: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14.5,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 18,
  },
  btn: { marginTop: 8 },
});
