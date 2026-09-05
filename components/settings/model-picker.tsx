'use client';

import { Check, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProviderIcon } from '@/components/ui/provider-icon';
import { PROVIDERS, UNKNOWN, prettyModel } from '@/lib/providers';
import { cn, formatCount } from '@/lib/utils';
import type { ModelInfo } from '@/types';

/**
 * The model list, filtered by vendor. Vendor chips are built from the
 * models the endpoint actually returned, so a gateway with only three
 * vendors shows three chips rather than the whole registry.
 */
export function ModelPicker({
  models,
  selected,
  onSelect,
}: {
  models: ModelInfo[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [vendor, setVendor] = useState<string | null>(null);

  const vendors = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of models) counts.set(m.providerId, (counts.get(m.providerId) ?? 0) + 1);
    const lookup = new Map([...PROVIDERS, UNKNOWN].map((p) => [p.id, p]));
    return [...counts.entries()]
      .map(([id, count]) => ({ provider: lookup.get(id) ?? UNKNOWN, count }))
      .sort((a, b) => b.count - a.count || a.provider.label.localeCompare(b.provider.label));
  }, [models]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return models.filter((m) => {
      if (vendor && m.providerId !== vendor) return false;
      if (!q) return true;
      return m.id.toLowerCase().includes(q);
    });
  }, [models, query, vendor]);

  if (!models.length) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-2.5">
        <Search className="size-3.5 shrink-0 text-ash" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Filter ${formatCount(models.length)} models`}
          className="h-9 min-w-0 flex-1 border-none bg-transparent text-[13px] font-medium text-vellum placeholder:font-normal placeholder:text-ash focus-visible:outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="shrink-0 text-ash transition-colors hover:text-vellum"
          >
            <X className="size-3.5" />
            <span className="sr-only">Clear filter</span>
          </button>
        ) : null}
      </div>

      {vendors.length > 1 ? (
        <div className="-mx-0.5 flex flex-wrap gap-1.5 px-0.5">
          <VendorChip
            label="All"
            count={models.length}
            active={vendor === null}
            onClick={() => setVendor(null)}
          />
          {vendors.map(({ provider, count }) => (
            <VendorChip
              key={provider.id}
              label={provider.label}
              slug={provider.slug}
              hue={provider.hue}
              count={count}
              active={vendor === provider.id}
              onClick={() => setVendor(vendor === provider.id ? null : provider.id)}
            />
          ))}
        </div>
      ) : null}

      <div className="-mr-1 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]">
        {visible.length ? (
          <ul className="flex flex-col gap-1">
            {visible.map((model) => {
              const isSelected = model.id === selected;
              return (
                <li key={model.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(model.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors',
                      isSelected
                        ? 'border-white/28 bg-white/10'
                        : 'border-transparent hover:border-white/12 hover:bg-white/6',
                    )}
                  >
                    <ProviderIcon model={model.id} size={17} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold tracking-tight text-vellum">
                        {prettyModel(model.id)}
                      </span>
                      <span className="block truncate font-mono text-[10.5px] text-ash">
                        {model.context
                          ? `${formatCount(model.context)} ctx · ${model.id}`
                          : model.id}
                      </span>
                    </span>
                    {isSelected ? (
                      <Check className="size-4 shrink-0 text-vellum" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-1 py-6 text-center text-[13px] font-medium text-ash">
            No model matches “{query}”.
          </p>
        )}
      </div>
    </div>
  );
}

function VendorChip({
  label,
  slug,
  hue,
  count,
  active,
  onClick,
}: {
  label: string;
  slug?: string;
  hue?: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2 text-[11.5px] font-semibold tracking-tight transition-colors',
        active
          ? 'border-current text-vellum'
          : 'border-white/12 text-mist hover:border-white/24 hover:text-vellum',
      )}
      style={
        active
          ? { color: hue ?? '#f3eff7', backgroundColor: `${(hue ?? '#f3eff7')}1f` }
          : undefined
      }
    >
      {slug ? <ProviderIcon slug={slug} size={13} /> : null}
      <span>{label}</span>
      <span className="font-mono text-[10px] opacity-70">{count}</span>
    </button>
  );
}
