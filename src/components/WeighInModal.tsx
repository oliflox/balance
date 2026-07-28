import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { fmtDate, last, r1 } from '../lib/compute';
import { BASE_DATE, FIELDS, LIME, ORANGE, WEEK_MS } from '../theme';
import type { FieldKey } from '../theme';
import type { WeighInForm } from '../types';

interface Props {
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function WeighInModal({ onClose, onSaved }: Props) {
  const { me, groupMaxWeek, saveWeighIn } = useData();

  const prevEntry = me && me.entries.length ? last(me) : null;
  const prevWeight = prevEntry ? prevEntry.weight : me?.start ?? 0;
  const nextWeek = prevEntry ? prevEntry.week + 1 : groupMaxWeek;

  const [form, setForm] = useState<WeighInForm>(() => ({
    weight: String(r1(prevWeight - 0.4)),
    note: '',
    taille: prevEntry?.taille != null ? String(prevEntry.taille) : '',
    hanches: prevEntry?.hanches != null ? String(prevEntry.hanches) : '',
    poitrine: prevEntry?.poitrine != null ? String(prevEntry.poitrine) : '',
    bras: prevEntry?.bras != null ? String(prevEntry.bras) : '',
    cuisse: prevEntry?.cuisse != null ? String(prevEntry.cuisse) : '',
    mg: prevEntry?.mg != null ? String(prevEntry.mg) : '',
  }));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const setField = (name: keyof WeighInForm, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErr('');
  };

  const bumpWeight = (d: number) => {
    const v = parseFloat(form.weight);
    setField('weight', String(r1((isNaN(v) ? prevWeight : v) + d)));
  };

  const fw = parseFloat(form.weight);
  const diff = isNaN(fw) ? null : r1(fw - prevWeight);
  const { diffText, diffColor } = useMemo(() => diffInfo(diff), [diff]);

  const nextDateLong = fmtDate(BASE_DATE + nextWeek * WEEK_MS, true);

  const save = async () => {
    const w = parseFloat(form.weight);
    if (isNaN(w) || w < 30 || w > 250) return setErr('Un poids entre 30 et 250 kg, soyons raisonnables.');
    setBusy(true);
    const measures: Partial<Record<FieldKey, number | null>> = {};
    for (const f of FIELDS) {
      const v = parseFloat(form[f.name] ?? '');
      measures[f.key] = isNaN(v) ? (prevEntry ? prevEntry[f.key] : null) : r1(v);
    }
    try {
      await saveWeighIn({ week: nextWeek, weight: r1(w), note: form.note ?? '', measures });
      const d = r1(w - prevWeight);
      onSaved(
        d <= 0
          ? 'Pesée publiée : ' + d + ' kg. Le groupe applaudit.'
          : 'Pesée publiée : +' + d + ' kg. Le groupe rit.'
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur à la publication.');
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(6,7,5,.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vh, 56px) 16px',
        overflowY: 'auto',
        animation: 'fadeIn .2s ease both',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 620,
          background: '#191C14',
          border: '1px solid rgba(242,240,230,.14)',
          borderRadius: 24,
          padding: 'clamp(20px, 3vw, 32px)',
          animation: 'popIn .3s cubic-bezier(.2,.8,.2,1) both',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: LIME }}>
              Semaine {nextWeek + 1} · {nextDateLong}
            </div>
            <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(28px, 4vw, 38px)', margin: '10px 0 0', textTransform: 'uppercase' }}>Nouvelle pesée</h2>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'rgba(242,240,230,.5)' }}>
              À jeun, sans chaussures, et on ne triche pas — {me?.name}.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, flex: 'none', background: '#0E100C', border: '1px solid rgba(242,240,230,.14)', borderRadius: '50%', color: 'rgba(242,240,230,.6)', fontSize: 17, cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {/* Weight stepper */}
        <div style={{ marginTop: 24, padding: 18, background: '#0E100C', border: '1px solid rgba(200,255,61,.22)', borderRadius: 18 }}>
          <label style={{ display: 'block', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(242,240,230,.5)', marginBottom: 10 }}>
            Poids (kg) · l'info qui fâche
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => bumpWeight(-0.1)} style={stepBtn}>−</button>
            <input
              type="number"
              step="0.1"
              value={form.weight}
              onChange={(e) => setField('weight', e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: '12px 14px', background: 'transparent', border: 'none', color: '#F2F0E6', fontFamily: 'Anton, sans-serif', fontSize: 40, textAlign: 'center', outline: 'none', fontVariantNumeric: 'tabular-nums' }}
            />
            <button onClick={() => bumpWeight(0.1)} style={stepBtn}>+</button>
          </div>
          <div style={{ marginTop: 10, textAlign: 'center', fontSize: 13, color: diffColor, fontVariantNumeric: 'tabular-nums' }}>{diffText}</div>
        </div>

        {/* Measurements */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 16 }}>
          {FIELDS.map((f) => (
            <div key={f.name}>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(242,240,230,.5)', marginBottom: 7 }}>{f.label}</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#0E100C', border: '1px solid rgba(242,240,230,.12)', borderRadius: 12, padding: '0 12px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={form[f.name] ?? ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ flex: 1, minWidth: 0, padding: '13px 0', background: 'transparent', border: 'none', color: '#F2F0E6', fontSize: 16, outline: 'none', fontVariantNumeric: 'tabular-nums' }}
                />
                <span style={{ fontSize: 12, color: 'rgba(242,240,230,.4)' }}>{f.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(242,240,230,.5)', marginBottom: 7 }}>Un mot pour le groupe (optionnel)</label>
          <input
            type="text"
            value={form.note}
            onChange={(e) => setField('note', e.target.value)}
            placeholder="Raclette samedi, assumé."
            style={{ width: '100%', padding: '13px 14px', background: '#0E100C', border: '1px solid rgba(242,240,230,.12)', borderRadius: 12, color: '#F2F0E6', fontSize: 14.5, outline: 'none' }}
          />
        </div>

        {err && (
          <div style={{ marginTop: 14, padding: '11px 14px', background: 'rgba(255,77,77,.12)', border: '1px solid rgba(255,77,77,.35)', borderRadius: 10, color: '#FF8080', fontSize: 13 }}>{err}</div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
          <button
            onClick={save}
            disabled={busy}
            style={{ flex: 1, minWidth: 180, padding: 16, background: LIME, border: 'none', borderRadius: 14, color: '#0E100C', fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '.05em', textTransform: 'uppercase', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}
          >
            {busy ? 'Publication…' : 'Publier la pesée'}
          </button>
          <button onClick={onClose} style={{ padding: '16px 22px', background: 'transparent', border: '1px solid rgba(242,240,230,.16)', borderRadius: 14, color: 'rgba(242,240,230,.6)', fontSize: 14, cursor: 'pointer' }}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

const stepBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  flex: 'none',
  background: '#191C14',
  border: '1px solid rgba(242,240,230,.14)',
  borderRadius: 12,
  color: '#F2F0E6',
  fontSize: 20,
  cursor: 'pointer',
};

function diffInfo(diff: number | null): { diffText: string; diffColor: string } {
  if (diff === null) return { diffText: 'Entre ton poids pour voir les dégâts.', diffColor: 'rgba(242,240,230,.45)' };
  if (diff === 0) return { diffText: 'Exactement comme la semaine dernière. Suspect.', diffColor: LIME };
  if (diff < 0) return { diffText: Math.abs(diff) + ' kg de moins que lundi dernier. Joli.', diffColor: LIME };
  return { diffText: '+' + diff + ' kg depuis lundi dernier. On ne juge pas (si).', diffColor: ORANGE };
}
