# Recommendation Logic

The MVP recommendation engine should be deterministic, not AI-based.

## User inputs

The user can enter:
- target calories
- target protein
- target carbs
- target fat, optional
- dietary preferences
- allergens to avoid
- dining hall preference, optional
- meal period: breakfast, lunch, dinner

## Filtering step

Before scoring meals, the app removes menu items that should not be considered.

Remove items if:
- available is false
- item contains an allergen selected by the user
- item does not match required dietary tags
- item is not from the selected meal period
- item is not from the selected date

## Meal combination step

The app should create possible meal combinations from available items.

For the MVP, a meal combination can contain:
- 1 protein/main item
- 1 carb/side item
- 1 vegetable/side item
- 0 or 1 snack/dessert item

This keeps the search simple and avoids unrealistic combinations.

## Scoring step

Each meal combination gets a score based on how close it is to the user's targets.

Lower score is better.

Score should consider:
- difference from target calories
- difference from target protein
- difference from target carbs
- difference from target fat, if provided

Protein should be weighted heavily because many students will care about protein goals.

Example:
score =
calorie difference
+ protein difference × 4
+ carb difference × 2
+ fat difference × 1

## Output

The app should return the top 3 meal combinations.

Each result should show:
- dining hall
- meal period
- selected food items
- total calories
- total protein
- total carbs
- total fat
- short explanation

Example explanation:
"This meal is the closest match to your 50g protein and 70g carb target while avoiding milk allergens."

## Important MVP constraints

The app should not use AI to decide the best meal.

AI can be added later for:
- explaining recommendations in natural language
- parsing messy menu text
- answering user questions
- suggesting alternatives

The core ranking must stay algorithmic and explainable.