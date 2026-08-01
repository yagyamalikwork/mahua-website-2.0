/**
 * The seven light states of "One Day at Mahua".
 *
 * THE DIAL. Retuning the whole scroll arc happens here and nowhere else.
 * No component may hard-code a colour (spec section 6.2).
 *
 * `accent`     DECORATIVE ONLY — rules, ornaments, the logo. Never text:
 *              gold on cream measures ~2.5:1 and fails at every size.
 * `accentText` The AA-compliant link/label colour for this background.
 */
export type LightStateId =
  | "dawn" | "firstLight" | "midMorning" | "afternoon" | "lateAfternoon" | "dusk" | "night";

export type LightState = {
  readonly id: LightStateId;
  readonly label: string;
  readonly bg: string;
  readonly text: string;
  readonly accent: string;
  readonly accentText: string;
};

export const LIGHT_STATES: readonly LightState[] = [
  { id: "dawn",          label: "Pre-dawn",       bg: "#232B21", text: "#E9DFC7", accent: "#D5A63E", accentText: "#D5A63E" },
  { id: "firstLight",    label: "First light",    bg: "#3E4A33", text: "#E9DFC7", accent: "#D5A63E", accentText: "#E3B85C" },
  { id: "midMorning",    label: "Mid-morning",    bg: "#F1E9D7", text: "#31402C", accent: "#BB8F2E", accentText: "#7A5C18" },
  { id: "afternoon",     label: "Afternoon",      bg: "#F1E9D7", text: "#31402C", accent: "#BB8F2E", accentText: "#7A5C18" },
  { id: "lateAfternoon", label: "Late afternoon", bg: "#E9DFC8", text: "#31402C", accent: "#BB8F2E", accentText: "#7A5C18" },
  { id: "dusk",          label: "Dusk",           bg: "#E4D2AC", text: "#6E4F2F", accent: "#DCA457", accentText: "#744A12" },
  { id: "night",         label: "Night",          bg: "#232B21", text: "#E9DFC7", accent: "#BB8F2E", accentText: "#D5A63E" },
] as const;

export function lightState(id: LightStateId): LightState {
  const found = LIGHT_STATES.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown light state: ${id}`);
  return found;
}
