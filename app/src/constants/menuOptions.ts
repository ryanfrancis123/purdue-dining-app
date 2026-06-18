import type { Allergen, DiningHall } from "../types/menu";

export const ALLERGEN_OPTIONS: { label: string; value: Allergen }[] = [
  { label: "Milk", value: "milk" },
  { label: "Egg", value: "egg" },
  { label: "Wheat", value: "wheat" },
  { label: "Soy", value: "soy" },
  { label: "Fish", value: "fish" },
  { label: "Peanut", value: "peanut" },
  { label: "Tree Nut", value: "tree_nut" },
  { label: "Shellfish", value: "shellfish" },
  { label: "Sesame", value: "sesame" },
];

export const DINING_HALL_OPTIONS: { label: string; value: DiningHall }[] = [
  { label: "Wiley", value: "Wiley" },
  { label: "Windsor", value: "Windsor" },
  { label: "Ford", value: "Ford" },
  { label: "Earhart", value: "Earhart" },
  { label: "Hillenbrand", value: "Hillenbrand" },
];
