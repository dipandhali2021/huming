'use client';

import { useState } from 'react';
import { iconUrl, providerFor } from '@/lib/providers';
import { cn } from '@/lib/utils';

export function ProviderIcon({
  model,
  slug,
  size = 16,
  className,
}: {
  /** Resolve the icon from a model id… */
  model?: string;
  /** …or name the lobehub slug directly. */
  slug?: string;
  size?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const provider = model ? providerFor(model) : undefined;
  const resolved = slug ?? provider?.slug;
  const label = provider?.label ?? slug ?? 'model';

  if (!resolved || broken) {
    return (
      <span
        aria-hidden
        className={cn(
          'grid shrink-0 place-items-center rounded-[4px] bg-white/12',
          'font-mono text-[9px] font-semibold text-mist',
          className,
        )}
        style={{ width: size, height: size }}
      >
        {label.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={iconUrl(resolved)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      className={cn('shrink-0 object-contain', className)}
      style={{ width: size, height: size }}
    />
  );
}
