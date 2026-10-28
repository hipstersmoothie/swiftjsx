import { useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useNavigation, ScrollView, LazyVGrid, VStack, ZStack, Text, Image, Button, Label, ContextMenu,
} from "swiftjsx";
import { artwork, displayName, formatNumber, pokemonQuery, type Entry } from "./api";
import { useFavorites, useIsFavorite } from "./favorites";
import { typeColor, withOpacity } from "./theme";
import { DetailScreen } from "./DetailScreen";

/** Start loading more when one of the last this-many cards appears. */
const END_THRESHOLD = 6;

export function PokemonGrid({ entries, onEndReached, footer }: { entries: Entry[]; onEndReached?(): void; footer?: ReactNode }) {
  // Several cards near the end can appear in the same frame; ask once per length.
  const endReachedAt = useRef(-1);
  const reachEnd = () => {
    if (!onEndReached || endReachedAt.current === entries.length) return;
    endReachedAt.current = entries.length;
    onEndReached();
  };

  return (
    <ScrollView>
      <LazyVGrid columns={{ minimum: 110 }} spacing={12} padding={{ horizontal: 16, top: 8 }}>
        {entries.map((entry, i) => (
          <PokemonCard key={entry.id} entry={entry} onAppear={i >= entries.length - END_THRESHOLD ? reachEnd : undefined} />
        ))}
      </LazyVGrid>
      <VStack padding={{ vertical: 16 }} frame={{ maxWidth: "infinity" }}>{footer}</VStack>
    </ScrollView>
  );
}

function PokemonCard({ entry, onAppear }: { entry: Entry; onAppear?(): void }) {
  const nav = useNavigation();
  // React renders every card in the grid, not just the visible ones, so only
  // fetch the details (for the type tint) once SwiftUI actually shows the card.
  const [visible, setVisible] = useState(false);
  const { data: pokemon } = useQuery({ ...pokemonQuery(entry.id), enabled: visible });
  const favorite = useIsFavorite(entry.id);
  const toggleFavorite = useFavorites((s) => s.toggle);
  const name = displayName(entry.name);

  return (
    <Button
      buttonStyle="plain"
      onPress={() => nav.push(<DetailScreen entry={entry} />)}
      // The detail screen zooms out of this card (and back into it).
      transitionSource={`pokemon-${entry.id}`}
      accessibilityIdentifier="pokemon-card"
      accessibilityLabel={`${name}, ${formatNumber(entry.id)}${favorite ? ", favorite" : ""}`}
    >
      <ZStack alignment="topTrailing" animation="bouncy">
        <VStack
          spacing={2}
          padding={10}
          frame={{ maxWidth: "infinity" }}
          background={pokemon ? withOpacity(typeColor(pokemon.types[0]), 0.22) : "tertiarySystemFill"}
          cornerRadius={18}
          animation="smooth"
          onAppear={() => {
            setVisible(true);
            onAppear?.();
          }}
        >
          <Image src={artwork(entry.id)} contentMode="fit" frame={{ width: 88, height: 88 }} cornerRadius={8} />
          <Text font="subheadline" fontWeight="semibold" lineLimit={1} padding={{ top: 4 }}>{name}</Text>
          <Text font="caption" fontDesign="monospaced" foregroundStyle="secondary">{formatNumber(entry.id)}</Text>
        </VStack>
        {favorite ? <Image systemName="heart.fill" font="caption" foregroundStyle="pink" padding={10} transition="scale" /> : null}
      </ZStack>
      <ContextMenu>
        <Button onPress={() => toggleFavorite(entry)}>
          <Label title={favorite ? "Unfavorite" : "Favorite"} systemImage={favorite ? "heart.slash" : "heart"} />
        </Button>
      </ContextMenu>
    </Button>
  );
}
