import { useRef, useState, type ReactNode } from 'react';

const THRESHOLD = 90;

/**
 * Horizontal swipe wrapper: swipe right -> onRight, left -> onLeft.
 * Vertical scrolling still works (touch-action: pan-y). Taps pass through to children.
 */
export function SwipeCard({
  children,
  onLeft,
  onRight,
  leftLabel,
  rightLabel,
}: {
  children: ReactNode;
  onLeft: () => void;
  onRight: () => void;
  leftLabel: string;
  rightLabel: string;
}) {
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<0 | 1 | -1>(0);
  const start = useRef<{ x: number; y: number; id: number; locked?: 'x' | 'y' } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }
  function onPointerMove(e: React.PointerEvent) {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!s.locked) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      s.locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (s.locked === 'x') (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (s.locked === 'x') setDx(mx);
  }
  function onPointerUp() {
    const s = start.current;
    start.current = null;
    if (!s || s.locked !== 'x') return;
    if (Math.abs(dx) >= THRESHOLD) {
      const dir = dx > 0 ? 1 : -1;
      setLeaving(dir);
      window.setTimeout(() => (dir > 0 ? onRight() : onLeft()), 140);
    } else {
      setDx(0);
    }
  }

  const offset = leaving ? leaving * window.innerWidth : dx;
  const progress = Math.min(Math.abs(dx) / THRESHOLD, 1);

  return (
    <div className="relative">
      <div
        aria-hidden
        className={`absolute inset-0 flex items-center rounded-2xl px-6 text-lg font-bold text-white ${
          dx > 0 ? 'justify-start bg-emerald-600' : 'justify-end bg-rose-600'
        }`}
        style={{ opacity: dx === 0 && !leaving ? 0 : 0.4 + 0.6 * progress }}
      >
        {dx > 0 ? rightLabel : leftLabel}
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          start.current = null;
          setDx(0);
        }}
        style={{
          transform: `translateX(${offset}px) rotate(${offset / 40}deg)`,
          transition: start.current?.locked === 'x' ? 'none' : 'transform 160ms ease-out',
          touchAction: 'pan-y',
        }}
        className="relative"
      >
        {children}
      </div>
    </div>
  );
}
