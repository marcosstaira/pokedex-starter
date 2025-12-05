
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { usePokemonDetails } from '../source/hooks/usePokemonDetails';

export default function DetailScreen() {

  const params = useLocalSearchParams();
  const name = typeof params.name === 'string' ? params.name : '';

  const router = useRouter();
  const navigation = useNavigation();


  const { pokemonDetails, loading, error } = usePokemonDetails(name);


  useEffect(() => {
    if (pokemonDetails?.name) {
      navigation.setOptions({ title: pokemonDetails.name });
    }
  }, [pokemonDetails, navigation]);


  if (loading) {
    return (
      <View style={styles.centered} accessibilityRole="alert" aria-busy={true}>
        <ActivityIndicator size="large" color="#e3350d" />
        <Text style={{ marginTop: 10 }}>Carregando detalhes...</Text>
      </View>
    );
  }


  if (error) {
    return (
      <View style={styles.centered} accessibilityRole="alert">
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Voltar" onPress={() => router.back()} />
      </View>
    );
  }


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.name} accessibilityRole="header">
          {pokemonDetails?.name || name}
        </Text>

        {pokemonDetails?.imageUrl ? (
          <Image
            source={{ uri: pokemonDetails.imageUrl }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={`Imagem oficial de ${pokemonDetails.name}`}
          />
        ) : (
          <Text style={styles.errorText}>Imagem indisponível</Text>
        )}


        <View style={styles.section} accessibilityLabel="Tipos do Pokémon">
          <Text style={styles.sectionTitle}>Tipos</Text>
          <View style={styles.row}>
            {pokemonDetails?.types?.map((type: string, index: number) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{type}</Text>
              </View>
            ))}
          </View>
        </View>


        <View style={styles.section} accessibilityLabel="Habilidades">
          <Text style={styles.sectionTitle}>Habilidades</Text>
          <Text style={styles.sectionContent}>
            {pokemonDetails?.abilities?.join(', ') || 'Nenhuma'}
          </Text>
        </View>


        <View style={styles.section} accessibilityLabel="Estatísticas base">
          <Text style={styles.sectionTitle}>Status Base</Text>
          {pokemonDetails?.stats?.map((stat: { name: string, value: number }, index: number) => (
            <View key={index} style={styles.statRow} accessibilityLabel={`${stat.name}: ${stat.value}`}>
              <Text style={styles.statName}>{stat.name}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 20, width: '100%' }}>
          <Button
            title="Voltar para a Lista"
            onPress={() => router.back()}
            color="#e3350d"
            accessibilityLabel="Voltar para a tela anterior"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', backgroundColor: '#fff', paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 32, fontWeight: 'bold', textTransform: 'capitalize', marginBottom: 10, textAlign: 'center', color: '#333' },
  image: { width: 220, height: 220, marginBottom: 20 },
  section: { width: '100%', marginBottom: 20, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#e3350d' },
  sectionContent: { fontSize: 16, textTransform: 'capitalize', color: '#555' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#fff', fontWeight: 'bold', textTransform: 'capitalize' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', paddingBottom: 4 },
  statName: { fontSize: 16, textTransform: 'capitalize', color: '#666' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  errorText: { marginBottom: 10, color: 'red', textAlign: 'center' },
});