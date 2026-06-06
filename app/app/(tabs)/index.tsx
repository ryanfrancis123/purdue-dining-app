import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import type { MealRecommendation } from "../../src/types/menu";
import { MealRecommendationCard } from "../../src/components/MealRecommendationCard";
import { getMenuItems } from "../../src/services/menuRepository";
import { recommendMeals } from "../../src/utils/recommendMeals";
import {
  MenuItem,
  MealPeriod,
  Allergen,
  DiningHall,
  MacroTargets,
} from "../../src/types/menu";

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function HomeScreen() {
  const [caloriesInput, setCaloriesInput] = useState("600");
  const [proteinInput, setProteinInput] = useState("40");
  const [carbsInput, setCarbsInput] = useState("60");
  const [selectedMealPeriod, setSelectedMealPeriod] = useState<
    MealPeriod | undefined
  >(undefined);
  const [excludedAllergens, setExcludedAllergens] = useState<Allergen[]>([]);
  const allergenOptions: Allergen[] = ["milk", "egg", "wheat", "soy", "fish"];
  const [selectedDiningHall, setSelectedDiningHall] = useState<
    DiningHall | undefined
  >(undefined);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(true);
  const [menuItemsError, setMenuItemsError] = useState<string | null>(null);
  const [menuDataSource, setMenuDataSource] = useState<"supabase" | "fallback" | null>(
    null
  );
  const [selectedMeal, setSelectedMeal] = useState<MealRecommendation | null>(
    null
  );
  const sheetSlideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    async function loadMenuItems() {
      try {
        setIsLoadingMenuItems(true);
        setMenuItemsError(null);

        const result = await getMenuItems();

        setMenuItems(result.items);
        setMenuDataSource(result.source);
        console.log(`Menu data loaded from: ${result.source}`);
      } catch (error) {
        console.error(error);
        setMenuItemsError("Could not load menu items.");
      } finally {
        setIsLoadingMenuItems(false);
      }
    }

    loadMenuItems();
  }, []);

  useEffect(() => {
    if (selectedMeal) {
      sheetSlideAnim.setValue(400);

      Animated.timing(sheetSlideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedMeal, sheetSlideAnim]);


  const diningHallOptions: DiningHall[] = [
    "Wiley",
    "Windsor",
    "Ford",
    "Earhart",
    "Hillenbrand",
  ];

  const [targets, setTargets] = useState<MacroTargets>({
    calories: 600,
    protein: 40,
    carbs: 60,
  });

  const recommendations = recommendMeals(
    menuItems,
    targets,
    selectedMealPeriod,
    excludedAllergens,
    selectedDiningHall
  );

  function handleGenerateRecommendations() {
    const calories = Number(caloriesInput);
    const protein = Number(proteinInput);
    const carbs = Number(carbsInput);

    if (
      Number.isNaN(calories) ||
      Number.isNaN(protein) ||
      Number.isNaN(carbs)
    ) {
      return;
    }

    setTargets({
      calories,
      protein,
      carbs,
    });
  }

  function toggleAllergen(allergen: Allergen) {
    if (excludedAllergens.includes(allergen)) {
      setExcludedAllergens(
        excludedAllergens.filter((item) => item !== allergen)
      );
    } else {
      setExcludedAllergens([...excludedAllergens, allergen]);
    }
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Purdue Dining Macro Planner</Text>

        <Text style={styles.subtitle}>
          Enter your macro targets and get realistic meal combinations from sample
          dining hall data.
        </Text>

        <View style={styles.inputSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Calories</Text>
            <TextInput
              style={styles.input}
              value={caloriesInput}
              onChangeText={setCaloriesInput}
              keyboardType="numeric"
              placeholder="600"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Protein (g)</Text>
            <TextInput
              style={styles.input}
              value={proteinInput}
              onChangeText={setProteinInput}
              keyboardType="numeric"
              placeholder="40"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Carbs (g)</Text>
            <TextInput
              style={styles.input}
              value={carbsInput}
              onChangeText={setCarbsInput}
              keyboardType="numeric"
              placeholder="60"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGenerateRecommendations}
          >
            <Text style={styles.buttonText}>Generate Meal Recommendations</Text>
          </TouchableOpacity>
          </View>

          {isLoadingMenuItems && (
            <Text>Loading menu items...</Text>
          )}

          {menuItemsError && (
            <Text>{menuItemsError}</Text>
          )}
        

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Meal Period</Text>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedMealPeriod === undefined && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedMealPeriod(undefined)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedMealPeriod === undefined &&
                    styles.activeFilterButtonText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedMealPeriod === "breakfast" && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedMealPeriod("breakfast")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedMealPeriod === "breakfast" &&
                    styles.activeFilterButtonText,
                ]}
              >
                Breakfast
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedMealPeriod === "lunch" && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedMealPeriod("lunch")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedMealPeriod === "lunch" &&
                    styles.activeFilterButtonText,
                ]}
              >
                Lunch
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedMealPeriod === "dinner" && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedMealPeriod("dinner")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedMealPeriod === "dinner" &&
                    styles.activeFilterButtonText,
                ]}
              >
                Dinner
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Dining Hall</Text>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedDiningHall === undefined && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedDiningHall(undefined)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedDiningHall === undefined &&
                    styles.activeFilterButtonText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {diningHallOptions.map((diningHall) => {
              const isSelected = selectedDiningHall === diningHall;

              return (
                <TouchableOpacity
                  key={diningHall}
                  style={[
                    styles.filterButton,
                    isSelected && styles.activeFilterButton,
                  ]}
                  onPress={() => setSelectedDiningHall(diningHall)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      isSelected && styles.activeFilterButtonText,
                    ]}
                  >
                    {diningHall}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Exclude Allergens</Text>

          <View style={styles.filterRow}>
            {allergenOptions.map((allergen) => {
              const isSelected = excludedAllergens.includes(allergen);

              return (
                <TouchableOpacity
                  key={allergen}
                  style={[
                    styles.filterButton,
                    isSelected && styles.activeFilterButton,
                  ]}
                  onPress={() => toggleAllergen(allergen)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      isSelected && styles.activeFilterButtonText,
                    ]}
                  >
                    {allergen}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>Top Meal Options</Text>
          <Text style={styles.targetText}>
            Target: {targets.calories} cal, {targets.protein}g protein,{" "}
            {targets.carbs}g carbs
          </Text>
          {menuDataSource === "fallback" ? (
            <Text style={styles.fallbackNotice}>
              Live menu data is temporarily unavailable. Showing sample meals instead.
            </Text>
          ) : null}
        </View>

        {recommendations.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No meal recommendations found</Text>
            <Text style={styles.emptyStateText}>
              Try changing your meal period, lowering your macro targets, or removing
              one of the allergen filters.
            </Text>
          </View>
        ) : (
          recommendations.map((meal, index) => (
            <MealRecommendationCard
              key={meal.id}
              meal={meal}
              index={index}
              onPress={() => setSelectedMeal(meal)}
            />
          ))
        )}
      </ScrollView>

      <Modal
        visible={selectedMeal !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedMeal(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSelectedMeal(null)}
          />

          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [{ translateY: sheetSlideAnim }],
              },
            ]}
          >
            {selectedMeal ? (
              <>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>Meal Details</Text>
                    <Text style={styles.sheetSubtitle}>
                      {selectedMeal.totalCalories} cal ·{" "}
                      {selectedMeal.totalProtein}g protein ·{" "}
                      {selectedMeal.totalCarbs}g carbs ·{" "}
                      {selectedMeal.totalFat}g fat
                    </Text>
                  </View>

                  <Pressable
                    style={styles.closeButton}
                    onPress={() => setSelectedMeal(null)}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </Pressable>
                </View>

                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionLabel}>Items</Text>

                  {selectedMeal.items.map((item) => (
                    <View key={item.id} style={styles.sheetItemRow}>
                      <View style={styles.sheetItemTextGroup}>
                        <Text style={styles.sheetItemName}>{item.name}</Text>
                        <Text style={styles.sheetItemMeta}>
                          {item.diningHall} · {formatLabel(item.mealPeriod)} · {formatLabel(item.category)}
                        </Text>
                        <Text style={styles.sheetItemMacros}>
                          {item.protein}g protein · {item.carbs}g carbs · {item.fat}g fat
                        </Text>
                        {item.allergens.length > 0 ? (
                          <View style={styles.allergenPillRow}>
                            {item.allergens.map((allergen) => (
                              <View key={allergen} style={styles.allergenPill}>
                                <Text style={styles.allergenPillText}>
                                  Contains {formatLabel(allergen)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.sheetItemCalories}>
                        {item.calories} cal
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionLabel}>Match summary</Text>
                  <Text style={styles.sheetExplanation}>
                    {selectedMeal.explanation}
                  </Text>
                </View>
              </>
            ) : null}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: "#555",
    marginBottom: 24,
  },
  inputSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  resultsHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  targetText: {
    fontSize: 14,
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
  },
  itemList: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  macroText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },
  explanation: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
    marginTop: 10,
  },
  filterSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  activeFilterButton: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  activeFilterButtonText: {
    color: "#fff",
  },
  emptyStateCard: {
  backgroundColor: "#fff",
  padding: 18,
  borderRadius: 14,
  marginBottom: 14,
},
emptyStateTitle: {
  fontSize: 18,
  fontWeight: "700",
  color: "#111",
  marginBottom: 8,
},
emptyStateText: {
  fontSize: 14,
  lineHeight: 20,
  color: "#555",
},
fallbackNotice: {
  marginTop: 8,
  marginBottom: 12,
  padding: 10,
  borderRadius: 10,
  backgroundColor: "#fef3c7",
  color: "#92400e",
  fontSize: 14,
  fontWeight: "600",
},
mealSummaryBox: {
  marginTop: 14,
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: "#e5e7eb",
},
mealSummaryLabel: {
  marginTop: 4,
  fontSize: 12,
  fontWeight: "700",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: 0.5,
},
mealSummaryText: {
  marginTop: 4,
  marginBottom: 10,
  fontSize: 15,
  fontWeight: "700",
  color: "#111827",
},
modalOverlay: {
  flex: 1,
  justifyContent: "flex-end",
},
modalBackdrop: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(0, 0, 0, 0.35)",
},
bottomSheet: {
  backgroundColor: "#ffffff",
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  padding: 22,
  paddingBottom: 36,
  maxHeight: "80%",
},
sheetHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
},
sheetTitle: {
  fontSize: 24,
  fontWeight: "800",
  color: "#111827",
},
sheetSubtitle: {
  marginTop: 6,
  fontSize: 14,
  color: "#6b7280",
},
closeButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "#f3f4f6",
  alignItems: "center",
  justifyContent: "center",
},
closeButtonText: {
  fontSize: 26,
  lineHeight: 28,
  color: "#111827",
},
sheetSection: {
  marginTop: 22,
},
sheetSectionLabel: {
  fontSize: 12,
  fontWeight: "800",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: 0.6,
},
sheetItemRow: {
  marginTop: 14,
  flexDirection: "row",
  justifyContent: "space-between",
  gap: 12,
  paddingBottom: 14,
  borderBottomWidth: 1,
  borderBottomColor: "#e5e7eb",
},
sheetItemTextGroup: {
  flex: 1,
},
sheetItemName: {
  fontSize: 16,
  fontWeight: "700",
  color: "#111827",
},
sheetItemMeta: {
  marginTop: 3,
  fontSize: 13,
  color: "#6b7280",
},
sheetItemCalories: {
  fontSize: 15,
  fontWeight: "700",
  color: "#b45309",
},
sheetExplanation: {
  marginTop: 10,
  fontSize: 16,
  lineHeight: 23,
  color: "#4b5563",
},
sheetItemMacros: {
  marginTop: 4,
  fontSize: 13,
  color: "#4b5563",
},
allergenPillRow: {
  marginTop: 8,
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 6,
},
allergenPill: {
  paddingHorizontal: 9,
  paddingVertical: 4,
  borderRadius: 999,
  backgroundColor: "#fee2e2",
},
allergenPillText: {
  fontSize: 12,
  fontWeight: "700",
  color: "#b91c1c",
},
});