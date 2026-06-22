import { type ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { tapLight } from "./feedback";

/**
 * A Pressable that springs down slightly while held (Reanimated) and fires a
 * light haptic on press — a tactile, "alive" feel. Drop-in where a plain
 * Pressable is used; `haptic={false}` opts out of the buzz.
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
};

const SPRING = { damping: 18, stiffness: 320, mass: 0.5 };

export function PressableScale({ children, onPress, style, haptic = true, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.95, SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING);
      }}
      onPress={
        onPress
          ? (e) => {
              if (haptic) tapLight();
              onPress(e);
            }
          : undefined
      }
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
