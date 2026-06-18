import { router } from "expo-router";
import { BlurView } from "expo-blur";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import type { ComponentProps } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { DimensionValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  NUTRITION_GOAL_OPTIONS,
  SEX_OPTIONS,
} from "../src/constants/profileOptions";
import { estimateMealMacroTarget } from "../src/utils/profileTargets";
import type { ActivityLevel, NutritionGoal, NutritionProfile, Sex } from "../src/types/profile";

const CM_PER_INCH = 2.54;
const KG_PER_POUND = 0.45359237;
const AGE_MIN = 16;
const AGE_MAX = 80;
const AGE_DEFAULT = 18;
const WHEEL_ITEM_HEIGHT = 52;

type UnitSystem = "us" | "metric";

type ProfileStep =
  | "intro"
  | "name"
  | "age"
  | "height"
  | "weight"
  | "sex"
  | "activity"
  | "goal"
  | "review";

type DashboardSection = "summary" | "meals" | "preferences" | "progress";
type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

const PROFILE_STEPS: ProfileStep[] = [
  "intro",
  "name",
  "age",
  "height",
  "weight",
  "sex",
  "activity",
  "goal",
  "review",
];
const TOTAL_STEPS = PROFILE_STEPS.length;

const ACTIVITY_DISPLAY_OPTIONS: {
  label: string;
  value: ActivityLevel;
  description: string;
}[] = [
  {
    label: "Low Activity",
    value: "sedentary",
    description: "Little exercise besides walking to class",
  },
  {
    label: "Light Activity",
    value: "light",
    description: "Exercise or sports 1 to 2 days per week",
  },
  {
    label: "Moderate Activity",
    value: "moderate",
    description: "Exercise or sports 3 to 4 days per week",
  },
  {
    label: "High Activity",
    value: "active",
    description: "Hard training 5 to 6 days per week",
  },
  {
    label: "Very High Activity",
    value: "very_active",
    description: "Intense training most days",
  },
];

function buildRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function formatProfileLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function centimetersToFeetInches(heightCm: number) {
  const totalInches = Math.max(0, Math.round(heightCm / CM_PER_INCH));
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return { feet, inches };
}

function kilogramsToPounds(weightKg: number) {
  return Math.round(weightKg / KG_PER_POUND);
}

