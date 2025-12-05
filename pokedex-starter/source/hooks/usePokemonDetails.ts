import { useEffect, useState } from 'react';
import { PokeApi, fetchInChunks } from '../api/pokeApi';

const findPortugueseName = (namesArray: any[]) => {
    if (!Array.isArray(namesArray)) return null;
    const ptNameObject = namesArray.find((item: any) => item.language.name === 'pt-BR' || item.language.name === 'pt');
    return ptNameObject ? ptNameObject.name : null;
};

export function usePokemonDetails(name: string) {
    const [pokemonDetails, setPokemonDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        if (!name) return;


        const controller = new AbortController();

        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {

                const pokemonData = await PokeApi.getPokemonDetail(name, controller.signal);


                const urlsToFetch = [
                    pokemonData.species.url,
                    ...pokemonData.types.map((t: any) => t.type.url),
                    ...pokemonData.abilities.map((a: any) => a.ability.url),
                    ...pokemonData.stats.map((s: any) => s.stat.url),
                ];


                const responses = await fetchInChunks(urlsToFetch, 5, (url) =>
                    PokeApi.getPokemonDetail(url, controller.signal)
                );


                const speciesData = responses[0];

                let currentIndex = 1;


                const typesCount = pokemonData.types.length;
                const typesDetails = responses.slice(currentIndex, currentIndex + typesCount);
                currentIndex += typesCount;


                const abilitiesCount = pokemonData.abilities.length;
                const abilitiesDetails = responses.slice(currentIndex, currentIndex + abilitiesCount);
                currentIndex += abilitiesCount;


                const statsDetails = responses.slice(currentIndex);


                const translatedName = findPortugueseName(speciesData.names) || pokemonData.name;


                const finalDetails = {
                    name: translatedName,
                    originalName: pokemonData.name,
                    id: pokemonData.id,
                    imageUrl: pokemonData.sprites.other?.['official-artwork']?.front_default || pokemonData.sprites.front_default,

                    types: pokemonData.types.map((t: any, i: number) =>
                        findPortugueseName(typesDetails[i]?.names) || t.type.name
                    ),

                    abilities: pokemonData.abilities.map((a: any, i: number) =>
                        findPortugueseName(abilitiesDetails[i]?.names) || a.ability.name
                    ),

                    stats: pokemonData.stats.map((s: any, i: number) => ({
                        name: findPortugueseName(statsDetails[i]?.names) || s.stat.name,
                        value: s.base_stat,
                    })),
                };

                setPokemonDetails(finalDetails);

            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setError(err.message || 'Erro ao carregar detalhes');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadData();


        return () => controller.abort();
    }, [name]);

    return { pokemonDetails, loading, error };
}