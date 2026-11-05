# Prompt: threat model and control mapping

Use after `06-how-it-works.md`. It turns the architecture into the risks a regulated organisation has to answer for,
and the controls and evidence that answer them.

---

Build a threat model and control map for **[TECHNOLOGY / CAPABILITY]**, using `notes/how-it-works.md`.

1. **Threats.** Walk each trust boundary with STRIDE. For AI or agent capabilities, also use the current OWASP lists
   for LLM and agentic applications (cite the version). Include misuse by insiders and by well-meaning makers,
   oversharing through existing permissions, prompt injection through content, and runaway cost.
2. **Controls.** For each threat, the vendor controls that exist today (with GA or preview status and licence), the
   process controls we'd add, and the residual risk. Never count a preview control as a mitigation.
3. **Mapping.** Map every control to a standards domain (scope, governance, identity, ownership, observability) and
   to the wave that needs it. Map to the frameworks I name: **[e.g. NIST AI RMF functions, SOX ITGC areas]**, citing
   the framework text you used.
4. **Evidence.** For each control, the evidence an auditor would ask for, where it is produced and how long it must
   be kept.

Output: `notes/threats-and-controls.md` with a table of threat, control, status, domain, wave, evidence and residual
risk. Then propose which threats deserve a failure scenario in the lifecycle flow or a custom simulator.
