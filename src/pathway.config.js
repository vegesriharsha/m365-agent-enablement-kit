// Site-wide settings. Every fact on the site is checked against the sources in src/content/sources.js.
export default {
  siteName: 'Agents in Microsoft 365',
  edition: 'Contoso Bank · learning edition',
  rev: '2026.11',
  // Keep the example organisation fictional on any public site.
  orgDisclaimer: 'Contoso Bank is fictional. Nothing here describes a real organisation’s environment, licences or people.',
  footer: 'Facts verified against Microsoft documentation on the dates shown on each page. Prices are US list prices.',
  // Prefix for anything kept in the viewer's browser (ticks, progress).
  storagePrefix: 'm365a',
  home: {
    eyebrow: 'Pathway · Agents in Microsoft 365 Copilot',
    title: 'Enable agents wave by wave, each wave gated by its standards',
    deck: 'Agent Builder, Copilot Studio, Fabric data agents and Copilot Cowork, governed with Microsoft Agent 365: what each one is, whose identity it runs as, what it costs, and the order to open them in.',
    meta: [
      { dt: 'Audience', dd: 'Platform, risk, makers, executives' },
      { dt: 'Example org', dd: 'Contoso Bank (fictional)' },
    ],
    intro: [
      'Contoso Bank turned Microsoft 365 Copilot on with agents disabled. It is moving from Microsoft 365 E5 to E7 and is piloting Microsoft Agent 365 with 25 licences. The question is not whether to allow agents but in which order, and which standards each step needs first.',
      'Start with the adoption journey if you are planning the rollout, the sequencer if you own the standards, or the glossary if agent types are new to you. Every page shows the sources it rests on and the date they were checked.',
    ],
    about: {
      title: 'About Contoso Bank',
      body: 'Contoso Bank is a fictional small regional lender used in every example: about 350 Microsoft 365 users, about 20 IT staff, a small platform team, a regulator that expects change control, and 25 Agent 365 pilot licences. Names and numbers are invented.',
    },
    sources: ['agent365Overview', 'compareE3E5E7'],
  },
};
