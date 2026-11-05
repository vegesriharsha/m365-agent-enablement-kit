# Prompt: independent fact-check

Give this to a reviewer that did not build the pages (a separate session or a sub-agent). Today's date matters: say it.

---

You're fact-checking a public learning site before it's published. Today is **[DATE]**. Don't edit files; report only.

The site source is in this repo: pages in `src/archetypes/` and `src/pages/`, content in `src/content/*.js`, sources in
`src/content/sources.js`, the publishing workflow in `.github/workflows/deploy.yml`.

Check every claim that describes a product today against current primary sources (vendor docs, release notes, the
product's own repos, licensing pages): names, GA or preview status, licences, limits, prices, defaults, setting and
parameter names, error messages, dates, and versions. Also check every URL in `sources.js` loads the page its title
describes, and that anything invented is labelled illustrative.

If a page is blocked to you, search for its title and fetch a result link (locale variants often work). If you truly
can't reach a source, say "unverifiable" rather than guessing.

Report, under 900 words:

1. Problems: file and exact text, verdict (wrong / outdated / unverifiable / imprecise), the correct fact with its
   source URL, and replacement wording.
2. Broken or mismatched source links.
3. A one-line "confirmed" list.
