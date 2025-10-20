// app/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

// Este arquivo define a navegação principal do aplicativo
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#e3350d' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      {/* Define 'app/index.js' como a tela inicial com o título 'Pokédex' */}
      <Stack.Screen
        name="index"
        options={{ title: 'Pokédex' }}
      />
      {/* Define 'app/[name].js' como a tela de detalhes */}
      <Stack.Screen
        name="[name]"
        options={{ title: 'Detalhes do Pokémon' }}
      />
    </Stack>
  );
}