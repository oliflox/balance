import { supabase } from '../supabaseClient';
import { BASE_DATE, WEEK_MS } from '../theme';
import type { FieldKey } from '../theme';
import type { Entry, Member, ReactionIndex } from '../types';

interface ProfileRow {
  id: string;
  user_id: string | null;
  name: string;
  color: string;
  start_weight: number | string;
  target: number | string;
  roast: string | null;
  trophy_icon: string | null;
  trophy_title: string | null;
  is_demo: boolean;
}

interface EntryRow {
  id: string;
  profile_id: string;
  week: number;
  weight: number | string;
  taille: number | string | null;
  hanches: number | string | null;
  poitrine: number | string | null;
  bras: number | string | null;
  cuisse: number | string | null;
  mg: number | string | null;
  note: string | null;
}

interface ReactionRow {
  entry_id: string;
  user_id: string;
  emoji: string;
}

const num = (v: number | string | null | undefined): number | null =>
  v == null || v === '' ? null : Number(v);

export const isoDateForWeek = (week: number) =>
  new Date(BASE_DATE + week * WEEK_MS).toISOString().slice(0, 10);

export interface FetchResult {
  members: Member[];
  reactions: ReactionIndex;
}

export async function fetchAll(userId: string | null): Promise<FetchResult> {
  const [profilesRes, entriesRes, reactsRes] = await Promise.all([
    supabase.from('balance_profiles').select('*'),
    supabase.from('balance_entries').select('*').order('week', { ascending: true }),
    supabase.from('balance_reactions').select('entry_id,user_id,emoji'),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (entriesRes.error) throw entriesRes.error;
  if (reactsRes.error) throw reactsRes.error;

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const entryRows = (entriesRes.data ?? []) as EntryRow[];
  const reactRows = (reactsRes.data ?? []) as ReactionRow[];

  const byProfile: Record<string, Entry[]> = {};
  for (const row of entryRows) {
    const e: Entry = {
      id: row.id,
      profileId: row.profile_id,
      week: row.week,
      date: BASE_DATE + row.week * WEEK_MS,
      weight: Number(row.weight),
      taille: num(row.taille),
      hanches: num(row.hanches),
      poitrine: num(row.poitrine),
      bras: num(row.bras),
      cuisse: num(row.cuisse),
      mg: num(row.mg),
      note: row.note ?? '',
    };
    (byProfile[row.profile_id] ??= []).push(e);
  }

  const members: Member[] = profiles.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    start: Number(p.start_weight),
    target: Number(p.target),
    roast: p.roast ?? '',
    trophy: [p.trophy_icon ?? '', p.trophy_title ?? ''],
    isDemo: p.is_demo,
    isMe: !!userId && p.user_id === userId,
    entries: (byProfile[p.id] ?? []).sort((a, b) => a.week - b.week),
  }));

  const reactions: ReactionIndex = {};
  for (const r of reactRows) {
    const forEntry = (reactions[r.entry_id] ??= {});
    const cell = (forEntry[r.emoji] ??= { count: 0, mine: false });
    cell.count++;
    if (userId && r.user_id === userId) cell.mine = true;
  }

  return { members, reactions };
}

export interface NewProfile {
  name: string;
  color: string;
  start: number;
  target: number;
}

export async function createProfile(userId: string, p: NewProfile): Promise<void> {
  const { error } = await supabase.from('balance_profiles').insert({
    user_id: userId,
    name: p.name,
    color: p.color,
    start_weight: p.start,
    target: p.target,
    is_demo: false,
  });
  if (error) throw error;
}

export interface NewWeighIn {
  week: number;
  weight: number;
  note: string;
  measures: Partial<Record<FieldKey, number | null>>;
}

export async function addWeighIn(profileId: string, w: NewWeighIn): Promise<void> {
  const { error } = await supabase.from('balance_entries').insert({
    profile_id: profileId,
    week: w.week,
    date: isoDateForWeek(w.week),
    weight: w.weight,
    taille: w.measures.taille ?? null,
    hanches: w.measures.hanches ?? null,
    poitrine: w.measures.poitrine ?? null,
    bras: w.measures.bras ?? null,
    cuisse: w.measures.cuisse ?? null,
    mg: w.measures.mg ?? null,
    note: w.note,
  });
  if (error) throw error;
}

export async function toggleReaction(entryId: string, userId: string, emoji: string, mine: boolean): Promise<void> {
  if (mine) {
    const { error } = await supabase
      .from('balance_reactions')
      .delete()
      .match({ entry_id: entryId, user_id: userId, emoji });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('balance_reactions')
      .insert({ entry_id: entryId, user_id: userId, emoji });
    if (error) throw error;
  }
}

export interface PublicStats {
  totalLost: number;
  memberCount: number;
  weekNo: number;
}

export async function fetchPublicStats(): Promise<PublicStats> {
  const { data, error } = await supabase.rpc('balance_public_stats');
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as
    | { total_lost: number | string; member_count: number; week_no: number }
    | undefined;
  return {
    totalLost: row ? Number(row.total_lost) : 0,
    memberCount: row ? row.member_count : 0,
    weekNo: row ? row.week_no : 0,
  };
}
