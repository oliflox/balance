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

export interface Room {
  id: string;
  name: string;
  code: string; // the invite code — the only way into a private room
  isMine: boolean; // true when the signed-in user created it
}

export interface Member {
  id: string;
  name: string;
  color: string;
  start: number;
  target: number;
  roast: string;
  joined: number; // ms timestamp the profile was created
  isMe: boolean;
  entries: Entry[]; // sorted ascending by week
}

// entryId -> emoji -> { count, mine }
export type ReactionIndex = Record<string, Record<string, { count: number; mine: boolean }>>;

export interface WeighInForm extends Partial<Record<FieldKey, string>> {
  weight: string;
  note: string;
}
