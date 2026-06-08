import "../global.css";

import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { LanguageProvider } from "../components/i18n/LanguageProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
