# Prompt: options and decision records

Use for each decision the strategy depends on (which builder, which registry, which hosting, which licence).

---

For the decision **[DECISION]**, produce an options analysis and an architecture decision record.

1. **Options.** At least three real options, always including "do nothing for now". For each: what it is, what it
   costs, what it needs, what it rules out later. Sources for every product fact.
2. **Criteria.** Five to eight criteria with weights I confirm before scoring: for example risk, control and
   evidence, cost, skills, time to value, lock-in, fit with our shared layers.
3. **Scoring.** Score with a reason per cell. Show how the winner changes if the top two weights swap.
4. **Reversibility.** How hard each option is to undo, and what we'd watch to know we chose wrong.
5. **ADR.** Context, decision, status, consequences (good and bad), alternatives considered, review date.

Output: `notes/adr-[short-name].md`. If the decision helps others, propose a decision page for the site with the same
options and reasons.
