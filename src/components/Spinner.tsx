import { LIME } from '../theme';

export default function Spinner({ label }: { label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '3px solid rgba(242,240,230,.14)',
          borderTopColor: LIME,
          animation: 'spin .8s linear infinite',
        }}
      />
      {label && <div style={{ fontSize: 13, color: 'rgba(242,240,230,.5)', letterSpacing: '.04em' }}>{label}</div>}
    </div>
  );
}
