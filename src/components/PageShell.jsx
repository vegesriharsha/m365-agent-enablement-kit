import { PageHeader, Sources } from './ui.jsx';
import { VERIFIED, src } from '../content/sources.js';

/**
 * Header, body and sources for any page. `header.meta` items are shown as given;
 * a "Last verified" item is added from the page's `verified` or the site default.
 */
export default function PageShell({ header, sources = [], verified, extraMeta = [], children }) {
  const when = verified ?? VERIFIED;
  const meta = [...(header.meta ?? []), ...extraMeta].slice(0, 3);
  return (
    <article>
      <PageHeader eyebrow={header.eyebrow} title={header.title} deck={header.deck} meta={[...meta, { dt: 'Last verified', dd: when }]} />
      {children}
      {sources.length > 0 && (
        <Sources
          verified={when}
          items={sources.map((k) => {
            if (!src[k]) throw new Error(`Unknown source key "${k}". Add it to src/content/sources.js.`);
            return src[k];
          })}
        />
      )}
    </article>
  );
}
