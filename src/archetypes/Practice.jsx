import { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Lightbulb, RotateCcw } from 'lucide-react';
import { Section, Insight, Button, Pill } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import { useLocalState } from '../lib/hooks.js';
import config from '../pathway.config.js';

const norm = (s) => s.trim().replace(/\s+/g, ' ');

/**
 * Command-typed levels: read a short lesson, type the command, get breadcrumb
 * hints one at a time instead of the answer. Progress stays in this browser.
 * Each level's `accept` is a list of regular expressions matched against the
 * whole normalised command.
 */
export default function Practice({ page, data }) {
  const { levels, prompt = '$' } = data;
  const [state, setState] = useLocalState(`${config.storagePrefix}.${page.id}.v1`, { level: 0, solved: {} });
  const [input, setInput] = useState('');
  const [hints, setHints] = useState(0);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  const i = Math.min(state.level, levels.length - 1);
  const L = levels.at(i);
  const solved = !!state.solved[L.id];
  const solvedCount = levels.filter((l) => state.solved[l.id]).length;

  useEffect(() => {
    setInput('');
    setHints(0);
    setResult(null);
  }, [i]);

  const check = (e) => {
    e.preventDefault();
    const cmd = norm(input);
    if (!cmd) return;
    const ok = L.accept.some((re) => new RegExp(`^(?:${re})$`, L.flags ?? '').test(cmd));
    setResult({ ok, cmd, note: ok ? null : (L.near ?? []).find((n) => new RegExp(n.match, L.flags ?? '').test(cmd))?.say });
    if (ok) setState((s) => ({ ...s, solved: { ...s.solved, [L.id]: true } }));
  };
  const go = (n) => setState((s) => ({ ...s, level: Math.max(0, Math.min(levels.length - 1, n)) }));

  return (
    <PageShell header={data.header} sources={data.sources} verified={data.verified} extraMeta={[{ dt: 'Levels', dd: String(levels.length) }, { dt: 'Solved', dd: `${solvedCount} of ${levels.length}` }]}>
      <Section n={1} title={data.sectionTitle ?? 'Practice'} intro={data.intro ?? 'Type the command, press Enter. Stuck? Take one hint at a time.'} wide={false}>
        <ol className="flex flex-wrap gap-1.5" aria-label="Levels">
          {levels.map((l, n) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => go(n)}
                aria-current={n === i ? 'step' : undefined}
                aria-label={`Level ${n + 1}: ${l.title}${state.solved[l.id] ? ', solved' : ''}`}
                className={`flex h-9 w-9 items-center justify-center border font-mono text-[12.5px] ${
                  n === i ? 'border-navy bg-navy text-on-navy' : state.solved[l.id] ? 'border-navy bg-navy-soft text-navy' : 'border-rule text-muted'
                }`}
              >
                {state.solved[l.id] && n !== i ? <Check size={14} /> : n + 1}
              </button>
            </li>
          ))}
        </ol>

        <div className="fade-in mt-5 border border-rule bg-surface p-5" key={L.id}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12px] text-navy">LEVEL {i + 1}</span>
            {solved && <Pill tone="good">Solved</Pill>}
          </div>
          <h3 className="mt-2 font-display text-[28px] font-semibold leading-[1.1] text-ink">{L.title}</h3>
          <p className="mt-3 text-[15px] leading-[1.65] text-ink">{L.lesson}</p>
          <p className="label mt-5">Your task</p>
          <p className="mt-1 text-[15px] font-medium text-ink">{L.task}</p>

          <form onSubmit={check} className="mt-4">
            <label htmlFor={`cmd-${L.id}`} className="sr-only">
              Command
            </label>
            <div className="flex items-center gap-2 border border-ink bg-[var(--ink)] px-3 py-2.5 font-mono text-[15px] text-[var(--paper)]">
              <span aria-hidden="true" className="opacity-70">
                {prompt}
              </span>
              <input
                ref={inputRef}
                id={`cmd-${L.id}`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                enterKeyHint="go"
                className="min-w-0 flex-1 bg-transparent text-[16px] outline-none"
                placeholder="type here"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="submit">Run</Button>
              <Button variant="secondary" onClick={() => setHints((h) => Math.min(L.hints.length, h + 1))} disabled={hints >= L.hints.length}>
                <Lightbulb size={14} /> Hint {hints < L.hints.length ? `${hints + 1} of ${L.hints.length}` : '(none left)'}
              </Button>
            </div>
          </form>

          {hints > 0 && (
            <ol className="mt-4 space-y-1.5 border-l-2 border-gold pl-4">
              {L.hints.slice(0, hints).map((h, n) => (
                <li key={h} className="fade-in text-[14px] leading-[1.5] text-ink">
                  <span className="mr-2 font-mono text-[11.5px] text-gold">{n + 1}</span>
                  {h}
                </li>
              ))}
            </ol>
          )}

          {result && (
            <div className="mt-4">
              <Insight tone={result.ok ? 'good' : 'bad'} stateKey={`${result.cmd}-${result.ok}`} title={result.ok ? 'That works' : 'Not quite'}>
                {result.ok ? <p>{L.explain}</p> : <p>{result.note ?? 'That command wouldn’t do it. Read the task again, or take a hint.'}</p>}
              </Insight>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="quiet" onClick={() => go(i - 1)} disabled={i === 0}>
              Previous
            </Button>
            <Button variant={solved ? 'primary' : 'quiet'} onClick={() => go(i + 1)} disabled={i === levels.length - 1}>
              Next level <ChevronRight size={14} />
            </Button>
            <Button variant="quiet" onClick={() => setState({ level: 0, solved: {} })}>
              <RotateCcw size={14} /> Start over
            </Button>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
