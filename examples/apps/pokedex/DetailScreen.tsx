import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Screen, ToolbarItem, ScrollView, VStack, HStack, Text, Image, Button, ProgressView, Divider, Spacer, ContentUnavailable, format,
  type Color,
} from "swiftjsx";
import { artwork, capitalize, displayName, formatNumber, pokemonQuery, speciesQuery, type Entry, type Pokemon, type Species } from "./api";
import { useFavorites, useIsFavorite } from "./favorites";
import { MAX_STAT, statLabels, typeColor, withOpacity } from "./theme";

export function DetailScreen({ entry }: { entry: Entry }) {
  // Usually instant: the grid card already fetched this for its tint.
  const pokemon = useQuery(pokemonQuery(entry.id));
  // Forms (Mega, regional…) share their species' text, so it's keyed by species.
  const species = useQuery({ ...speciesQuery(pokemon.data?.speciesId ?? 0), enabled: pokemon.data != null });
  const favorite = useIsFavorite(entry.id);
  const toggleFavorite = useFavorites((s) => s.toggle);
  const color = typeColor(pokemon.data?.types[0]);
  const name = displayName(entry.name);

  return (
    <Screen title={name} titleDisplayMode="inline" zoomFrom={`pokemon-${entry.id}`}>
      <ToolbarItem placement="primaryAction">
        <Button
          onPress={() => toggleFavorite(entry)}
          accessibilityLabel={favorite ? "Unfavorite" : "Favorite"}
          accessibilityIdentifier="favorite-button"
        >
          <Image systemName={favorite ? "heart.fill" : "heart"} foregroundStyle={favorite ? "pink" : "accent"} />
        </Button>
      </ToolbarItem>
      <ScrollView background={{ gradient: [withOpacity(color, 0.55), withOpacity(color, 0.12), "clear"] }}>
        <VStack spacing={16} padding={{ horizontal: 16, bottom: 32 }} animation="smooth">
          <Hero entry={entry} name={name} pokemon={pokemon.data} genus={species.data?.genus} />
          {pokemon.isPending ? (
            <ProgressView padding={24} />
          ) : pokemon.isError ? (
            <ContentUnavailable systemImage="wifi.exclamationmark" title="Couldn’t Load Pokémon" description={pokemon.error.message}>
              <Button title="Try Again" buttonStyle="bordered" onPress={() => pokemon.refetch()} />
            </ContentUnavailable>
          ) : (
            <>
              <About pokemon={pokemon.data} species={species.data} loading={species.isPending} />
              <Abilities pokemon={pokemon.data} color={color} />
              <Stats pokemon={pokemon.data} color={color} />
            </>
          )}
        </VStack>
      </ScrollView>
    </Screen>
  );
}

function Hero({ entry, name, pokemon, genus }: { entry: Entry; name: string; pokemon?: Pokemon; genus?: string | null }) {
  return (
    <VStack spacing={4}>
      <Image
        src={artwork(entry.id)}
        contentMode="fit"
        frame={{ width: 240, height: 240 }}
        shadow={{ radius: 16, y: 10, color: "#0000004d" }}
        accessibilityLabel={`${name} artwork`}
      />
      <Text font="subheadline" fontDesign="monospaced" foregroundStyle="secondary">{formatNumber(entry.id)}</Text>
      <Text font="largeTitle" fontWeight="bold" textAlignment="center" accessibilityIdentifier="pokemon-name">{name}</Text>
      {genus ? <Text font="subheadline" foregroundStyle="secondary">{genus}</Text> : null}
      {pokemon ? (
        <HStack spacing={8} padding={{ top: 8 }}>
          {pokemon.types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </HStack>
      ) : null}
    </VStack>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <Text
      font="subheadline"
      fontWeight="semibold"
      foregroundStyle="white"
      padding={{ horizontal: 14, vertical: 6 }}
      background={typeColor(type)}
      cornerRadius="capsule"
      shadow={{ radius: 3, y: 2, color: "#00000026" }}
    >
      {capitalize(type)}
    </Text>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <VStack
      alignment="leading"
      spacing={12}
      padding={16}
      frame={{ maxWidth: "infinity", alignment: "leading" }}
      background="regularMaterial"
      cornerRadius={20}
    >
      <Text font="headline" accessibilityTraits="header">{title}</Text>
      {children}
    </VStack>
  );
}

function About({ pokemon, species, loading }: { pokemon: Pokemon; species?: Species; loading: boolean }) {
  return (
    <Card title="About">
      {loading ? <ProgressView frame={{ maxWidth: "infinity" }} /> : null}
      {species?.flavorText ? <Text font="callout">{species.flavorText}</Text> : null}
      <HStack>
        <Metric label="Height" value={measure(pokemon.height / 10, "meter")} />
        <Divider frame={{ height: 32 }} />
        <Metric label="Weight" value={measure(pokemon.weight / 10, "kilogram")} />
        <Divider frame={{ height: 32 }} />
        <Metric label="Base XP" value={pokemon.baseExperience?.toString() ?? "—"} />
      </HStack>
    </Card>
  );
}

const measure = (value: number, unit: string) =>
  format.number(value, { style: "unit", unit, minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <VStack spacing={2} frame={{ maxWidth: "infinity" }} accessibilityElement="combine">
      <Text font="title3" fontWeight="semibold" monospacedDigit>{value}</Text>
      <Text font="caption" foregroundStyle="secondary">{label}</Text>
    </VStack>
  );
}

function Abilities({ pokemon, color }: { pokemon: Pokemon; color: Color }) {
  return (
    <Card title="Abilities">
      {pokemon.abilities.map((ability) => (
        <HStack key={ability.name} spacing={10}>
          <Image systemName={ability.hidden ? "eye.slash" : "sparkles"} foregroundStyle={ability.hidden ? "secondary" : color} frame={{ width: 22 }} />
          <Text>{displayName(ability.name)}</Text>
          <Spacer />
          {ability.hidden ? (
            <Text font="caption" foregroundStyle="secondary" padding={{ horizontal: 8, vertical: 3 }} background="secondarySystemFill" cornerRadius="capsule">
              Hidden
            </Text>
          ) : null}
        </HStack>
      ))}
    </Card>
  );
}

function Stats({ pokemon, color }: { pokemon: Pokemon; color: Color }) {
  const total = pokemon.stats.reduce((sum, stat) => sum + stat.value, 0);
  return (
    <Card title="Base stats">
      {pokemon.stats.map((stat) => (
        <HStack key={stat.name} spacing={12} accessibilityElement="combine">
          <Text font="subheadline" foregroundStyle="secondary" frame={{ width: 64, alignment: "leading" }}>{statLabels[stat.name] ?? stat.name}</Text>
          <Text font="subheadline" fontWeight="semibold" monospacedDigit frame={{ width: 36, alignment: "trailing" }}>{stat.value}</Text>
          <ProgressView value={Math.min(stat.value, MAX_STAT)} total={MAX_STAT} tint={color} />
        </HStack>
      ))}
      <Divider />
      <HStack spacing={12}>
        <Text font="subheadline" fontWeight="semibold" frame={{ width: 64, alignment: "leading" }}>Total</Text>
        <Text font="subheadline" fontWeight="semibold" monospacedDigit frame={{ width: 36, alignment: "trailing" }}>{total}</Text>
        <Spacer />
      </HStack>
    </Card>
  );
}
