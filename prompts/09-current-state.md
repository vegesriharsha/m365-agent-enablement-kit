# Prompt: current state and gaps

This is the "review current practices and gaps" half of scope confirmation.

---

Assess the current state of **[TECHNOLOGY]** against the standards domains in `PATHWAY_SPEC.md`.

1. **Inventory method.** Tell me how to inventory what already exists: admin centre reports, PowerShell or CLI
   commands, APIs, audit-log queries. Give me the exact commands with their sources, read-only, and what each
   returns. I'll run them and paste the results; don't assume results.
2. **Scenarios.** For three to five realistic scenarios I describe or you propose (labelled as such), walk through
   what happens today in each domain: who requests, who approves, what identity it runs as, who owns it, what
   evidence remains.
3. **Fit-gap.** A table per domain: what the standard will require, what exists today, the gap, and the wave that
   needs the gap closed.
4. **Quick wins and blockers.** Gaps that are cheap to close now, and gaps that block wave 1.

Output: `notes/current-state.md`. Keep real names, systems and results out of any public repo; summarise them as
patterns if they inform the site.
