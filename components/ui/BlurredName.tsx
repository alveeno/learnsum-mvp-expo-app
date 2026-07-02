import { BlurView } from "expo-blur";
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

/**
 * A name that is revealed only to Deluxe tutors. When `revealed` is false the
 * real name is rendered but covered by a frosted `expo-blur` overlay (the same
 * technique the old analytics paywall used), so it reads as "blurred out".
 *
 * Used in the profile-viewers list and on the seeker profile — only the NAME is
 * gated; a seeker's category/preferences/location stay visible to every tier.
 *
 * The blur wrap shrink-wraps the text (so only the name is frosted, not the whole
 * row) and defaults to left alignment; pass `containerStyle={{ alignSelf:"center" }}`
 * for a centered context like the profile identity card.
 */
export function BlurredName({
  name,
  revealed,
  style,
  numberOfLines,
  containerStyle,
}: {
  name: string;
  revealed: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  if (revealed) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {name}
      </Text>
    );
  }
  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={style} numberOfLines={numberOfLines}>
        {name}
      </Text>
      {/* Frosted overlay hides the name; intensity tuned to be unreadable. */}
      <BlurView intensity={22} tint="light" style={StyleSheet.absoluteFill} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  // Shrink-wrap the text so the blur only covers the name, not the whole row.
  wrap: { alignSelf: "flex-start", borderRadius: 5, overflow: "hidden" },
});
