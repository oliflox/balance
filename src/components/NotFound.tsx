import { hrefFor } from '../lib/route';
import { LIME, ORANGE, mainStyle, panel, primaryBtn } from '../theme';

interface Props {
  /** Shown to signed-out visitors too, who have no dashboard to go back to. */
  homeHref?: string;
}

export default function NotFound({ homeHref = hrefFor({ name: 'dash' }) }: Props) {
  return (
    <main style={{ ...mainStyle, display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
      <div style={{ ...panel, maxWidth: 520, textAlign: 'center', padding: 'clamp(28px, 4vw, 44px)', animation: 'popIn .35s cubic-bezier(.2,.8,.2,1) both' }}>
        <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: ORANGE }}>Erreur 404</div>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(72px, 16vw, 132px)', lineHeight: 0.85, margin: '14px 0 0', color: LIME }}>
          404
        </div>
        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(24px, 4vw, 34px)', margin: '16px 0 0', textTransform: 'uppercase' }}>
          Cette page a sauté sa pesée
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: 'rgba(242,240,230,.5)', lineHeight: 1.5 }}>
          Introuvable au classement, absente du fil, portée disparue. On ne juge pas — mais la balance, si.
        </p>
        <a href={homeHref} style={{ ...primaryBtn('pill'), display: 'inline-block', marginTop: 24, textDecoration: 'none' }}>
          Retour au groupe
        </a>
      </div>
    </main>
  );
}
