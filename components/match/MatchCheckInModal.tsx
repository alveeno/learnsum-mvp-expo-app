import { MaterialIcons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { C } from "../tutor/tutorData";
import { tapMedium } from "../ui/feedback";

/**
 * "Did you start having lessons with [name]?" Yes/No dialog.
 *
 * Shown when a seeker tries to contact a *new* tutor while a previous match
 * question is still unanswered — they must resolve the old one first. Green Yes /
 * red No, both clear the pending contact.
 */
export function MatchCheckInModal({
  visible,
  name,
  onYes,
  onNo,
}: {
  visible: boolean;
  name: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onNo}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconOuter}>
            <MaterialIcons name="school" size={26} color={C.greenD} />
          </View>
          <Text style={styles.title}>Did you start having lessons?</Text>
          <Text style={styles.message}>
            Let us know how it went with <Text style={styles.name}>{name}</Text> before you reach out to
            another tutor.
          </Text>
          <View style={styles.row}>
            <Pressable
              style={[styles.btn, styles.no]}
              onPress={() => {
                tapMedium();
                onNo();
              }}
              accessibilityRole="button"
              accessibilityLabel="No"
            >
              <Text style={styles.btnText}>No</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.yes]}
              onPress={() => {
                tapMedium();
                onYes();
              }}
              accessibilityRole="button"
              accessibilityLabel="Yes"
            >
              <Text style={styles.btnText}>Yes</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.42)", alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 22, padding: 22, alignItems: "center" },
  iconOuter: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.greenTint, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { textAlign: "center", fontSize: 19, fontWeight: "800", color: C.ink },
  message: { textAlign: "center", color: C.muted, fontSize: 14.5, lineHeight: 21, marginTop: 8, marginBottom: 18 },
  name: { fontWeight: "800", color: C.ink },
  row: { flexDirection: "row", gap: 10, alignSelf: "stretch" },
  btn: { flex: 1, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  yes: { backgroundColor: C.green },
  no: { backgroundColor: C.destructive },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