function poundsToKilograms(weightLb: number) {
  return Math.round(weightLb * KG_PER_POUND);
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState<number | null>(AGE_DEFAULT);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("us");

  const [sex, setSex] = useState<Sex | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goal, setGoal] = useState<NutritionGoal | null>(null);

  const [savedProfile, setSavedProfile] = useState<NutritionProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [dashboardSection, setDashboardSection] =
    useState<DashboardSection>("summary");

  const currentStep = PROFILE_STEPS[currentStepIndex];
  const isReviewStep = currentStep === "review";
  const shouldShowDashboard = savedProfile !== null && !isEditingProfile;
  const progressPercent: DimensionValue = `${((currentStepIndex + 1) / TOTAL_STEPS) * 100}%`;

  const canContinue =
    (currentStep !== "sex" || sex !== null) &&
    (currentStep !== "activity" || activityLevel !== null) &&
    (currentStep !== "goal" || goal !== null);

  const setCurrentStep = (step: ProfileStep) => {
    setCurrentStepIndex(PROFILE_STEPS.indexOf(step));
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleNextStep = () => {
    if (!canContinue) {
      return;
    }

    if (currentStepIndex < PROFILE_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleSaveProfile = () => {
    if (sex === null || activityLevel === null || goal === null) {
      return;
    }

    const normalizedDisplayName = displayName.trim();

    const profile: NutritionProfile = {
      displayName: normalizedDisplayName.length > 0 ? normalizedDisplayName : null,
      age,
      heightCm,
      weightKg,
      sex,
      activityLevel,
      goal,
    };

    setSavedProfile(profile);
    setIsEditingProfile(false);
  };

  const setUsHeight = (part: "feet" | "inches", value: number) => {
    const currentHeight = centimetersToFeetInches(heightCm ?? 173);
    const feet = part === "feet" ? value : currentHeight.feet;
    const inches = part === "inches" ? value : currentHeight.inches;
    setHeightCm(Math.round((feet * 12 + inches) * CM_PER_INCH));
  };

  const formatHeightForReview = () => {
    if (heightCm === null) {
      return "Not provided";
    }

    if (unitSystem === "metric") {
      return `${heightCm} cm`;
    }

    const { feet, inches } = centimetersToFeetInches(heightCm);
    return `${feet} ft ${inches} in`;
  };

  const formatWeightForReview = () => {
    if (weightKg === null) {
      return "Not provided";
    }

    if (unitSystem === "metric") {
      return `${weightKg} kg`;
    }

    return `${kilogramsToPounds(weightKg)} lb`;
  };

  const selectedActivityOption = ACTIVITY_DISPLAY_OPTIONS.find(
    (option) => option.value === activityLevel
  );
  const profilePreview: NutritionProfile | null =
    age !== null &&
    heightCm !== null &&
    weightKg !== null &&
    sex !== null &&
    activityLevel !== null &&
    goal !== null
      ? {
          displayName: displayName.trim() || null,
          age,
          heightCm,
          weightKg,
          sex,
          activityLevel,
          goal,
        }
      : null;
  const estimatedTarget = profilePreview
    ? estimateMealMacroTarget(profilePreview)
    : null;

  function renderStepContent() {
    switch (currentStep) {
      case "intro":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Optional setup</Text>
            <Text style={styles.stepTitle}>Build a profile for better meal ideas.</Text>
            <Text style={styles.stepBody}>
              Your nutrition profile is optional. It helps prepare more personalized
              meal suggestions while keeping Purdue Dining easy to use without one.
            </Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>You are in control</Text>
              <Text style={styles.infoText}>
                Answer what feels useful, skip what you want, and come back anytime.
              </Text>
            </View>
          </View>
        );
      case "name":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Profile name</Text>
            <Text style={styles.stepTitle}>What should we call this profile?</Text>
            <Text style={styles.stepBody}>
              Add a name to personalize the profile screen.
            </Text>
            <TextInput
              style={styles.nameInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter a name"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>
        );
      case "age":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>About you</Text>
            <Text style={styles.stepTitle}>How old are you?</Text>
            {renderAgeWheel()}
          </View>
        );
      case "height":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Body details</Text>
            <Text style={styles.stepTitle}>What is your height?</Text>
            {renderUnitToggle()}
            {unitSystem === "metric" ? renderMetricHeightControl() : renderUsHeightControl()}
          </View>
        );
      case "weight":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Body details</Text>
            <Text style={styles.stepTitle}>What is your weight?</Text>
            {renderUnitToggle()}
            {unitSystem === "metric" ? renderMetricWeightControl() : renderUsWeightControl()}
          </View>
        );
      case "sex":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Profile detail</Text>
            <Text style={styles.stepTitle}>Which option should we use?</Text>
            <Text style={styles.stepBody}>
              Choose one to continue. Prefer not to say is always available.
            </Text>
            <View style={styles.optionStack}>
              {SEX_OPTIONS.map((option) => renderOptionCard({
                isSelected: sex === option.value,
                label: option.label,
                onPress: () => setSex(option.value),
              }))}
            </View>
          </View>
        );
      case "activity":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Daily rhythm</Text>
            <Text style={styles.stepTitle}>How active are you most weeks?</Text>
            <Text style={styles.stepBody}>
              Pick the option that sounds closest to your normal routine.
            </Text>
            <View style={styles.optionStack}>
              {ACTIVITY_DISPLAY_OPTIONS.map((option) => renderOptionCard({
                description: option.description,
                isSelected: activityLevel === option.value,
                label: option.label,
                onPress: () => setActivityLevel(option.value),
              }))}
            </View>
          </View>
        );
      case "goal":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Nutrition direction</Text>
            <Text style={styles.stepTitle}>What is your main goal?</Text>
            <Text style={styles.stepBody}>
              This helps shape future meal target suggestions.
            </Text>
            <View style={styles.optionStack}>
              {NUTRITION_GOAL_OPTIONS.map((option) => renderOptionCard({
                description: option.description,
                isSelected: goal === option.value,
                label: option.label,
                onPress: () => setGoal(option.value),
              }))}
            </View>
          </View>
        );
      case "review":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Review</Text>
            <Text style={styles.stepTitle}>Ready to save this profile?</Text>
            <Text style={styles.stepBody}>
              Review your details before saving your profile.
            </Text>

            <View style={styles.reviewList}>
              {renderReviewRow("Name", displayName.trim() || "Not set")}
              {renderReviewRow("Age", age === null ? "Not provided" : `${age}`)}
              {renderReviewRow("Height", formatHeightForReview())}
              {renderReviewRow("Weight", formatWeightForReview())}
              {renderReviewRow("Sex", sex ? formatProfileLabel(sex) : "Not selected")}
              {renderReviewRow(
                "Activity",
                selectedActivityOption ? selectedActivityOption.label : "Not selected"
              )}
              {renderReviewRow("Goal", goal ? formatProfileLabel(goal) : "Not selected")}
            </View>

            {estimatedTarget ? (
              <View style={styles.targetPreviewCard}>
                <Text style={styles.targetPreviewTitle}>Estimated meal targets</Text>
                <Text style={styles.targetPreviewText}>
                  Based on your profile choices. You can review and adjust these before
                  using them.
                </Text>
                <View style={styles.targetPreviewRow}>
                  {renderTargetPreviewValue("Calories", `${estimatedTarget.calories} kcal`)}
                  {renderTargetPreviewValue(
                    "Protein",
                    `${estimatedTarget.proteinGrams}g`
                  )}
                  {renderTargetPreviewValue("Carbs", `${estimatedTarget.carbsGrams}g`)}
                </View>
              </View>
            ) : null}

            {savedProfile ? (
              <View style={styles.savedNotice}>
                <Text style={styles.savedNoticeTitle}>Profile saved</Text>
                <Text style={styles.savedNoticeText}>
                  You can keep using Purdue Dining with or without these answers.
                </Text>
              </View>
            ) : null}
          </View>
        );
    }
  }

  function renderSummaryMetricTile({
    accentColor,
    iconName,
    label,
    unit,
    value,
  }: {
    accentColor: string;
    iconName: MaterialIconName;
    label: string;
    unit: string;
    value: string;
  }) {
    return (
      <View style={[styles.summaryMetricTile, { borderColor: accentColor }]}>
        <Text style={styles.summaryMetricLabel}>{label}</Text>
        <Text style={styles.summaryMetricValue}>{value}</Text>
        <View style={styles.summaryMetricFooter}>
          <Text style={styles.summaryMetricUnit}>{unit}</Text>
          <View style={[styles.summaryMetricAccent, { backgroundColor: accentColor }]}>
            <MaterialIcons name={iconName} size={17} color="#111" />
          </View>
        </View>
      </View>
    );
  }

  function renderProfileSnapshotRow(
    label: string,
    value: string,
    iconName: MaterialIconName
  ) {
    return (
      <View key={label} style={styles.profileSnapshotRow}>
        <View style={styles.profileSnapshotLabelGroup}>
          <View style={styles.profileSnapshotDot}>
            <MaterialIcons name={iconName} size={17} color="#555" />
          </View>
          <Text style={styles.profileSnapshotLabel}>{label}</Text>
        </View>
        <Text style={styles.profileSnapshotValue}>{value}</Text>
      </View>
    );
  }

  function renderDashboardSectionHeader({
    body,
    eyebrow,
    iconName,
    title,
  }: {
    body: string;
    eyebrow: string;
    iconName: MaterialIconName;
    title: string;
  }) {
    return (
      <View style={styles.summaryHeroCard}>
        <View style={styles.summaryHeroTextGroup}>
          <Text style={styles.summaryEyebrow}>{eyebrow}</Text>
          <Text style={styles.summaryTitle}>{title}</Text>
          <Text style={styles.summaryBody}>{body}</Text>
        </View>
        <View style={styles.summaryHeroBadge}>
          <MaterialIcons name={iconName} size={26} color="#111" />
        </View>
      </View>
    );
  }

  function renderDashboardPlaceholderCard({
    body,
    iconName,
    subtitle,
    title,
  }: {
    body: string;
    iconName: MaterialIconName;
    subtitle: string;
    title: string;
  }) {
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryCardHeader}>
          <View style={styles.summaryCardBadge}>
            <MaterialIcons name={iconName} size={24} color="#b08a3c" />
          </View>
          <View style={styles.summaryCardTitleGroup}>
            <Text style={styles.summaryCardTitle}>{title}</Text>
            <Text style={styles.summaryCardSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <Text style={styles.dashboardPlaceholderBody}>{body}</Text>
      </View>
    );
  }

  function renderProgressDayPreview(day: string) {
    return (
      <View key={day} style={styles.progressDayPreview}>
        <View style={styles.progressDayCircle} />
        <Text style={styles.progressDayLabel}>{day}</Text>
      </View>
    );
  }

  function renderProgressTargetRow({
    iconName,
    label,
    target,
  }: {
    iconName: MaterialIconName;
    label: string;
    target: string;
  }) {
    return (
      <View style={styles.progressTargetRow}>
        <View style={styles.progressTargetLabelGroup}>
          <MaterialIcons name={iconName} size={18} color="#b08a3c" />
          <Text style={styles.progressTargetLabel}>{label}</Text>
        </View>
        <Text style={styles.progressTargetValue}>Not started / {target}</Text>
      </View>
    );
  }

  function renderMealTargetPreviewItem({
    accentColor,
    iconName,
    label,
    value,
  }: {
    accentColor: string;
    iconName: MaterialIconName;
    label: string;
    value: string;
  }) {
    return (
      <View style={styles.mealTargetPreviewItem}>
        <View style={[styles.mealTargetIconBadge, { backgroundColor: accentColor }]}>
          <MaterialIcons name={iconName} size={17} color="#111" />
        </View>
        <View style={styles.mealTargetTextGroup}>
          <Text style={styles.mealTargetLabel}>{label}</Text>
          <Text style={styles.mealTargetValue}>{value}</Text>
        </View>
      </View>
    );
  }

  function renderPreferencePreviewChip({
    iconName,
    label,
  }: {
    iconName: MaterialIconName;
    label: string;
  }) {
    return (
      <View key={label} style={styles.preferencePreviewChip}>
        <MaterialIcons name={iconName} size={17} color="#8a6a26" />
        <Text style={styles.preferencePreviewChipText}>{label}</Text>
      </View>
    );
  }

  function renderPreferenceSettingsRow({
    iconName,
    label,
  }: {
    iconName: MaterialIconName;
    label: string;
  }) {
    return (
      <View key={label} style={styles.preferenceSettingsRow}>
        <View style={styles.preferenceSettingsLabelGroup}>
          <MaterialIcons name={iconName} size={20} color="#555" />
          <Text style={styles.preferenceSettingsLabel}>{label}</Text>
        </View>
        <Text style={styles.preferenceSettingsStatus}>Coming later</Text>
      </View>
    );
  }

  function renderProfileDashboard() {
    if (savedProfile === null) {
      return null;
    }

    const dashboardSections: { label: string; value: DashboardSection }[] = [
      { label: "Summary", value: "summary" },
      { label: "Meals", value: "meals" },
      { label: "Preferences", value: "preferences" },
      { label: "Progress", value: "progress" },
    ];
    const dashboardTarget = estimateMealMacroTarget(savedProfile);
    const dashboardActivityOption = ACTIVITY_DISPLAY_OPTIONS.find(
      (option) => option.value === savedProfile.activityLevel
    );
    const rawSavedDisplayName = savedProfile.displayName?.trim();
    const savedDisplayName =
      rawSavedDisplayName && rawSavedDisplayName.length > 24
        ? `${rawSavedDisplayName.slice(0, 24)}...`
        : rawSavedDisplayName;
    const dashboardTitle = savedDisplayName
      ? `Welcome back, ${savedDisplayName}`
      : "Your Nutrition Hub";

    const renderDashboardSectionContent = () => {
      switch (dashboardSection) {
        case "summary":
          return (
            <View style={styles.summarySectionContent}>
              <View style={styles.summaryHeroCard}>
                <View style={styles.summaryHeroTextGroup}>
                  <Text style={styles.summaryEyebrow}>Nutrition Hub</Text>
                  <Text style={styles.summaryTitle}>{dashboardTitle}</Text>
                  <Text style={styles.summaryBody}>
                    A snapshot of your meal targets and saved profile details to help
                    guide smarter dining choices.
                  </Text>
                </View>
                <View style={styles.summaryHeroBadge}>
                  <MaterialIcons name="school" size={26} color="#111" />
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryCardBadge}>
                    <MaterialIcons name="local-fire-department" size={25} color="#b08a3c" />
                  </View>
                  <View style={styles.summaryCardTitleGroup}>
                    <Text style={styles.summaryCardTitle}>{"Today's Meal Targets"}</Text>
                    <Text style={styles.summaryCardSubtitle}>
                      Estimated from your saved profile
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryMetricGrid}>
                  {renderSummaryMetricTile({
                    accentColor: "#f59e0b",
                    iconName: "local-fire-department",
                    label: "Calories",
                    unit: "kcal",
                    value: `${dashboardTarget.calories}`,
                  })}
                  {renderSummaryMetricTile({
                    accentColor: "#22c55e",
                    iconName: "eco",
                    label: "Protein",
                    unit: "g",
                    value: `${dashboardTarget.proteinGrams}`,
                  })}
                  {renderSummaryMetricTile({
                    accentColor: "#8b5cf6",
                    iconName: "grain",
                    label: "Carbs",
                    unit: "g",
                    value: `${dashboardTarget.carbsGrams}`,
                  })}
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryCardBadge}>
                    <MaterialIcons name="person" size={25} color="#b08a3c" />
                  </View>
                  <View style={styles.summaryCardTitleGroup}>
                    <Text style={styles.summaryCardTitle}>Profile Snapshot</Text>
                    <Text style={styles.summaryCardSubtitle}>
                      Based on your saved information
                    </Text>
                  </View>
                </View>

                <View style={styles.profileSnapshotList}>
                  {renderProfileSnapshotRow(
                    "Age",
                    savedProfile.age === null ? "Not provided" : `${savedProfile.age}`,
                    "event"
                  )}
                  {renderProfileSnapshotRow(
                    "Height",
                    formatSavedHeight(savedProfile.heightCm),
                    "straighten"
                  )}
                  {renderProfileSnapshotRow(
                    "Weight",
                    formatSavedWeight(savedProfile.weightKg),
                    "fitness-center"
                  )}
                  {renderProfileSnapshotRow(
                    "Sex",
                    formatProfileLabel(savedProfile.sex),
                    "person"
                  )}
                  {renderProfileSnapshotRow(
                    "Activity",
                    dashboardActivityOption
                      ? dashboardActivityOption.label
                      : formatProfileLabel(savedProfile.activityLevel),
                    "directions-run"
                  )}
                  {renderProfileSnapshotRow(
                    "Goal",
                    formatProfileLabel(savedProfile.goal),
                    "flag"
                  )}
                </View>

                <Pressable
                  style={styles.summaryEditButton}
                  onPress={() => {
                    setIsEditingProfile(true);
                    setCurrentStep("review");
                  }}
                >
                  <MaterialIcons name="edit" size={19} color="#f2c766" />
                  <Text style={styles.summaryEditButtonText}>Edit Profile</Text>
                </Pressable>
              </View>
            </View>
          );
        case "meals":
          return (
            <View style={styles.summarySectionContent}>
              {renderDashboardSectionHeader({
                eyebrow: "MEAL PLANNING",
                iconName: "restaurant",
                title: "Meals",
                body:
                  "Review future recommendations and saved dining choices from one place.",
              })}

              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryCardBadge}>
                    <MaterialIcons name="track-changes" size={24} color="#b08a3c" />
                  </View>
                  <View style={styles.summaryCardTitleGroup}>
                    <Text style={styles.summaryCardTitle}>{"Today's Targets"}</Text>
                    <Text style={styles.summaryCardSubtitle}>
                      Estimated meal targets for future planning
                    </Text>
                  </View>
                </View>

                <View style={styles.mealTargetPreviewGrid}>
                  {renderMealTargetPreviewItem({
                    accentColor: "#f8d18c",
                    iconName: "local-fire-department",
                    label: "Calories",
                    value: `${dashboardTarget.calories} kcal`,
                  })}
                  {renderMealTargetPreviewItem({
                    accentColor: "#bbf7d0",
                    iconName: "eco",
                    label: "Protein",
                    value: `${dashboardTarget.proteinGrams} g`,
                  })}
                  {renderMealTargetPreviewItem({
                    accentColor: "#ddd6fe",
                    iconName: "grain",
                    label: "Carbs",
                    value: `${dashboardTarget.carbsGrams} g`,
                  })}
                </View>

                <Pressable style={[styles.summaryEditButton, styles.mealsDisabledButton]} disabled>
                  <Text style={styles.mealsDisabledButtonText}>Use These Targets</Text>
                  <MaterialIcons name="lock" size={18} color="#6b7280" />
                </Pressable>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryCardBadge}>
                    <MaterialIcons name="restaurant-menu" size={24} color="#b08a3c" />
                  </View>
                  <View style={styles.summaryCardTitleGroup}>
                    <Text style={styles.summaryCardTitle}>Recommended Combos</Text>
                    <Text style={styles.summaryCardSubtitle}>
                      Recommendations coming later
                    </Text>
                  </View>
                </View>
                <View style={styles.mealsEmptyPreview}>
                  <MaterialIcons name="lock" size={24} color="#b08a3c" />
                  <Text style={styles.mealsEmptyTitle}>
                    Recommendations coming later
                  </Text>
                  <Text style={styles.mealsEmptyText}>
                    Purdue dining combinations will appear here once profile targets can
                    be applied to recommendations.
                  </Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryCardBadge}>
                    <MaterialIcons name="bookmark" size={24} color="#b08a3c" />
                  </View>
                  <View style={styles.summaryCardTitleGroup}>
                    <Text style={styles.summaryCardTitle}>Saved Meals</Text>
                    <Text style={styles.summaryCardSubtitle}>
                      Saved meals coming later
                    </Text>
                  </View>
                </View>
                <Text style={styles.dashboardPlaceholderBody}>
                  Saved dining combinations will appear here after saved meals are
                  added.
                </Text>
              </View>
            </View>
          );
        case "preferences":
          return (
            <View style={styles.summarySectionContent}>
              {renderDashboardSectionHeader({
                eyebrow: "DINING SETUP",
                iconName: "tune",
                title: "Preferences",
                body:
                  "Preview the preference types you will be able to set later.",
              })}

              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryCardBadge}>
                    <MaterialIcons name="eco" size={24} color="#b08a3c" />
                  </View>
                  <View style={styles.summaryCardTitleGroup}>
                    <Text style={styles.summaryCardTitle}>Dietary Preferences</Text>
                    <Text style={styles.summaryCardSubtitle}>
                      Example diet-style options for future setup
                    </Text>
                  </View>
                </View>
                <View style={styles.preferenceChipGrid}>
                  {renderPreferencePreviewChip({
                    iconName: "eco",
                    label: "Diet style",
                  })}
                  {renderPreferencePreviewChip({
                    iconName: "spa",
                    label: "Plant-forward",
                  })}
                  {renderPreferencePreviewChip({
                    iconName: "brightness-2",
                    label: "Religious needs",
                  })}
                  {renderPreferencePreviewChip({
                    iconName: "grain",
                    label: "Ingredient limits",
                  })}
                </View>
                <Text style={styles.dashboardPlaceholderBody}>
                  These are examples of preferences you will be able to set later.
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryCardBadge}>
                    <MaterialIcons name="security" size={24} color="#b08a3c" />
                  </View>
                  <View style={styles.summaryCardTitleGroup}>
                    <Text style={styles.summaryCardTitle}>Allergens & Restrictions</Text>
                    <Text style={styles.summaryCardSubtitle}>
                      Example safety filters for future setup
                    </Text>
                  </View>
                </View>
                <View style={styles.preferenceChipGrid}>
                  {renderPreferencePreviewChip({
                    iconName: "warning",
                    label: "Allergens",
                  })}
                  {renderPreferencePreviewChip({
                    iconName: "park",
                    label: "Cross-contact",
                  })}
                  {renderPreferencePreviewChip({
                    iconName: "local-drink",
                    label: "Diet restrictions",
                  })}
                  {renderPreferencePreviewChip({
                    iconName: "egg",
                    label: "Ingredient alerts",
                  })}
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryCardBadge}>
                    <MaterialIcons name="place" size={24} color="#b08a3c" />
                  </View>
                  <View style={styles.summaryCardTitleGroup}>
                    <Text style={styles.summaryCardTitle}>Favorite Dining Halls</Text>
                    <Text style={styles.summaryCardSubtitle}>
                      Example location preferences for future setup
                    </Text>
                  </View>
                </View>
                <View style={styles.preferenceChipGrid}>
                  {["Dining halls", "Nearby spots", "Frequent stops", "Avoid list"].map((hall) =>
                    renderPreferencePreviewChip({
                      iconName: "restaurant",
                      label: hall,
                    })
                  )}
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryCardBadge}>
                    <MaterialIcons name="fitness-center" size={24} color="#b08a3c" />
                  </View>
                  <View style={styles.summaryCardTitleGroup}>
                    <Text style={styles.summaryCardTitle}>Meal Style Preferences</Text>
                    <Text style={styles.summaryCardSubtitle}>
                      Example meal-style options for future setup
                    </Text>
                  </View>
                </View>
                <View style={styles.preferenceChipGrid}>
                  {renderPreferencePreviewChip({
                    iconName: "fitness-center",
                    label: "Protein focus",
                  })}
                  {renderPreferencePreviewChip({
                    iconName: "balance",
                    label: "Balance style",
                  })}
                  {renderPreferencePreviewChip({
                    iconName: "eco",
                    label: "Macro focus",
                  })}
                  {renderPreferencePreviewChip({
                    iconName: "sentiment-satisfied",
                    label: "Meal mood",
                  })}
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryCardBadge}>
                    <MaterialIcons name="settings" size={24} color="#b08a3c" />
                  </View>
                  <View style={styles.summaryCardTitleGroup}>
                    <Text style={styles.summaryCardTitle}>Profile & App Settings</Text>
                    <Text style={styles.summaryCardSubtitle}>
                      Settings previews are not connected yet
                    </Text>
                  </View>
                </View>
                <View style={styles.preferenceSettingsList}>
                  {renderPreferenceSettingsRow({
                    iconName: "person",
                    label: "Personal Information",
                  })}
                  {renderPreferenceSettingsRow({
                    iconName: "notifications",
                    label: "Notifications",
                  })}
                  {renderPreferenceSettingsRow({
                    iconName: "settings",
                    label: "App Preferences",
                  })}
                </View>
              </View>
            </View>
          );
        case "progress":
          return (
            <View style={styles.summarySectionContent}>
              {renderDashboardSectionHeader({
                eyebrow: "TRACKING",
                iconName: "trending-up",
                title: "Progress",
                body:
                  "Meal history and nutrition trends will appear here once logging exists.",
              })}

              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryCardBadge}>
                    <MaterialIcons name="date-range" size={24} color="#b08a3c" />
                  </View>
                  <View style={styles.summaryCardTitleGroup}>
                    <Text style={styles.summaryCardTitle}>Weekly Consistency</Text>
                    <Text style={styles.summaryCardSubtitle}>
                      Start logging meals to build your weekly consistency.
                    </Text>
                  </View>
                </View>
                <View style={styles.progressWeekPreview}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    renderProgressDayPreview
                  )}
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryCardBadge}>
                    <MaterialIcons name="track-changes" size={24} color="#b08a3c" />
                  </View>
                  <View style={styles.summaryCardTitleGroup}>
                    <Text style={styles.summaryCardTitle}>Meal Target Completion</Text>
                    <Text style={styles.summaryCardSubtitle}>
                      No meal logs yet. Targets are ready when logging starts.
                    </Text>
                  </View>
                </View>

                <View style={styles.progressCompletionContent}>
                  <View style={styles.progressTargetList}>
                    {renderProgressTargetRow({
                      iconName: "local-fire-department",
                      label: "Calories",
                      target: `${dashboardTarget.calories} kcal`,
                    })}
                    {renderProgressTargetRow({
                      iconName: "eco",
                      label: "Protein",
                      target: `${dashboardTarget.proteinGrams} g`,
                    })}
                    {renderProgressTargetRow({
                      iconName: "grain",
                      label: "Carbs",
                      target: `${dashboardTarget.carbsGrams} g`,
                    })}
                  </View>
                  <View style={styles.progressEmptyRing}>
                    <Text style={styles.progressEmptyRingText}>No logs yet</Text>
                  </View>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.progressEmptyStateIcon}>
                  <MaterialIcons name="event-note" size={34} color="#b08a3c" />
                </View>
                <Text style={styles.progressEmptyTitle}>No meals logged yet.</Text>
                <Text style={styles.progressEmptyText}>
                  Logged meals will appear here once meal logging is added.
                </Text>
                <Pressable style={[styles.summaryEditButton, styles.progressDisabledButton]} disabled>
                  <MaterialIcons name="lock" size={18} color="#6b7280" />
                  <Text style={styles.progressDisabledButtonText}>
                    Meal logging coming later
                  </Text>
                </Pressable>
              </View>

              {renderDashboardPlaceholderCard({
                body:
                  "Insights will appear after the app has meal history to analyze.",
                iconName: "tips-and-updates",
                subtitle: "Future analysis",
                title: "Insights",
              })}
            </View>
          );
      }
    };

    return (
      <>
        <ScrollView
          contentContainerStyle={[
            styles.stepScrollContent,
            styles.dashboardScrollContent,
            { paddingBottom: insets.bottom + 208 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {renderDashboardSectionContent()}
        </ScrollView>

        <View
          style={[
            styles.dashboardFloatingNav,
            { bottom: insets.bottom + 16 },
          ]}
        >
          <BlurView intensity={65} tint="light" style={styles.dashboardFloatingNavBlur}>
            {dashboardSections.map((section) => {
              const isActive = dashboardSection === section.value;

              return (
                <Pressable
                  key={section.value}
                  style={[
                    styles.dashboardFloatingNavButton,
                    isActive && styles.dashboardFloatingNavButtonActive,
                  ]}
                  onPress={() => setDashboardSection(section.value)}
                >
                  <Text
                    style={[
                      styles.dashboardFloatingNavText,
                      isActive && styles.dashboardFloatingNavTextActive,
                    ]}
                  >
                    {section.label}
                  </Text>
                </Pressable>
              );
            })}
          </BlurView>
        </View>
      </>
    );
  }

  function renderAgeWheel() {
    return renderNumberWheel({
      label: "Age",
      options: buildRange(AGE_MIN, AGE_MAX),
      selectedValue: age,
      defaultValue: AGE_DEFAULT,
      onSelect: setAge,
      unit: "years",
    });
  }

  function renderUnitToggle() {
    return (
      <View style={styles.unitToggle}>
        {(["us", "metric"] as UnitSystem[]).map((unit) => {
          const isSelected = unitSystem === unit;

          return (
            <Pressable
              key={unit}
              style={[styles.unitToggleButton, isSelected && styles.selectedUnitToggle]}
              onPress={() => setUnitSystem(unit)}
            >
              <Text
                style={[
                  styles.unitToggleText,
                  isSelected && styles.selectedUnitToggleText,
                ]}
              >
                {unit === "us" ? "US" : "Metric"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  function renderMetricHeightControl() {
    return renderNumberWheel({
      label: "Centimeters",
      options: buildRange(120, 230),
      selectedValue: heightCm,
      defaultValue: 170,
      onSelect: setHeightCm,
      unit: "cm",
    });
  }

  function renderUsHeightControl() {
    const { feet, inches } = centimetersToFeetInches(heightCm ?? 173);

    return (
      <View style={styles.dualWheelRow}>
        {renderNumberWheel({
          label: "Feet",
          options: buildRange(4, 7),
          selectedValue: heightCm === null ? null : feet,
          defaultValue: 5,
          onSelect: (value) => setUsHeight("feet", value),
          unit: "ft",
        })}
        {renderNumberWheel({
          label: "Inches",
          options: buildRange(0, 11),
          selectedValue: heightCm === null ? null : inches,
          defaultValue: 8,
          onSelect: (value) => setUsHeight("inches", value),
          unit: "in",
        })}
      </View>
    );
  }

  function renderMetricWeightControl() {
    return renderNumberWheel({
      label: "Kilograms",
      options: buildRange(35, 250),
      selectedValue: weightKg,
      defaultValue: 70,
      onSelect: setWeightKg,
      unit: "kg",
    });
  }

  function renderUsWeightControl() {
    return renderNumberWheel({
      label: "Pounds",
      options: buildRange(75, 550),
      selectedValue: weightKg === null ? null : kilogramsToPounds(weightKg),
      defaultValue: 150,
      onSelect: (value) => setWeightKg(poundsToKilograms(value)),
      unit: "lb",
    });
  }

  function renderNumberWheel({
    defaultValue,
    label,
    onSelect,
    options,
    selectedValue,
    unit,
  }: {
    defaultValue: number;
    label: string;
    onSelect: (value: number) => void;
    options: number[];
    selectedValue: number | null;
    unit: string;
  }) {
    const displayValue = selectedValue ?? defaultValue;
    const handleWheelMomentumEnd = (
      event: NativeSyntheticEvent<NativeScrollEvent>
    ) => {
      const selectedIndex = Math.round(
        event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT
      );
      const nextValue = options[Math.min(options.length - 1, Math.max(0, selectedIndex))];

      onSelect(nextValue);
    };

    return (
      <View style={styles.wheelPanel}>
        <Text style={styles.wheelLabel}>{label}</Text>
        <View style={styles.wheelShell}>
          <View style={styles.wheelSelectionBand} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            snapToInterval={WHEEL_ITEM_HEIGHT}
            decelerationRate="fast"
            onMomentumScrollEnd={handleWheelMomentumEnd}
            contentContainerStyle={styles.wheelContent}
          >
            {options.map((option) => {
              const isSelected = option === displayValue;

              return (
                <Pressable
                  key={option}
                  style={styles.wheelItem}
                  onPress={() => onSelect(option)}
                >
                  <Text style={[styles.wheelItemText, isSelected && styles.selectedWheelItemText]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <Text style={styles.wheelUnit}>{unit}</Text>
      </View>
    );
  }

  function renderOptionCard({
    description,
    isSelected,
    label,
    onPress,
  }: {
    description?: string;
    isSelected: boolean;
    label: string;
    onPress: () => void;
  }) {
    return (
      <Pressable
        key={label}
        style={[styles.optionCard, isSelected && styles.selectedOptionCard]}
        onPress={onPress}
      >
        <View style={[styles.selectionDot, isSelected && styles.selectedSelectionDot]}>
          {isSelected ? <View style={styles.selectionDotInner} /> : null}
        </View>
        <View style={styles.optionTextGroup}>
          <Text style={[styles.optionTitle, isSelected && styles.selectedOptionTitle]}>
            {label}
          </Text>
          {description ? (
            <Text
              style={[
                styles.optionDescription,
                isSelected && styles.selectedOptionDescription,
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  function renderReviewRow(label: string, value: string) {
    return (
      <View key={label} style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>{label}</Text>
        <Text style={styles.reviewValue}>{value}</Text>
      </View>
    );
  }

  function formatSavedHeight(savedHeightCm: number | null) {
    if (savedHeightCm === null) {
      return "Not provided";
    }

    if (unitSystem === "metric") {
      return `${savedHeightCm} cm`;
    }

    const { feet, inches } = centimetersToFeetInches(savedHeightCm);
    return `${feet} ft ${inches} in`;
  }

  function formatSavedWeight(savedWeightKg: number | null) {
    if (savedWeightKg === null) {
      return "Not provided";
    }

    if (unitSystem === "metric") {
      return `${savedWeightKg} kg`;
    }

    return `${kilogramsToPounds(savedWeightKg)} lb`;
  }

  function renderTargetPreviewValue(label: string, value: string) {
    return (
      <View key={label} style={styles.targetPreviewValue}>
        <Text style={styles.targetPreviewLabel}>{label}</Text>
        <Text style={styles.targetPreviewNumber}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      {shouldShowDashboard ? null : (
        <Pressable
          style={[styles.floatingBackButton, { top: insets.top + 8 }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BlurView intensity={55} tint="light" style={styles.backButtonBlur}>
          <Text style={styles.floatingBackButtonText}>‹</Text>
          </BlurView>
        </Pressable>
      )}

      <View
        style={[
          styles.container,
          { paddingTop: insets.top + (shouldShowDashboard ? 8 : 76) },
        ]}
      >
        {shouldShowDashboard ? (
          renderProfileDashboard()
        ) : (
          <>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                Step {currentStepIndex + 1} of {TOTAL_STEPS}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressPercent }]} />
              </View>
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.stepScrollContent,
                { paddingBottom: insets.bottom + 148 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {renderStepContent()}
            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
              <Pressable
                style={[
                  styles.secondaryButton,
                  currentStepIndex === 0 && styles.hiddenButton,
                ]}
                onPress={handlePreviousStep}
                disabled={currentStepIndex === 0}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.primaryButton,
                  !canContinue && styles.disabledPrimaryButton,
                ]}
                onPress={isReviewStep ? handleSaveProfile : handleNextStep}
                disabled={!canContinue}
              >
                <Text style={styles.primaryButtonText}>
                  {isReviewStep ? "Save Nutrition Profile" : "Continue"}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 20,
  },

  progressHeader: {
    marginBottom: 18,
  },

  progressText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 10,
    textTransform: "uppercase",
    lineHeight: 18,
  },

  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#111",
  },

  stepScrollContent: {
    flexGrow: 1,
  },

  stepCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    minHeight: 430,
  },

  eyebrow: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#6b7280",
    marginBottom: 12,
    textTransform: "uppercase",
  },

  stepTitle: {
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "800",
    color: "#111",
    marginBottom: 24,
  },

  stepBody: {
    fontSize: 16,
    lineHeight: 23,
    color: "#555",
    marginBottom: 24,
  },

  nameInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: "#111",
  },

  infoCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 6,
  },

  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
  },

  unitToggle: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },

  unitToggleButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },

  selectedUnitToggle: {
    backgroundColor: "#111",
  },

  unitToggleText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#555",
  },

  selectedUnitToggleText: {
    color: "#fff",
  },

  dualWheelRow: {
    flexDirection: "row",
    gap: 12,
  },

  wheelPanel: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    padding: 14,
    alignItems: "center",
  },

  wheelLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#6b7280",
    marginBottom: 10,
    textTransform: "uppercase",
  },

  wheelShell: {
    width: "100%",
    height: WHEEL_ITEM_HEIGHT * 3,
    overflow: "hidden",
    justifyContent: "center",
  },

  wheelSelectionBand: {
    position: "absolute",
    left: 0,
    right: 0,
    top: WHEEL_ITEM_HEIGHT,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
  },

  wheelContent: {
    paddingVertical: WHEEL_ITEM_HEIGHT,
  },

  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },

  wheelItemText: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#9ca3af",
  },

  selectedWheelItemText: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: "#111",
  },

  wheelUnit: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: "#6b7280",
    marginTop: 10,
  },

  optionStack: {
    gap: 12,
  },

  optionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 16,
  },

  selectedOptionCard: {
    backgroundColor: "#111",
    borderColor: "#111",
  },

  selectionDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
  },

  selectedSelectionDot: {
    borderColor: "#fff",
  },

  selectionDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },

  optionTextGroup: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    color: "#111",
  },

  selectedOptionTitle: {
    color: "#fff",
  },

  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
    marginTop: 4,
  },

  selectedOptionDescription: {
    color: "#e5e7eb",
  },

  reviewList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },

  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  reviewLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
  },

  reviewValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },

  savedNotice: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    marginTop: 18,
  },

  savedNoticeTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 4,
  },

  savedNoticeText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },

  targetPreviewCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    marginTop: 18,
  },

  targetPreviewTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 6,
  },

  targetPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
    marginBottom: 14,
  },

  targetPreviewRow: {
    flexDirection: "row",
    gap: 8,
  },

  targetPreviewValue: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },

  targetPreviewLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: "#6b7280",
    marginBottom: 4,
  },

  targetPreviewNumber: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    color: "#111",
  },

  dashboardSection: {
    marginTop: 18,
  },

  dashboardScrollContent: {
    gap: 14,
  },

  dashboardHeaderCard: {
    minHeight: 0,
  },

  dashboardSectionContent: {
    gap: 14,
  },

  summarySectionContent: {
    gap: 14,
  },

  summaryHeroCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingTop: 4,
    paddingHorizontal: 2,
    paddingBottom: 6,
  },

  summaryHeroTextGroup: {
    flex: 1,
  },

  summaryHeroBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(176, 138, 60, 0.36)",
    backgroundColor: "#f8efd9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#111",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  summaryEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    color: "#b08a3c",
    letterSpacing: 1.6,
    marginBottom: 10,
    textTransform: "uppercase",
  },

  summaryTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    color: "#111",
    marginBottom: 10,
  },

  summaryBody: {
    fontSize: 16,
    lineHeight: 23,
    color: "#555",
  },

  summaryCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#edf0f3",
    shadowColor: "#111",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },

  summaryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  summaryCardBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8efd9",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryCardBadgeText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    color: "#b08a3c",
  },

  summaryCardTitleGroup: {
    flex: 1,
  },

  summaryCardTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
    color: "#111",
  },

  summaryCardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
    marginTop: 3,
  },

  summaryMetricGrid: {
    flexDirection: "row",
    gap: 9,
  },

  summaryMetricTile: {
    flex: 1,
    minHeight: 112,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "#fffdf9",
    padding: 12,
    justifyContent: "space-between",
  },

  summaryMetricLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#6b7280",
  },

  summaryMetricValue: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    color: "#111",
  },

  summaryMetricFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryMetricUnit: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: "#555",
  },

  summaryMetricAccent: {
    width: 28,
    height: 28,
    borderRadius: 14,
    opacity: 0.28,
    alignItems: "center",
    justifyContent: "center",
  },

  profileSnapshotList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf0f3",
    overflow: "hidden",
    marginBottom: 16,
  },

  profileSnapshotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0f3",
  },

  profileSnapshotLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  profileSnapshotDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  profileSnapshotLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#666",
  },

  profileSnapshotValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#111",
  },

  summaryEditButton: {
    borderRadius: 16,
    backgroundColor: "#111",
    paddingVertical: 15,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryEditButtonText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    color: "#f2c766",
  },

  dashboardTargetCard: {
    marginTop: 0,
  },

  dashboardSectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },

  dashboardSectionCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  dashboardSectionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f8efd9",
    alignItems: "center",
    justifyContent: "center",
  },

  dashboardSectionTitleGroup: {
    flex: 1,
  },

  dashboardPlaceholderBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
  },

  progressWeekPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },

  progressDayPreview: {
    flex: 1,
    alignItems: "center",
    gap: 7,
  },

  progressDayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#c7cbd1",
    backgroundColor: "#f9fafb",
  },

  progressDayLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: "#6b7280",
  },

  progressCompletionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  progressTargetList: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf0f3",
    overflow: "hidden",
  },

  progressTargetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0f3",
  },

  progressTargetLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  progressTargetLabel: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    color: "#555",
  },

  progressTargetValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#111",
  },

  progressEmptyRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 10,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },

  progressEmptyRingText: {
    width: 62,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    color: "#6b7280",
  },

  progressEmptyStateIcon: {
    alignSelf: "center",
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#f8efd9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  progressEmptyTitle: {
    textAlign: "center",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    color: "#111",
    marginBottom: 7,
  },

  progressEmptyText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
    marginBottom: 16,
  },

  progressDisabledButton: {
    backgroundColor: "#f3f4f6",
  },

  progressDisabledButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#6b7280",
  },

  mealTargetPreviewGrid: {
    gap: 10,
    marginBottom: 16,
  },

  mealTargetPreviewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf0f3",
    backgroundColor: "#fffdf9",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  mealTargetIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  mealTargetTextGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  mealTargetLabel: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    color: "#555",
  },

  mealTargetValue: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    color: "#111",
  },

  mealsDisabledButton: {
    backgroundColor: "#f3f4f6",
  },

  mealsDisabledButtonText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    color: "#6b7280",
  },

  mealsEmptyPreview: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d9dde3",
    backgroundColor: "#f9fafb",
    paddingVertical: 22,
    paddingHorizontal: 16,
  },

  mealsEmptyTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    color: "#111",
    marginTop: 10,
    marginBottom: 6,
    textAlign: "center",
  },

  mealsEmptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#555",
    textAlign: "center",
  },

  preferenceChipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },

  preferencePreviewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead8b6",
    backgroundColor: "#fffaf0",
    paddingVertical: 10,
    paddingHorizontal: 13,
    opacity: 0.82,
  },

  preferencePreviewChipText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: "#6b4f16",
  },

  preferenceSettingsList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf0f3",
    overflow: "hidden",
  },

  preferenceSettingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0f3",
  },

  preferenceSettingsLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  preferenceSettingsLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: "#111",
  },

  preferenceSettingsStatus: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: "#9ca3af",
  },

  dashboardFloatingNav: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 20,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.34)",
    shadowColor: "#111",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },

  dashboardFloatingNavBlur: {
    flexDirection: "row",
    gap: 4,
    padding: 7,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },

  dashboardFloatingNavButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  dashboardFloatingNavButtonActive: {
    backgroundColor: "#111",
    shadowColor: "#111",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },

  dashboardFloatingNavText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: "#6b7280",
  },

  dashboardFloatingNavTextActive: {
    color: "#fff",
  },

  dashboardActions: {
    gap: 12,
    marginTop: 18,
  },

  bottomBar: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    backgroundColor: "#f9fafb",
  },

  secondaryButton: {
    minWidth: 88,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  hiddenButton: {
    opacity: 0,
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },

  primaryButton: {
    flex: 1,
    backgroundColor: "#111",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledPrimaryButton: {
    backgroundColor: "#9ca3af",
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  floatingBackButton: {
    position: "absolute",
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },

  backButtonBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },

  floatingBackButtonText: {
    fontSize: 38,
    fontWeight: "500",
    color: "#111827",
    lineHeight: 40,
    marginTop: -3,
  },
});
