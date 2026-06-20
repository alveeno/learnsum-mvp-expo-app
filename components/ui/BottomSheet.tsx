import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type KeyboardEvent,
} from "react-native";

/**
 * Bottom sheet with an INSTANT full-screen dim and a slide-up panel that PINS to
 * the top of the keyboard — and to the screen bottom when no keyboard is shown —
 * so there is never an empty gap between the panel and the keyboard (or below it).
 *
 * The keyboard is tracked with JS `Keyboard` events (no native module / EAS
 * rebuild, per CLAUDE.md) and the panel is lifted by the keyboard's height with
 * an Animated transform, so it behaves the same on iOS and Android. This replaces
 * the earlier `KeyboardAvoidingView`, which mis-measured inside a `Modal` and
 * left the panel floating above the keyboard.
 */

// Any value taller than the panel — the panel starts fully off-screen below.
const SLIDE_FROM = 1000;

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const slide = useRef(new Animated.Value(SLIDE_FROM)).current;
  const kb = useRef(new Animated.Value(0)).current;
  const [kbHeight, setKbHeight] = useState(0);

  // Slide the panel in on open; snap it away (and clear any keyboard lift) on close.
  useEffect(() => {
    if (visible) {
      Animated.timing(slide, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      slide.setValue(SLIDE_FROM);
      kb.setValue(0);
      setKbHeight(0);
    }
  }, [visible, slide, kb]);

  // Pin the panel to the keyboard. iOS gets the "will" events (the panel moves in
  // lockstep with the keyboard); Android only fires the "did" events.
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const lift = (h: number, duration: number) => {
      setKbHeight(h);
      Animated.timing(kb, { toValue: h, duration, useNativeDriver: true }).start();
    };
    const onShow = (e: KeyboardEvent) => lift(e.endCoordinates?.height ?? 0, e.duration || 250);
    const onHide = (e: KeyboardEvent) => lift(0, e?.duration || 200);
    const showSub = Keyboard.addListener(showEvt, onShow);
    const hideSub = Keyboard.addListener(hideEvt, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [kb]);

  // Inner padding clears the home indicator only when the keyboard is hidden.
  const padBottom = kbHeight > 0 ? 14 : 28;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: padBottom,
              transform: [{ translateY: Animated.subtract(slide, kb) }],
            },
          ]}
        >
          <View style={styles.grabber} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "rgba(0,0,0,0.42)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    // Keep child backgrounds within the rounded top corners.
    overflow: "hidden",
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#16201C",
    textAlign: "center",
    marginBottom: 12,
  },
});
