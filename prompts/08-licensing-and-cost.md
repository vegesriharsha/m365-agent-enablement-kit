# Prompt: licensing and cost model

---

Build the licensing and cost picture for **[TECHNOLOGY]**, for an organisation currently on **[CURRENT LICENCES]**
and considering **[ALTERNATIVES OR UPGRADES]**.

1. **What's in which licence.** For every capability in `PATHWAY_SPEC.md`: the licences or add-ons that include it,
   anything billed by usage, and anything that needs a separate SKU. Source each row from the vendor's licensing
   pages or service descriptions, with the date.
2. **Usage-based charges.** How each one is metered, what controls exist (spend limits, budgets, caps) and at which
   scope (tenant, group, user).
3. **Scenarios.** Three adoption scenarios (cautious, expected, broad) with users, usage assumptions and monthly
   cost. List prices only, labelled as such; state every assumption.
4. **Upgrade question.** What changes, capability by capability, between the current licence and each alternative,
   and which waves of the roadmap each change unlocks.

Output: `notes/licensing-and-cost.md`. Then propose a meter or decision page for the site, using
`docs/visual-patterns.md` (pattern 13 or 10), with every number labelled list price or illustrative.
