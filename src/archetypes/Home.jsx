import { ArrowRight } from 'lucide-react';
import { Section, Prose, Callout, Pill } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import config from '../pathway.config.js';
import { groups } from '../content/registry.js';

export default function Home() {
  const h = config.home;
  const count = groups.reduce((n, g) => n + g.pages.filter((p) => p.id !== 'home').length, 0);
  return (
    <PageShell header={{ ...h, meta: [...h.meta.slice(0, 2), { dt: 'Pages', dd: `${count} interactive pages` }] }} sources={h.sources}>
      <Section n={1} title="How to use this site" wide={false}>
        <Prose>
          {h.intro.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Prose>
        {h.about && (
          <div className="mt-6">
            <Callout title={h.about.title}>{h.about.body}</Callout>
          </div>
        )}
      </Section>

      {groups.map((g, gi) => {
        const pages = g.pages.filter((p) => p.id !== 'home');
        if (!pages.length) return null;
        return (
          <Section key={g.name} n={gi + 2} title={g.name}>
            <ul className="grid gap-px border border-rule bg-rule sm:grid-cols-2">
              {pages.map((p) => (
                <li key={p.id} className="bg-paper">
                  <a href={`#${p.id}`} className="group flex h-full flex-col gap-2 p-5 transition-colors hover:bg-surface">
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-display text-[22px] font-semibold leading-[1.1] tracking-[-0.015em] text-ink">{p.title}</span>
                      <ArrowRight size={16} className="shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-navy" />
                    </span>
                    <Pill tone="navy" className="self-start">
                      {p.kind}
                    </Pill>
                    <span className="text-[14px] leading-[1.55] text-muted">{p.blurb}</span>
                  </a>
                </li>
              ))}
              {pages.length % 2 === 1 && <li className="hidden bg-paper sm:block" aria-hidden="true" />}
            </ul>
          </Section>
        );
      })}
    </PageShell>
  );
}
