import { useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchTools } from '@/tools/search';

/**
 * Tool discovery search (spec §10).
 *
 * Results are computed synchronously on every keystroke — the corpus is tiny,
 * so there is no reason to debounce and make the UI feel laggy.
 */
export function ToolSearch() {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchTools(query), [query]);
  const isOpen = query.trim().length > 0;

  function go(index: number) {
    const tool = results[index];
    if (!tool) return;
    setQuery('');
    inputRef.current?.blur();
    navigate(`/${tool.slug}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(activeIndex);
    } else if (event.key === 'Escape') {
      setQuery('');
    }
  }

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 transition-shadow duration-200 focus-within:border-line-strong focus-within:shadow-lg">
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search image tools"
          aria-label="Search image tools"
          aria-autocomplete="list"
          aria-controls={isOpen ? listId : undefined}
          aria-expanded={isOpen}
          role="combobox"
          className="w-full bg-transparent text-ui text-ink outline-none placeholder:text-ink-faint [&::-webkit-search-cancel-button]:appearance-none"
        />
      </div>

      {isOpen && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-xl"
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-faint">
              No tools match “{query.trim()}”
            </p>
          ) : (
            results.map((tool, index) => (
              <button
                key={tool.slug}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => go(index)}
                className={`flex w-full items-baseline justify-between gap-4 px-4 py-2.5 text-left transition-colors duration-100 ${
                  index === activeIndex ? 'bg-accent-soft' : 'bg-transparent'
                }`}
              >
                <span className="text-ui text-ink">{tool.title}</span>
                <span className="text-xs text-ink-faint">{tool.tagline}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0 text-ink-faint"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
