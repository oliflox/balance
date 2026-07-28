import { LIME } from '../theme';

export default function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 28,
        transform: 'translateX(-50%)',
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 22px',
        background: LIME,
        color: '#0E100C',
        borderRadius: 999,
        fontWeight: 600,
        fontSize: 14,
        boxShadow: '0 16px 40px rgba(0,0,0,.5)',
        animation: 'popIn .3s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      {message}
    </div>
  );
}
