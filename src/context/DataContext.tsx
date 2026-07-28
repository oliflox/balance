import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { addWeighIn, createProfile, fetchAll, toggleReaction } from '../lib/data';
import type { NewProfile, NewWeighIn } from '../lib/data';
import { hasEntries, last } from '../lib/compute';
import type { Member, ReactionIndex } from '../types';

interface DataValue {
  loading: boolean;
  error: string | null;
  members: Member[]; // all profiles
  activeMembers: Member[]; // profiles with at least one weigh-in
  reactions: ReactionIndex;
  me: Member | null; // the profile linked to the signed-in user
  groupMaxWeek: number;
  refresh: () => Promise<void>;
  createMyProfile: (p: NewProfile) => Promise<void>;
  saveWeighIn: (w: NewWeighIn) => Promise<void>;
  react: (entryId: string, emoji: string, mine: boolean) => Promise<void>;
}

const DataCtx = createContext<DataValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [reactions, setReactions] = useState<ReactionIndex>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++reqId.current;
    setError(null);
    try {
      const { members, reactions } = await fetchAll(user?.id ?? null);
      if (id !== reqId.current) return; // a newer refresh superseded this one
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
  }, [refresh]);

  const activeMembers = useMemo(() => members.filter(hasEntries), [members]);
  const me = useMemo(() => members.find((m) => m.isMe) ?? null, [members]);
  const groupMaxWeek = useMemo(
    () => (activeMembers.length ? Math.max(...activeMembers.map((m) => last(m).week)) : 0),
    [activeMembers]
  );

  const value = useMemo<DataValue>(
    () => ({
      loading,
      error,
      members,
      activeMembers,
      reactions,
      me,
      groupMaxWeek,
      refresh,
      async createMyProfile(p) {
        if (!user) throw new Error('Non connecté');
        await createProfile(user.id, p);
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
    [loading, error, members, activeMembers, reactions, me, groupMaxWeek, refresh, user]
  );

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData(): DataValue {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
