import { usePokemonList } from '@/source/hooks/usePokemonList';
import { Href, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItem,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';


interface PokemonType {
  type: {
    name: string;
    url: string;
  };
}

interface PokemonData {
  id: number;
  name: string;
  url: string;
  sprites?: {
    front_default: string;
    other?: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
  types: PokemonType[];
}

export default function HomeScreen() {
  const {
    data, loading, error, loadMore,
    searchQuery, handleSearch, isOffline, retry,
    types, selectedType, handleTypeSelect
  } = usePokemonList();

  const router = useRouter();

  const renderItem: ListRenderItem<PokemonData> = ({ item }) => (
    <TouchableOpacity
      style={styles.card}

      onPress={() => router.push(`/${item.name}` as Href)}
      activeOpacity={0.7}
      accessibilityLabel={`Ver detalhes de ${item.name}`}
      accessibilityRole="button"
    >
      <Image
        source={{ uri: item.sprites?.other?.['official-artwork']?.front_default || item.sprites?.front_default }}
        style={styles.image}
        accessibilityLabel={`Imagem de ${item.name}`}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.types}>
          {item.types.map((t) => (
            <Text key={t.type.name} style={styles.typeBadge}>
              {t.type.name}
            </Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner} accessibilityRole="alert">
          <Text style={styles.offlineText}>Você está offline</Text>
        </View>
      )}

      <View style={styles.header}>
        <TextInput
          style={styles.input}
          placeholder="Buscar Pokémon..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          accessibilityLabel="Campo de busca por nome"
        />


        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typeList}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {types.map((type) => (
              <TouchableOpacity
                key={type.name}
                style={[
                  styles.typeChip,
                  selectedType === type.name && styles.typeChipSelected
                ]}
                onPress={() => handleTypeSelect(type.name)}
                accessibilityLabel={`Filtrar por tipo ${type.name}`}
                accessibilityState={{ selected: selectedType === type.name }}
                hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
              >
                <Text style={[
                  styles.typeText,
                  selectedType === type.name && styles.typeTextSelected
                ]}>
                  {type.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {error && !loading && data.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={retry}
            style={styles.retryBtn}
            accessibilityLabel="Tentar carregar novamente"
            accessibilityRole="button"
          >
            <Text style={{ color: '#fff' }}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading ? <ActivityIndicator size="large" color="#e3350d" accessibilityLabel="Carregando pokémons" /> : <View style={{ height: 50 }} />
          }
          contentContainerStyle={{ padding: 10 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  offlineBanner: { backgroundColor: '#333', padding: 5, alignItems: 'center' },
  offlineText: { color: '#fff', fontSize: 12 },
  header: { padding: 10, backgroundColor: '#fff', elevation: 2 },
  input: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 10, marginBottom: 10, height: 45 },

  typeList: { flexDirection: 'row', marginBottom: 5 },
  typeChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  typeChipSelected: {
    backgroundColor: '#e3350d',
    borderColor: '#e3350d'
  },
  typeText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  typeTextSelected: { color: '#fff' },

  card: { flexDirection: 'row', backgroundColor: '#fff', marginBottom: 10, borderRadius: 10, padding: 10, elevation: 3 },
  image: { width: 80, height: 80 },
  info: { marginLeft: 10, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize' },
  types: { flexDirection: 'row', marginTop: 5 },
  typeBadge: { backgroundColor: '#eee', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 5, fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', marginBottom: 10 },
  retryBtn: { backgroundColor: '#e3350d', padding: 10, borderRadius: 5 }
});