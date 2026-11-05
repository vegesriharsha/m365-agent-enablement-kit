# Prompt: prove it (tests for claims and open questions)

Use when the research leaves questions only a test can answer, or when a decision rests on a vendor claim.

---

Turn the open questions and key claims for **[TECHNOLOGY]** into tests I can run in a sandbox.

1. **Collect.** List every open question from `notes/` and every claim a decision depends on (for example, “this
   control applies to that capability”, “this setting blocks sharing”).
2. **Hypotheses.** Rewrite each as a falsifiable statement with the decision it affects.
3. **Test design.** For each: preconditions, licence needed, exact steps, expected result if true, expected result
   if false, the evidence to capture (screenshots, log entries, exported settings), and the cost. Use a sandbox
   tenant or subscription with a spending cap; nothing touches production.
4. **Order.** Sort by how much each result changes the roadmap, then by cost.
5. **Results.** Give me a results template: hypothesis, date, outcome, evidence location, what changes.

Output: `notes/test-plan.md`. After I report results, update the register, the affected pages and the verified dates,
and record what changed in the change log.
