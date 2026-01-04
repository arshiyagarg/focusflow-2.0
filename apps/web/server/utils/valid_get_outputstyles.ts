import { OUTPUT_STYLE_VALUES, OutputStyle } from "../types/textprocessing.js";

export const isValidOutputStyle = (
  value: any
): value is OutputStyle => {
  return OUTPUT_STYLE_VALUES.includes(value);
};

export const getOutputStyleOrDefault = (
  value: any
): OutputStyle => {
  if (isValidOutputStyle(value)) return value;
  return "summary"; // safe fallback
};