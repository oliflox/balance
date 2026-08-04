// Design tokens & constants ported from the original Balance mockup.

export const BG = '#0E100C';
export const PANEL = '#191C14';
export const INK = '#F2F0E6';
export const LIME = '#C8FF3D';
export const ORANGE = '#FF7A2F';
export const RED = '#FF4D4D';

export const GROUP_NAME = 'La ligue du lundi';
export const ACCENT = LIME;
export const SHOW_ROASTS = true;

export const EMOJIS = ['🔥', '💪', '😂', '🐐'] as const;

export type FieldKey = 'taille' | 'hanches' | 'poitrine' | 'bras' | 'cuisse' | 'mg';

export interface FieldDef {
  name: FieldKey;
  label: string;
  unit: string;
  key: FieldKey;
}

export const FIELDS: FieldDef[] = [
  { name: 'taille', label: 'Tour de taille', unit: 'cm', key: 'taille' },
  { name: 'hanches', label: 'Tour de hanches', unit: 'cm', key: 'hanches' },
  { name: 'poitrine', label: 'Tour de poitrine', unit: 'cm', key: 'poitrine' },
  { name: 'bras', label: 'Tour de bras', unit: 'cm', key: 'bras' },
  { name: 'cuisse', label: 'Tour de cuisse', unit: 'cm', key: 'cuisse' },
  { name: 'mg', label: '% masse grasse', unit: '%', key: 'mg' },
];

// Palette proposed to new members during onboarding.
export const COLOR_CHOICES = [
  '#C8FF3D', '#4FE3C1', '#FF7A2F', '#FF5D8F',
  '#A78BFA', '#FFD23F', '#5AA9FF', '#FF4D4D',
];

// Challenge week 0 = Wed 29 Jul 2026 (the group's actual start date).
export const BASE_DATE = Date.UTC(2026, 6, 29);
export const WEEK_MS = 604800000;
