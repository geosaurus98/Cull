import { useEffect, useState } from 'react';

export function usePhotoUrl(photo?: Blob): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!photo) {
      setUrl(undefined);
      return;
    }
    const u = URL.createObjectURL(photo);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo]);
  return url;
}

export function Thumb({ photo, name, className = 'h-16 w-16' }: { photo?: Blob; name: string; className?: string }) {
  const url = usePhotoUrl(photo);
  if (url) return <img src={url} alt="" className={`${className} shrink-0 rounded-xl object-cover`} />;
  return (
    <div
      aria-hidden
      className={`${className} flex shrink-0 items-center justify-center rounded-xl bg-slate-200 text-xl font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400`}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  );
}
