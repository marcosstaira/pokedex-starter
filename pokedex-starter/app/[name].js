import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator, Button,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';


const findPortugueseName = (namesArray) => {
  if (!Array.isArray(namesArray)) return null;
  const ptNameObject = namesArray.find(item => item.language.name === 'pt');
  return ptNameObject ? ptNameObject.name : null;
};

export default function DetailScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  const [pokemonDetails, setPokemonDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!name) return;

    const fetchAllDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        if (!pokemonResponse.ok) throw new Error(`Pokémon "${name}" não encontrado.`);
        const pokemonData = await pokemonResponse.json();

        const urlsToFetch = [
          pokemonData.species.url,
          ...pokemonData.types.map(t => t.type.url),
          ...pokemonData.abilities.map(a => a.ability.url),
          ...pokemonData.stats.map(s => s.stat.url),
        ];

        const responses = await Promise.all(urlsToFetch.map(url => fetch(url).then(res => res.json())));
        
        const speciesData = responses[0];
        const typesDetails = responses.slice(1, 1 + pokemonData.types.length);
        const abilitiesDetails = responses.slice(1 + pokemonData.types.length, 1 + pokemonData.types.length + pokemonData.abilities.length);
        const statsDetails = responses.slice(1 + pokemonData.types.length + pokemonData.abilities.length);

        const translatedPokemonName = findPortugueseName(speciesData.names) || pokemonData.name;

  
        const finalDetails = {
          name: translatedPokemonName,
          imageUrl: pokemonData.sprites.other?.['official-artwork']?.front_default || pokemonData.sprites.front_default,
          
          types: pokemonData.types
            .map((t, i) => findPortugueseName(typesDetails[i].names) || t.type.name)
            .filter(Boolean), // .filter(Boolean) remove quaisquer itens nulos, indefinidos ou vazios.

          abilities: pokemonData.abilities
            .map((a, i) => findPortugueseName(abilitiesDetails[i].names) || a.ability.name)
            .filter(Boolean), // Garante que o array contenha apenas strings válidas.

          stats: pokemonData.stats.map((s, i) => ({
            name: findPortugueseName(statsDetails[i].names) || s.stat.name,
            value: s.base_stat,
          })),
        };
        
        setPokemonDetails(finalDetails);
        navigation.setOptions({ title: translatedPokemonName });

      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDetails();
  }, [name]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#e3350d" /><Text>Buscando dados...</Text></View>;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Voltar para a Lista" onPress={() => router.back()} />
      </View>
    );
  }

  // Não renderiza nada se os detalhes ainda não estiverem prontos
  if (!pokemonDetails) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{pokemonDetails.name}</Text>
      
      {pokemonDetails.imageUrl ? (
        <Image source={{ uri: pokemonDetails.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.noImageContainer}><Text>Sem Imagem</Text></View>
      )}

      {/* --- RENDERIZAÇÃO SEGURA --- */}
      {/* Verifica se o array tem itens antes de tentar juntá-los */}
      {pokemonDetails.types.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipos</Text>
          <Text style={styles.sectionContent}>{pokemonDetails.types.join(', ')}</Text>
        </View>
      )}

      {pokemonDetails.abilities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habilidades</Text>
          <Text style={styles.sectionContent}>{pokemonDetails.abilities.join(', ')}</Text>
        </View>
      )}

      {pokemonDetails.stats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Base</Text>
          {pokemonDetails.stats.map((stat, index) => (
            // Usar o índice como parte da chave a torna 100% única e segura
            <Text key={`${stat.name}-${index}`} style={styles.statItem}>
              {stat.name.replace('-', ' ')}: {stat.value}
            </Text>
          ))}
        </View>
      )}
      
      <Button title="Voltar para a Lista" onPress={() => router.back()} />
    </ScrollView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 28, fontWeight: 'bold', textTransform: 'capitalize', marginBottom: 10, textAlign: 'center' },
  image: { width: 200, height: 200, marginBottom: 20 },
  noImageContainer: { width: 200, height: 200, marginBottom: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  section: { width: '100%', marginBottom: 15, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 5 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, color: '#3b4cca' },
  sectionContent: { fontSize: 16, textTransform: 'capitalize' },
  statItem: { fontSize: 16, textTransform: 'capitalize' },
  errorText: { marginBottom: 10, color: 'red', textAlign: 'center' },
});