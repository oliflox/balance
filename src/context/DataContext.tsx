import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { addWeighIn, createProfile, createRoom, fetchAll, roomByCode, toggleReaction, updateProfile } from '../lib/data';
import type { NewProfile, NewWeighIn, ProfileUpdate } from '../lib/data';
import { hasEntries } from '../lib/compute';
import type { Member, ReactionIndex, Room } from '../types';

interface DataValue {
  loading: boolean;
  error: string | null;
  room: Room | null; // the room the user belongs to, or one they created but never joined
  members: Member[]; // all profiles in that room
  activeMembers: Member[]; // profiles with at least one weigh-in
  reactions: ReactionIndex;
  me: Member | null; // the profile linked to the signed-in user
  openRoom: (name: string) => Promise<string>;
  findRoom: (code: string) => Promise<{ id: string; name: string }>;
  createMyProfile: (p: NewProfile) => Promise<void>;
  updateMyProfile: (fields: ProfileUpdate) => Promise<void>;
  saveWeighIn: (w: NewWeighIn) => Promise<void>;
  react: (entryId: string, emoji: string, mine: boolean) => Promise<void>;
}

const DataCtx = createContext<DataValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [reactions, setReactions] = useState<ReactionIndex>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++reqId.current;
    setError(null);
    try {
      const { room, members, reactions } = await fetchAll(user?.id ?? null);
      if (id !== reqId.current) return; // a newer refresh superseded this one
      setRoom(room);
      setMembers(members);
      setReactions(reactions);
    } catch (e) {
      if (id === reqId.current) setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    refresh();
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, [refresh]);

  const activeMembers = useMemo(() => members.filter(hasEntries), [members]);
  const me = useMemo(() => members.find((m) => m.isMe) ?? null, [members]);
  const value = useMemo<DataValue>(
    () => ({
      loading,
      error,
      room,
      members,
      activeMembers,
      reactions,
      me,
      async openRoom(name) {
        if (!user) throw new Error('Non connecté');
        const id = await createRoom(user.id, name);
        await refresh();
        return id;
      },
      findRoom: roomByCode,
      async createMyProfile(p) {
        if (!user) throw new Error('Non connecté');
        await createProfile(user.id, p);
        await refresh();
      },
      async updateMyProfile(fields) {
        if (!me) throw new Error('Profil manquant');
        await updateProfile(me.id, fields);
        await refresh();
      },
      async saveWeighIn(w) {
        if (!me) throw new Error('Profil manquant');
        await addWeighIn(me.id, w);
        await refresh();
      },
      async react(entryId, emoji, mine) {
        if (!user) return;
        // optimistic toggle
        setReactions((prev) => {
          const next: ReactionIndex = { ...prev, [entryId]: { ...(prev[entryId] ?? {}) } };
          const cell = next[entryId][emoji] ?? { count: 0, mine: false };
          next[entryId][emoji] = { count: cell.count + (mine ? -1 : 1), mine: !mine };
          return next;
        });
        try {
          await toggleReaction(entryId, user.id, emoji, mine);
        } catch {
          await refresh(); // roll back to server truth on failure
        }
      },
    }),
    [loading, error, room, members, activeMembers, reactions, me, refresh, user]
  );

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData(): DataValue {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
