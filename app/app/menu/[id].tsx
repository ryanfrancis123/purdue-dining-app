import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { MenuItemCard } from "../../src/components/MenuItemCard";
import { getMenuItems } from "../../src/services/menuRepository";
import type { MenuItem } from "../../src/types/menu";

export default function MenuItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadMenuItem() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const result = await getMenuItems();
        const matchingItem = result.items.find((menuItem) => menuItem.id === id);

        if (!matchingItem) {
          setErrorMessage("This menu item could not be found.");
          setItem(null);
          return;
        }

        setItem(matchingItem);
      } catch (error) {
        console.error(error);
        setErrorMessage("Could not load this menu item.");
      } finally {
        setIsLoading(false);
      }
    }

    loadMenuItem();
  }, [id]);

  return (
    <>
      <Stack.Screen options={{ title: item?.name ?? "Menu Item" }} />

      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator />
            <Text style={styles.statusText}>Loading menu item...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : item ? (
          <>
            <Text style={styles.screenTitle}>{item.name}</Text>
            <Text style={styles.subtitle}>
              Full nutrition and availability details
            </Text>

            <MenuItemCard item={item} variant="full" />
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#f9fafb",
  },
  centerBox: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  statusText: {
    fontSize: 15,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    fontWeight: "600",
    textAlign: "center",
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 15,
    color: "#6b7280",
  },
});