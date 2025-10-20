
import { Stack } from 'expo-router';
import React from 'react';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#e3350d' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >

      <Stack.Screen
        name="index"
        options={{ title: 'Pokédex' }}
      />
      <Stack.Screen
        name="[name]"
        options={{ title: 'Detalhes do Pokémon' }}
      />
    </Stack>
  );
}