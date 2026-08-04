import type { FieldKey } from './theme';

export interface Entry {
  id: string;
  profileId: string;
  week: number;
  date: number; // ms timestamp, the real day the weigh-in was submitted
  weight: number;
  taille: number | null;
  hanches: number | null;
  poitrine: number | null;
  bras: number | null;
  cuisse: number | null;
  mg: number | null;
  note: string;
}

export interface Member {
  id: string;
  name: string;
  color: string;
  start: number;
  target: number;
  roast: string;
  trophy: [string, string]; // [icon, title]
  isDemo: boolean;
  isMe: boolean;
  entries: Entry[]; // sorted ascending by week
}

// entryId -> emoji -> { count, mine }
export type ReactionIndex = Record<string, Record<string, { count: number; mine: boolean }>>;

export type MeasureValue = Partial<Record<FieldKey, string>>;

export interface WeighInForm extends MeasureValue {
  weight: string;
  note: string;
}
