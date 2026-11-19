/**
 * Fixed palette shared by the label manager and the label picker. A
 * small set keeps labels readable on both chart themes and stops
 * arbitrary colors from breaking contrast.
 */
export const LABEL_COLORS = [
  { name: "Magenta", value: "#a21862" },
  { name: "Cyan", value: "#2f7d93" },
  { name: "Green", value: "#3f6b3a" },
  { name: "Amber", value: "#a9761b" },
  { name: "Red", value: "#b3261e" },
  { name: "Indigo", value: "#4b5d9e" },
  { name: "Violet", value: "#76518f" },
  { name: "Slate", value: "#5c6672" },
] as const;

export const DEFAULT_LABEL_COLOR = LABEL_COLORS[0].value;
