// Design tokens & constants ported from the original Balance mockup.
import type { CSSProperties } from 'react';

export const BG = '#0E100C';
export const PANEL = '#191C14';
export const INK = '#F2F0E6';
export const LIME = '#C8FF3D';
export const ORANGE = '#FF7A2F';
export const RED = '#FF4D4D';

export const GROUP_NAME = 'La ligue du lundi';
export const ACCENT = LIME;

export const EMOJIS = ['🔥', '💪', '😂', '🐐'] as const;

export type FieldKey = 'taille' | 'hanches' | 'poitrine' | 'bras' | 'cuisse' | 'mg';

export interface FieldDef {
  key: FieldKey;
  label: string;
  unit: string;
}

export const FIELDS: FieldDef[] = [
  { key: 'taille', label: 'Tour de taille', unit: 'cm' },
  { key: 'hanches', label: 'Tour de hanches', unit: 'cm' },
  { key: 'poitrine', label: 'Tour de poitrine', unit: 'cm' },
  { key: 'bras', label: 'Tour de bras', unit: 'cm' },
  { key: 'cuisse', label: 'Tour de cuisse', unit: 'cm' },
  { key: 'mg', label: '% masse grasse', unit: '%' },
];

// Palette proposed to new members during onboarding.
export const COLOR_CHOICES = [
  '#C8FF3D', '#4FE3C1', '#FF7A2F', '#FF5D8F',
  '#A78BFA', '#FFD23F', '#5AA9FF', '#FF4D4D',
];

// Challenge week 0 = Wed 29 Jul 2026 (the group's actual start date).
export const BASE_DATE = Date.UTC(2026, 6, 29);
export const WEEK_MS = 604800000;

// Shared layout/panel styles reused across screens.
export const panel: CSSProperties = {
  background: PANEL,
  border: '1px solid rgba(242,240,230,.10)',
  borderRadius: 22,
  padding: 'clamp(18px, 2vw, 26px)',
};

export const mainStyle: CSSProperties = {
  padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3.5vw, 40px) 80px',
  maxWidth: 1560,
  margin: '0 auto',
};

export const sectionTitle: CSSProperties = {
  fontFamily: 'Anton, sans-serif',
  fontSize: 26,
  margin: 0,
  textTransform: 'uppercase',
};

export const tabStyle = (on: boolean): CSSProperties => ({
  padding: '9px 16px',
  border: 'none',
  borderRadius: 999,
  fontSize: 13.5,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all .2s ease',
  background: on ? LIME : 'transparent',
  color: on ? '#0E100C' : 'rgba(242,240,230,.55)',
});
