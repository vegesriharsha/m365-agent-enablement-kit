import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { PageHeader, Section, Insight, Slider, Toggle, Button, Pill, Sources, Callout, Illustrative } from '../components/ui.jsx';
import { useProgress } from '../lib/hooks.js';
import { VERIFIED, src } from '../data/sources.js';

/**
 * Queue wait grows with load: a single queue at utilisation u waits roughly
 * u / (1 - u) service times. Good enough to show the shape, not to plan staff.
 */
function queueWait(serviceDays, requests, team) {
  const capacity = team * 6; // requests a month the team can handle per queue
  const u = Math.min(0.95, requests / capacity);
  return serviceDays * (u / (1 - u));
}

function ticketSteps(requests, team) {
  return [
    { name: 'Raise tickets', work: 0.5, wait: 0 },
    { name: 'Network queue', work: 1, wait: queueWait(1, requests, team) + 1 },
    { name: 'Subscription request', work: 0.5, wait: 2 },
    { name: 'Manual build', work: 3, wait: queueWait(3, requests, team) },
    { name: 'Security review', work: 1, wait: queueWait(1, requests, team) + 3 },
    { name: 'Fix findings', work: 2, wait: 1 },
    { name: 'Handover', work: 0.5, wait: 0.5 },
  ];
}

function pavedSteps(exception) {
  return [
    { name: 'Open pull request from template', work: 0.3, wait: 0 },
    { name: 'Automated plan and policy checks', work: 0.05, wait: 0 },
    { name: 'Review and approve', work: 0.2, wait: 0.5 },
    { name: 'Vending apply', work: 0.05, wait: 0 },
    { name: 'Firewall rule from approved pattern', work: 0.2, wait: 0.5 },
    ...(exception ? [{ name: 'Exception review (one item)', work: 1, wait: 3 }] : []),
  ];
}

const total = (steps) => steps.reduce((a, s) => a + s.work + s.wait, 0);
const workOf = (steps) => steps.reduce((a, s) => a + s.work, 0);

