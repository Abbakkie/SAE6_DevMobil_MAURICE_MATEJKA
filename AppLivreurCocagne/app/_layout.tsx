import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    return (
        <>
            <Stack screenOptions={{ headerShown: false }}>
                {/* On force l'affichage de l'index (ton app livreur) */}
                <Stack.Screen name="index" />
            </Stack>
            <StatusBar style="light" />
        </>
    );
}
