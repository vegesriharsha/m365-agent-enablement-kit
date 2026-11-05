# Archetypes

Nine page types, each driven by one data file in `src/content/`. Every data file has:

```js
export default {
  header: { eyebrow: 'Kind · Topic', title: 'The point, as a sentence', deck: 'One or two sentences of framing.', meta: [{ dt, dd }] },
  sources: ['sourceKey'],   // keys from src/content/sources.js
  verified: '4 Nov 2026',   // optional; defaults to VERIFIED in sources.js
  // ...archetype fields below
};
```

`header.meta` takes up to two items; the archetype adds its own counts and the verified date.

| Archetype | Use it when the idea is… | The reader… |
| --- | --- | --- |
| `journey` | Phases with exit gates | Ticks criteria; sees which gate is open |
| `glossary` | Vocabulary | Searches, filters, tests themselves |
| `explorer` | 3–10 parts of a whole | Selects a part to see what it decides |
| `sequencer` | Capabilities released in waves, gated by standards | Ticks standards; watches gates and capabilities unlock |
| `decision` | A choice between options | Answers questions; options re-rank with reasons |
| `flow` | A process across roles that can fail | Picks a scenario; a token runs and stops at the failure |
| `practice` | A skill to drill (commands, queries, syntax) | Types answers; takes hints one at a time |
| `register` | Many items with status and review dates | Filters; moves the date to see what falls due |
| custom | Rules no archetype can show | Changes inputs in your own simulator |

## journey

```js
phases: [{
  id: 'plan', name: 'Plan', sub: 'Decide and design', team: 'Who does it',
  what: 'What happens in this phase.',
  gate: 'The exit gate, as a sentence',
  criteria: ['Tickable criterion', '...'],
  explore: ['page-id'],          // optional links
}],
sectionTitle: 'The roadmap',      // optional
```

## glossary

```js
analogyLabel: 'Kitchen analogy',  // optional; toggle shows `analogy`
placeholder: 'Try …',
terms: [{ cat: 'Category', term: 'Term', what: 'Plain definition.', analogy: 'Optional comparison.', page: 'page-id' }],
```

## explorer

```js
center: ['Two', 'lines'],         // words in the middle of the wheel
groups: ['Decide', 'Control'],    // optional highlight groups
labels: { list: 'Its standards define', callout: 'Minimum to start' },
intro: 'Section intro.',
items: [{ name, short /* ≤ 14 chars */, group, tag, summary, points: ['…'], callout: '…', explore: ['page-id'] }],
```

## sequencer

Standards are cumulative: a wave needs every standard whose `wave` is less than or equal to its own.

```js
domains: [{ id: 'gov', name: 'Governance', short: 'Governance' }],     // usually 4–6
waves: [{ id: 0, name: 'Foundations', window: 'Q1 2027', goal: 'One sentence.' }],  // ids 0..n in order
standards: [{ id: 'gv1', domain: 'gov', wave: 1, name: 'Intake form and triage rule', detail: 'Optional tooltip.' }],
capabilities: [{ id: 'c1', wave: 1, risk: 'Low' | 'Medium' | 'High', name, platform, value }],
intro: 'Optional section intro.',
```

## decision

```js
options: [{ id: 'a', name: 'Option A', blurb: 'One line.' }],
questions: [{
  id: 'scale', q: 'The question?', default: 'few',
  answers: { few: { label: 'A handful', s: { a: [2, 'Reason shown under option a'], b: [-1, 'Reason against b'] } } },
}],
verdicts: { a: 'What to do if A wins.' },
maxScore: 9,                      // bar scale; default 3 × questions
```

## flow

```js
lanes: [{ id: 'maker', name: 'Maker' }],          // 2–5 lanes
steps: [{ lane: 'maker', label: 'Request', log: 'Log line when reached', gate: true /* diamond */, stack: true /* same column as previous */ }],
scenarios: {
  ok: { label: 'Normal', fail: null, text: 'Optional explanation' },
  broken: { label: 'Owner missing', fail: 1 /* step index */, log: 'Error line', why: 'What went wrong', fix: 'What prevents it' },
},
okText: 'Explanation for a successful run.',
```

## practice

```js
prompt: '$',
levels: [{
  id: 'install', title: 'Short title', lesson: 'Two or three sentences of teaching.',
  task: 'What to type, as a task.',
  accept: ['npm ci'],                          // regex sources, matched against the whole command (spaces collapsed)
  flags: 'i',                                  // optional regex flags
  near: [{ match: '^npm install$', say: 'Targeted nudge for a common wrong answer.' }],
  hints: ['Vague', 'Warmer', 'Almost the answer'],
  explain: 'Why the answer works.',
}],
```

## register

```js
cadence: { Adopt: 180, Hold: 90, Watch: 30, Decide: 30, Retiring: 30 },   // days between reviews
statusInfo: { Adopt: 'One line per status' /* … */ },
register: [{ name, cat, status: 'Adopt', version, verified: '2026-11-04', note, src: 'sourceKey' }],
```

## custom

Copy `src/pages/RiskTier.jsx`. Keep `PageShell` (header + sources), put controls above results, explain the current
state in an `Insight`, label invented weights or numbers with `Illustrative`, and register it in `registry.js` with
`component: YourPage`.
