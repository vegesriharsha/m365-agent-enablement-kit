import { Section, Pill } from '../components/ui.jsx';
import PageShell from '../components/PageShell.jsx';
import GlossaryDiagram from '../diagrams/GlossaryDiagram.jsx';
import diagrams from '../content/diagrams.js';

/*
 * Every glossary diagram on its own, so each can be read and checked in
 * isolation. `npm run diagrams` screenshots this page in each diagram's states.
 */
export default function DiagramGallery() {
  const list = Object.entries(diagrams);
  return (
    <PageShell
      header={{
        eyebrow: 'Gallery · Glossary diagrams',
        title: 'The glossary’s diagrams, one at a time',
        deck: 'Each diagram makes one idea visible that a sentence leaves abstract. They also appear beside their terms in the glossary.',
        meta: [{ dt: 'Diagrams', dd: String(list.length) }, { dt: 'Terms covered', dd: String(list.reduce((n, [, d]) => n + d.terms.length, 0)) }],
      }}
      sources={['entraAgentIdentitiesOverview', 'entraAgentOwnersSponsors', 'entraAgentIdGovernance', 'csEntraAgentIds', 'ppDlpConnectorClassification', 'csDataPolicies', 'ppAdvancedConnectorPolicies', 'agent365ServiceDescription', 'agent365LicensingFaq']}
    >
      {list.map(([id, spec], i) => (
        <Section key={id} n={i + 1} title={spec.terms.join(' · ')}>
          <div className="mb-3 flex flex-wrap gap-2">
            <Pill tone="neutral">{spec.shape}</Pill>
            <a href="#glossary" className="text-[13px] text-navy underline decoration-rule underline-offset-4 hover:decoration-navy">
              See the terms in the glossary
            </a>
          </div>
          <GlossaryDiagram spec={spec} />
        </Section>
      ))}
    </PageShell>
  );
}
