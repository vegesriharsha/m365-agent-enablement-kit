import { Illustrative } from '../components/ui.jsx';
import Hierarchy from './Hierarchy.jsx';
import Boundary from './Boundary.jsx';
import Stack from './Stack.jsx';

// One renderer per shape; a spec in src/content/diagrams.js names the shape it needs.
const renderers = { hierarchy: Hierarchy, boundary: Boundary, stack: Stack };

/** A glossary diagram: its one-sentence insight, the drawing, and a caption for anything too long to label. */
export default function GlossaryDiagram({ spec }) {
  const Renderer = renderers[spec.shape];
  if (!Renderer) return null;
  return (
    <figure className="min-w-0">
      <figcaption className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[14.5px] font-semibold leading-[1.4] text-ink">{spec.title}</span>
        {spec.illustrative && <Illustrative>{spec.illustrative}</Illustrative>}
      </figcaption>
      <Renderer spec={spec} />
      {spec.caption && <p className="mt-2 text-[12.5px] leading-[1.5] text-subtle">{spec.caption}</p>}
    </figure>
  );
}
