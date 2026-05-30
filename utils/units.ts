// Conversion constant - use a precise value
const KG_TO_LBS = 2.20462262185;

// Common plate weights in lbs that users typically use
// This helps us "snap" to standard weights when converting back from kg
const COMMON_LBS_WEIGHTS = [
  2.5, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
  95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170,
  175, 180, 185, 190, 195, 200, 205, 210, 215, 220, 225, 230, 235, 240, 245,
  250, 255, 260, 265, 270, 275, 280, 285, 290, 295, 300, 315, 335, 350, 365,
  385, 400, 405, 425, 450, 475, 495, 500, 515, 545, 585, 600, 635, 675, 700,
  725, 765, 800, 855, 900, 945, 1000,
];

/**
 * Round to a specific number of decimal places to avoid floating point errors
 * @param value Number to round
 * @param decimals Number of decimal places
 * @returns Rounded number
 */
export const roundTo = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

/**
 * Snap a weight to the nearest common lbs value if within tolerance
 * This helps recover the original lbs value after kg round-trip
 * @param lbs Weight in pounds
 * @param tolerance How close (in lbs) to snap (default 0.5)
 * @returns Snapped weight or original if no match
 */
const snapToCommonWeight = (lbs: number, tolerance: number = 0.5): number => {
  for (const common of COMMON_LBS_WEIGHTS) {
    if (Math.abs(lbs - common) <= tolerance) {
      return common;
    }
  }
  // Also check for 2.5 lb increments (common in gyms)
  const nearest2_5 = Math.round(lbs / 2.5) * 2.5;
  if (Math.abs(lbs - nearest2_5) <= tolerance) {
    return nearest2_5;
  }
  return roundTo(lbs, 1);
};

/**
 * Convert kilograms to pounds
 * @param kg Weight in kilograms
 * @param snap Whether to snap to common weights (default true for display)
 * @returns Weight in pounds
 */
export const kgToLbs = (kg: number, snap: boolean = true): number => {
  const rawLbs = kg * KG_TO_LBS;
  return snap ? snapToCommonWeight(rawLbs) : roundTo(rawLbs, 2);
};

/**
 * Convert pounds to kilograms (for storage)
 * @param lbs Weight in pounds
 * @returns Weight in kilograms (rounded to 4 decimal places for precision)
 */
export const lbsToKg = (lbs: number): number => {
  // Use higher precision for storage to allow accurate round-trip
  return roundTo(lbs / KG_TO_LBS, 4);
};

/**
 * Format weight with the correct unit
 * @param weight Weight value
 * @param useMetric Whether to use metric units
 * @returns Formatted weight string with units
 */
export const formatWeight = (weight: number, useMetric: boolean): string => {
  if (useMetric) {
    return `${weight.toFixed(1)} kg`;
  } else {
    return `${kgToLbs(weight).toFixed(1)} lbs`;
  }
};

/**
 * Convert input weight to storage format (kg)
 * @param weight Weight from user input
 * @param isInMetric Whether input is in metric units
 * @returns Weight in kilograms for storage
 */
export const convertToStorageUnit = (
  weight: number,
  isInMetric: boolean
): number => {
  if (!weight) return 0;
  return isInMetric ? Number(weight) : lbsToKg(Number(weight));
};

/**
 * Convert storage weight (kg) back to display unit
 * @param weight Weight from database (in kg)
 * @param isInMetric Whether to display in metric
 * @returns Weight in display units
 */
export const convertFromStorageUnit = (
  weight: number,
  isInMetric: boolean
): number => {
  if (!weight) return 0;
  return isInMetric ? Number(weight) : kgToLbs(Number(weight));
};

/**
 * Calculate volume consistently
 * @param weight Weight from database (in kg)
 * @param reps Number of repetitions
 * @param useMetric Whether to return in metric
 * @returns Volume in specified units
 */
export const calculateVolume = (
  weight: number,
  reps: number,
  useMetric: boolean
): number => {
  // Always calculate volume in storage units first (kg)
  const volumeInKg = Number(weight) * Number(reps);

  // Then convert if needed - use raw conversion for volume (no snapping)
  return useMetric ? volumeInKg : kgToLbs(volumeInKg, false);
};

/**
 * Displays weight with proper units and formatting
 * @param weight Weight value from database (in kg)
 * @param useMetric Whether to display in metric or imperial
 * @param includeUnit Whether to include the unit label (kg/lbs)
 * @param precision Number of decimal places (default: 1)
 * @returns Formatted weight string
 */
export const displayWeight = (
  weight: number,
  useMetric: boolean,
  includeUnit: boolean = true,
  precision: number = 1
): string => {
  // Make sure weight is a number
  const numWeight = Number(weight);

  // Check if it's a valid number
  if (isNaN(numWeight) || numWeight === 0) return "-";

  // Convert the weight if necessary - assumes DB stores in kg
  const convertedWeight = useMetric ? numWeight : kgToLbs(numWeight);

  // Format with specified precision, using roundTo for consistency
  const formattedWeight = roundTo(convertedWeight, precision);

  // Return with or without unit
  return includeUnit
    ? `${formattedWeight} ${useMetric ? "kg" : "lbs"}`
    : String(formattedWeight);
};

/**
 * Format large volume numbers for display (e.g., in charts)
 * @param volume Volume value (already in display units or in kg)
 * @param useMetric Whether to display in metric or imperial
 * @param isAlreadyConverted Whether the volume is already in display units
 * @returns Formatted volume string
 */
export const displayVolume = (
  volume: number,
  useMetric: boolean,
  isAlreadyConverted: boolean = false
): string => {
  const numVolume = Number(volume);
  if (isNaN(numVolume) || numVolume === 0) return "-";

  // If not already converted, convert from kg (use raw conversion, no snapping)
  const convertedVolume = isAlreadyConverted
    ? numVolume
    : useMetric
      ? numVolume
      : kgToLbs(numVolume, false);

  // For large numbers, round to whole numbers to avoid messy decimals
  if (convertedVolume >= 1000) {
    return `${Math.round(convertedVolume).toLocaleString()} ${useMetric ? "kg" : "lbs"}`;
  }

  return `${roundTo(convertedVolume, 1)} ${useMetric ? "kg" : "lbs"}`;
};
