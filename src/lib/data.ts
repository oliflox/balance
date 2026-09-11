import { supabase } from '../supabaseClient';
import { calWeek } from './compute';
import type { FieldKey } from '../theme';
import type { Entry, Member, ReactionIndex, Room } from '../types';

interface RoomRow {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  created_at: string;
}

interface ProfileRow {
  id: string;
  user_id: string | null;
  room_id: string;
  name: string;
  color: string;
  start_weight: number | string;
  target: number | string;
  roast: string | null;
  created_at: string | null;
}

interface EntryRow {
  id: string;
  profile_id: string;
  week: number;
  date: string;
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

interface FetchResult {
  room: Room | null;
  members: Member[];
  reactions: ReactionIndex;
}

// No room filter anywhere below on purpose: row-level security only ever hands
// back the signed-in member's own room, so `select *` is already scoped. A room
// the user owns but hasn't joined yet also comes back — that's the half-finished
// signup we need to be able to resume.
export async function fetchAll(userId: string | null): Promise<FetchResult> {
  const [roomsRes, profilesRes, entriesRes, reactsRes] = await Promise.all([
    supabase.from('balance_rooms').select('id,name,code,owner_id,created_at'),
    supabase.from('balance_profiles').select('*'),
    supabase.from('balance_entries').select('*').order('week', { ascending: true }),
    supabase.from('balance_reactions').select('entry_id,user_id,emoji'),
  ]);
  // La room ne porte que le nom affiché et le code d'invitation. Si sa lecture
  // échoue, on dégrade ces deux détails plutôt que d'éteindre tout le tableau
  // de bord — les pesées, elles, restent lisibles.
  if (roomsRes.error) console.warn('Room illisible :', roomsRes.error.message);
  if (profilesRes.error) throw profilesRes.error;
  if (entriesRes.error) throw entriesRes.error;
  if (reactsRes.error) throw reactsRes.error;

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const entryRows = (entriesRes.data ?? []) as EntryRow[];
  const reactRows = (reactsRes.data ?? []) as ReactionRow[];

  const byProfile: Record<string, Entry[]> = {};
  for (const row of entryRows) {
    const date = new Date(row.date).getTime();
    const e: Entry = {
      id: row.id,
      profileId: row.profile_id,
      // The stored column is only there for the one-per-week unique key; the
      // week a weigh-in belongs to is always the one its date falls in.
      week: calWeek(date),
      date,
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

  const members: Member[] = profiles.map((p) => {
    const entries = (byProfile[p.id] ?? []).sort((a, b) => a.week - b.week);
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      start: Number(p.start_weight),
      target: Number(p.target),
      roast: p.roast ?? '',
      // How many weigh-ins a member owes is counted from the day they joined.
      // Older rows predate the column, so their first weigh-in stands in.
      joined: p.created_at ? Date.parse(p.created_at) : entries[0]?.date ?? Date.now(),
      isMe: !!userId && p.user_id === userId,
      entries,
    };
  });

  const reactions: ReactionIndex = {};
  for (const r of reactRows) {
    const forEntry = (reactions[r.entry_id] ??= {});
    const cell = (forEntry[r.emoji] ??= { count: 0, mine: false });
    cell.count++;
    if (userId && r.user_id === userId) cell.mine = true;
  }

  const roomRow = ((roomsRes.data ?? []) as RoomRow[] | null)?.[0];
  const room: Room | null = roomRow
    ? {
        id: roomRow.id,
        name: roomRow.name,
        code: roomRow.code,
        createdAt: Date.parse(roomRow.created_at),
        isMine: roomRow.owner_id === userId,
      }
    : null;

  return { room, members, reactions };
}

// ---- Rooms -------------------------------------------------------------------

export async function createRoom(userId: string, name: string): Promise<string> {
  const { data, error } = await supabase
    .from('balance_rooms')
    .insert({ name: name.trim(), owner_id: userId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

// A code is the only handle on a room you are not a member of, so the lookup
// goes through a security-definer function rather than a readable table.
export async function roomByCode(code: string): Promise<{ id: string; name: string }> {
  const { data, error } = await supabase.rpc('balance_room_by_code', { p_code: code });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as { id: string; name: string } | undefined;
  if (!row) throw new Error('Aucune room avec ce code. Vérifie auprès de qui t’a invité.');
  return row;
}

// L'autorisation est vérifiée dans la fonction, pas ici : le bouton caché n'est
// qu'un confort d'interface, la base est ce qui refuse réellement.
export async function removeMember(profileId: string): Promise<void> {
  const { error } = await supabase.rpc('balance_remove_member', { p_profile_id: profileId });
  if (error) throw error;
}

export interface NewProfile {
  roomId: string;
  name: string;
  color: string;
  start: number;
  target: number;
}

export async function createProfile(userId: string, p: NewProfile): Promise<void> {
  const { error } = await supabase.from('balance_profiles').insert({
    user_id: userId,
    room_id: p.roomId,
    name: p.name,
    color: p.color,
    start_weight: p.start,
    target: p.target,
    is_demo: false,
  });
  // 23505 = one profile per user: they are already in a room.
  if (error) throw error.code === '23505' ? new Error('Tu es déjà membre d’une room.') : error;
}

export interface ProfileUpdate {
  name?: string;
  color?: string;
  start?: number;
  target?: number;
}

export async function updateProfile(profileId: string, fields: ProfileUpdate): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.color !== undefined) payload.color = fields.color;
  if (fields.start !== undefined) payload.start_weight = fields.start;
  if (fields.target !== undefined) payload.target = fields.target;
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase.from('balance_profiles').update(payload).eq('id', profileId);
  if (error) throw error;
}

export interface NewWeighIn {
  weight: number;
  note: string;
  measures: Partial<Record<FieldKey, number | null>>;
}

export async function addWeighIn(profileId: string, w: NewWeighIn): Promise<void> {
  const { error } = await supabase.from('balance_entries').insert({
    profile_id: profileId,
    week: calWeek(Date.now()),
    date: new Date().toISOString().slice(0, 10),
    weight: w.weight,
    taille: w.measures.taille ?? null,
    hanches: w.measures.hanches ?? null,
    poitrine: w.measures.poitrine ?? null,
    bras: w.measures.bras ?? null,
    cuisse: w.measures.cuisse ?? null,
    mg: w.measures.mg ?? null,
    note: w.note,
  });
  // 23505 = the (profile_id, week) unique key: someone already weighed in this
  // week, most likely from another tab while this one held stale data.
  if (error) throw error.code === '23505' ? new Error('Tu t’es déjà pesé cette semaine.') : error;
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
