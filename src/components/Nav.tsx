import type { Route } from '../router';

const TABS: { route: Route; label: string; icon: string }[] = [
  { route: 'cull', label: 'Cull', icon: 'M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3' },
  { route: 'add', label: 'Add', icon: 'M12 5v14M5 12h14' },
  { route: 'items', label: 'Items', icon: 'M4 6h16M4 12h16M4 18h16' },
  { route: 'maybe', label: 'Maybe', icon: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7' },
  { route: 'progress', label: 'Stats', icon: 'M5 20V10M12 20V4M19 20v-7' },
];

export function Nav({ route, maybeDue }: { route: Route; maybeDue: number }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <ul className="mx-auto flex max-w-xl">
        {TABS.map((t) => {
          const active = route === t.route;
          return (
            <li key={t.route} className="flex-1">
              <a
                href={`#/${t.route}`}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                  active ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d={t.icon} />
                </svg>
                {t.label}
                {t.route === 'maybe' && maybeDue > 0 && (
                  <span className="absolute right-1/2 top-1 translate-x-4 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold leading-4 text-slate-950">
                    {maybeDue}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