function Lane({ title, steps, scale, elapsed, tone }) {
  let cursor = 0;
  const T = total(steps);
  const done = elapsed >= T;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="text-[14.5px] font-medium text-ink">{title}</p>
        <p className="tabular font-mono text-[13px] text-ink">
          {done ? `${T.toFixed(1)} days` : `day ${Math.min(elapsed, T).toFixed(1)}`}
          {done && <span className="ml-2"><Pill tone={tone}>Done</Pill></span>}
        </p>
      </div>
      <div className="relative h-[34px] w-full bg-faint">
        {steps.map((s) => {
          const start = cursor;
          cursor += s.wait + s.work;
          const waitEnd = start + s.wait;
          const visWait = Math.max(0, Math.min(elapsed, waitEnd) - start);
          const visWork = Math.max(0, Math.min(elapsed, cursor) - waitEnd);
          return (
            <div key={s.name} title={`${s.name}: ${s.wait.toFixed(1)} days waiting, ${s.work.toFixed(1)} days working`}>
              {visWait > 0 && (
                <div className="absolute top-0 h-full border-r border-paper bg-gold-soft" style={{ left: `${(start / scale) * 100}%`, width: `${(visWait / scale) * 100}%` }} />
              )}
              {visWork > 0 && (
                <div className="absolute top-0 h-full border-r-2 border-paper bg-navy" style={{ left: `${(waitEnd / scale) * 100}%`, width: `${(visWork / scale) * 100}%` }} />
              )}
            </div>
          );
        })}
      </div>
      <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {steps.map((s, i) => {
          const end = steps.slice(0, i + 1).reduce((a, x) => a + x.work + x.wait, 0);
          const reached = elapsed >= end;
          return (
            <li key={s.name} className={`text-[12px] ${reached ? 'text-ink' : 'text-subtle'}`}>
              <span className="tabular font-mono text-navy">{i + 1}</span> {s.name}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function PavedPaths() {
  const [requests, setRequests] = useState(8);
  const [team, setTeam] = useState(2);
  const [exception, setException] = useState(false);
  const [run, setRun] = useState(0);

  const ticket = useMemo(() => ticketSteps(requests, team), [requests, team]);
  const paved = useMemo(() => pavedSteps(exception), [exception]);
  const tT = total(ticket);
  const tP = total(paved);
  const scale = Math.max(tT, tP) * 1.02;
  const t = useProgress(`race-${run}-${requests}-${team}-${exception}`, 5200);
  const elapsed = t * scale;
  const waitShare = 1 - workOf(ticket) / tT;

  return (
    <article>
      <PageHeader
        eyebrow="Animated flow · Paved paths"
        title="Most of a ticket’s life is waiting"
        deck="Race the same request down two roads: a chain of tickets to different teams, and a paved path where the platform’s defaults are already approved."
        meta={[
          { dt: 'Ticket path', dd: `${tT.toFixed(0)} days` },
          { dt: 'Paved path', dd: `${tP.toFixed(1)} days` },
          { dt: 'Waiting', dd: `${Math.round(waitShare * 100)}% of ticket time` },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section n={1} title="Run the race" intro="A workload team needs a production landing zone with one firewall rule. Change the load on the platform team and watch the ticket path stretch.">
        <div className="mb-3">
          <Illustrative>Illustrative timings</Illustrative>
        </div>
        <div className="grid items-end gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Slider id="pp-req" label="Requests a month" min={2} max={16} value={requests} onChange={setRequests} />
          <Slider id="pp-team" label="Platform engineers" min={1} max={4} value={team} onChange={setTeam} />
          <Toggle label="Needs one exception" checked={exception} onChange={setException} hint="A public endpoint in an Internal landing zone" />
          <Button onClick={() => setRun((n) => n + 1)}>
            <Play size={14} /> Race again
          </Button>
        </div>

        <div className="mt-6 space-y-6 border border-rule bg-surface p-5">
          <Lane title="Ticket path" steps={ticket} scale={scale} elapsed={elapsed} tone="gold" />
          <Lane title="Paved path" steps={paved} scale={scale} elapsed={elapsed} tone="good" />
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-muted">
            <span className="inline-flex items-center gap-1.5"><span className="inline-block h-[10px] w-[10px] bg-gold-soft border border-gold" /> Waiting</span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-block h-[10px] w-[10px] bg-navy" /> Working</span>
          </div>
        </div>

        <div className="mt-4">
          <Insight stateKey={`${requests}-${team}-${exception}`} tone={tT > 30 ? 'bad' : 'navy'}>
            <p>
              The ticket path spends {Math.round(waitShare * 100)}% of its {tT.toFixed(0)} days waiting in queues; the actual work is about{' '}
              {workOf(ticket).toFixed(1)} days. {tT > 30 ? 'At this load the queues dominate: adding engineers helps a little, removing the queue helps a lot. ' : ''}
              {exception
                ? 'Even with an exception, only that one item waits for review; everything standard has already shipped.'
                : 'The paved path is fast because the decisions were made once, in code, and every request reuses them.'}
            </p>
          </Insight>
        </div>
      </Section>

      <Section n={2} title="What paves the path" intro="Each piece is on another page of this site. Together they turn approvals into defaults." wide={false}>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Subscription vending', 'A request is a pull request; the module does the rest.', 'vending'],
            ['Pipeline and identities', 'No secrets, split plan and apply, one human approval.', 'pipeline'],
            ['Policy guardrails', 'Checks run on every request, so reviews focus on exceptions.', 'policy-simulator'],
            ['Approved network patterns', 'Common firewall rules as reviewed templates, not tickets.', 'network-flow'],
            ['Naming and tagging', 'Generated, not typed, so nothing is rejected for a typo.', 'naming'],
            ['Observability defaults', 'Logs, alerts and budgets wired in at vending time.', 'observability'],
          ].map(([t, d, id]) => (
            <a key={t} href={`#${id}`} className="group border-t border-rule pt-3">
              <p className="text-[15px] font-semibold text-ink group-hover:text-navy">{t}</p>
              <p className="mt-1 text-[14px] leading-[1.55] text-muted">{d}</p>
            </a>
          ))}
        </div>
        <div className="mt-6">
          <Callout tone="gold" title="Choosing a self-service front end">
            A paved path can start as a repo template and a pull request; a portal can come later. If you’re evaluating Azure
            Deployment Environments, read Microsoft’s retirement guide first.
          </Callout>
        </div>
      </Section>

      <Sources verified={VERIFIED} items={[src.platformEng, src.idpTeam, src.subVending, src.adeRetire]} />
    </article>
  );
}
