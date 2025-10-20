import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator, Button,
    FlatList,
    Image, Keyboard,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const API_URL = 'https://pokeapi.co/api/v2/pokemon';

export default function HomeScreen() {
  const [pokemonList, setPokemonList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const loadPokemonPage = async (pageOffset = 0) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}?limit=20&offset=${pageOffset}`);
      if (!response.ok) throw new Error('Falha ao carregar a lista de Pokémon.');
      const data = await response.json();
      const detailPromises = data.results.map(p => fetch(p.url).then(res => res.json()));
      const detailedPokemonData = await Promise.all(detailPromises);
      setPokemonList(detailedPokemonData);
      setOffset(pageOffset);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const query = searchTerm.trim().toLowerCase();
    Keyboard.dismiss();

    if (!query) {
      handleReturnToList();
      return;
    }

    setLoading(true);
    setError(null);
    setPokemonList([]); 

    try {
      const response = await fetch(`${API_URL}/${query}`);
      
      if (response.ok) {
        const data = await response.json();
        router.push(`/${data.name}`);
        setSearchTerm('');

        loadPokemonPage(offset); 
      } else if (response.status === 404) {
       
        setError(`O Pokémon "${searchTerm}" não foi encontrado.`);
      } else {
        throw new Error('Ocorreu um erro na busca.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToList = () => {
    setError(null);
    setSearchTerm('');
    loadPokemonPage(0);
  };

  useEffect(() => {
    loadPokemonPage(0);
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => router.push(`/${item.name}`)}>
      <Image source={{ uri: item.sprites.front_default }} style={styles.itemImage} />
      <Text style={styles.itemText}>{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar nome exato..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Button title="Buscar" onPress={handleSearch} color="#3b4cca" />
      </View>
      
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#e3350d" />
          <Text>Carregando...</Text>
        </View>
      )}
      
      {error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          {error.includes("não foi encontrado") ? (
            <Button title="Voltar à Lista" onPress={handleReturnToList} />
          ) : (
            <Button title="Tentar Novamente" onPress={() => loadPokemonPage(offset)} />
          )}
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={pokemonList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {!loading && !error && pokemonList.length > 0 && (
        <View style={styles.paginationContainer}>
          <Button
            title="Anterior"
            onPress={() => loadPokemonPage(Math.max(0, offset - 20))}
            disabled={offset === 0}
          />
          <Button
            title="Próxima"
            onPress={() => loadPokemonPage(offset + 20)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  searchContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginRight: 10 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ddd', backgroundColor: '#fff' },
  itemImage: { width: 50, height: 50, marginRight: 15 },
  itemText: { fontSize: 18, textTransform: 'capitalize' },
  paginationContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#f0f0f0', borderTopWidth: 1, borderTopColor: '#ccc' },
  errorText: { marginBottom: 15, color: 'red', fontSize: 16, textAlign: 'center' },
});