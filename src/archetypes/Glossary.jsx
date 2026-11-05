import { useMemo, useState } from 'react';
import { ArrowRight, Eye, Search } from 'lucide-react';
import { Section, Segmented, Toggle, Insight, Pill } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import { pageById } from '../content/registry.js';

/** Searchable terms with an optional analogy and a test-yourself mode. */
export default function Glossary({ data }) {
  const { terms, analogyLabel = 'Analogy' } = data;
  const cats = ['All', ...Array.from(new Set(terms.map((t) => t.cat)))];
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [analogy, setAnalogy] = useState(true);
  const [quiz, setQuiz] = useState(false);
  const [revealed, setRevealed] = useState({});

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return terms.filter((g) => (cat === 'All' || g.cat === cat) && (!needle || g.term.toLowerCase().includes(needle) || g.what.toLowerCase().includes(needle)));
  }, [q, cat, terms]);
  const seen = Object.values(revealed).filter(Boolean).length;
  const hasAnalogy = terms.some((t) => t.analogy);

  return (
    <PageShell header={data.header} sources={data.sources} verified={data.verified} extraMeta={[{ dt: 'Terms', dd: String(terms.length) }, { dt: 'Showing', dd: String(items.length) }]}>
      <Section n={1} title="Find a term">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <label htmlFor="glossary-search" className="label mb-1.5 block">
              Search
            </label>
            <div className="flex items-center gap-2 border border-rule bg-surface px-2">
              <Search size={15} className="text-subtle" />
              <input id="glossary-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={data.placeholder ?? 'Search terms'} className="w-full bg-transparent py-1.5 text-[14px] text-ink outline-none" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[460px]">
            {hasAnalogy && <Toggle label={analogyLabel} checked={analogy} onChange={setAnalogy} hint="Show the comparison" />}
            <Toggle
              label="Test yourself"
              checked={quiz}
              onChange={(v) => {
                setQuiz(v);
                setRevealed({});
              }}
              hint="Hide definitions until you click"
            />
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <Segmented size="sm" value={cat} onChange={setCat} options={cats.map((c) => ({ value: c, label: c }))} />
        </div>
        {quiz && (
          <div className="mt-4">
            <Insight title="Test yourself" stateKey={String(seen)}>
              <p>
                Say the definition out loud, then click the card to check. Revealed {seen} of {items.length}.
              </p>
            </Insight>
          </div>
        )}
        <ul className="mt-6 grid gap-px border border-rule bg-rule md:grid-cols-2">
          {items.map((g) => {
            const hidden = quiz && !revealed[g.term];
            return (
              <li key={g.term} className="bg-paper">
                <div className="flex h-full flex-col gap-2 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-[21px] font-semibold leading-[1.15] text-ink">{g.term}</h3>
                    <Pill>{g.cat}</Pill>
                  </div>
                  {hidden ? (
                    <button
                      type="button"
                      onClick={() => setRevealed((r) => ({ ...r, [g.term]: true }))}
                      className="mt-1 inline-flex items-center gap-2 self-start border border-dashed border-rule px-3 py-2 text-[13px] text-muted hover:border-navy hover:text-navy"
                    >
                      <Eye size={14} /> Reveal definition
                    </button>
                  ) : (
                    <>
                      <p className="fade-in text-[14.5px] leading-[1.6] text-ink">{g.what}</p>
                      {analogy && g.analogy && <p className="text-[13.5px] italic leading-[1.5] text-muted">{g.analogy}</p>}
                    </>
                  )}
                  {g.page && pageById[g.page] && (
                    <a href={`#${g.page}`} className="mt-auto inline-flex items-center gap-1 pt-1 text-[13px] text-navy hover:underline">
                      Explore: {pageById[g.page].title} <ArrowRight size={12} />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
          {items.length % 2 === 1 && <li className="hidden bg-paper md:block" aria-hidden="true" />}
        </ul>
        {items.length === 0 && <p className="mt-6 text-[14px] text-muted">No terms match “{q}”. Try a shorter word.</p>}
      </Section>
    </PageShell>
  );
}
