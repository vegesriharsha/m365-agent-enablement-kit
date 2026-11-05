# Prompt: how it really works (reference architecture)

Use first, before any decisions: an architect can't judge controls or costs without knowing where identity, data
and execution actually flow.

---

Explain how **[TECHNOLOGY / CAPABILITY]** really works, from current vendor documentation only, for an architect who
will have to defend decisions about it.

1. **Planes.** Separate the control plane (admin, policy, configuration) from the data plane (prompts, content,
   actions at run time). Name the service behind each and where it runs.
2. **Identity and tokens.** For each capability: who signs in, what identity the work runs as (user, maker,
   service, agent identity), which tokens are issued, and what that identity can reach.
3. **Data paths.** Where content is read from, where it is processed and stored, for how long, in which region, and
   which subprocessors are involved. Mark anything that leaves the tenant.
4. **Trust boundaries and integration points.** Connectors, plugins, APIs, network paths, and what crosses each
   boundary.
5. **Defaults.** What is on by default, what is off, and who can change it.
6. **Surprises.** Ten things that commonly surprise architects about this technology, each with its source.

Output: write `notes/how-it-works.md` with a source on every claim and a list of what you couldn't verify. Then
propose up to three site pages from it (one drawn architecture, one token-on-a-path simulator, glossary terms) and
wait for my go-ahead before building them.
