import { COLOR_CHOICES } from '../theme';

export const textInput: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  background: '#0E100C',
  border: '1px solid rgba(242,240,230,.12)',
  borderRadius: 12,
  color: '#F2F0E6',
  fontSize: 15,
  outline: 'none',
};

export function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(242,240,230,.5)', marginBottom: 8 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 14, padding: '11px 14px', background: 'rgba(255,77,77,.12)', border: '1px solid rgba(255,77,77,.35)', borderRadius: 10, color: '#FF8080', fontSize: 13 }}>
      {children}
    </div>
  );
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {COLOR_CHOICES.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          aria-label={c}
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: c,
            cursor: 'pointer',
            border: value === c ? '3px solid #F2F0E6' : '3px solid transparent',
            boxShadow: value === c ? `0 0 0 2px ${c}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

export function UnitInput({
  value,
  onChange,
  unit,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  unit: string;
  placeholder?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#0E100C', border: '1px solid rgba(242,240,230,.12)', borderRadius: 12, padding: '0 12px' }}>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, padding: '13px 0', background: 'transparent', border: 'none', color: '#F2F0E6', fontSize: 16, outline: 'none', fontVariantNumeric: 'tabular-nums' }}
      />
      <span style={{ fontSize: 12, color: 'rgba(242,240,230,.4)' }}>{unit}</span>
    </div>
  );
}
