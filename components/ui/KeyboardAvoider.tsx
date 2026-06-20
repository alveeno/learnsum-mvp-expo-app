import { type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

/**
 * Lifts form content above the on-screen keyboard so it never covers an input
 * (or a pinned footer button). On iOS `behavior="padding"` shrinks the view by
 * the keyboard's height: any footer rises and the inner ScrollView scrolls the
 * focused field into the space that's left. Built into React Native — no native
 * module, so no EAS rebuild (see CLAUDE.md).
 *
 * Drop it directly inside a screen's <SafeAreaView> (it fills with flex: 1) and
 * put the header / ScrollView / footer inside it. Bottom sheets handle the
 * keyboard themselves (they pin to its top — see components/ui/BottomSheet.tsx).
 */
export function KeyboardAvoider({
  children,
  style,
  offset = 0,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Extra gap between the keyboard and the lifted content, if needed. */
  offset?: number;
}) {
  return (
    <KeyboardAvoidingView
      style={[styles.fill, style]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={offset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
