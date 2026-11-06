import { useEffect, useState } from 'react';

export type Route = 'cull' | 'add' | 'items' | 'maybe' | 'progress' | 'settings';
const ROUTES: Route[] = ['cull', 'add', 'items', 'maybe', 'progress', 'settings'];

function parse(): Route {
  const r = window.location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(r) ? r : 'cull';
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function go(route: Route) {
  window.location.hash = `/${route}`;
}
