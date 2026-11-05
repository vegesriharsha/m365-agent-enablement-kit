# Prompt: evaluation plan for AI capabilities

For agents, assistants or any capability whose output varies: decide how quality and safety are measured before
people rely on it.

---

Write an evaluation plan for **[AI CAPABILITY, e.g. a knowledge agent over policy documents]**.

1. **What good looks like.** Three to six quality dimensions (for example groundedness, correctness, completeness,
   refusal when out of scope, tone) with a definition and a pass threshold for each.
2. **Test sets.** How to build them: real questions (with consent), edge cases, adversarial prompts, and questions
   whose answer must be "I don't know". Size and refresh cadence.
3. **Method.** Human review, automated checks and model-graded checks: which for which dimension, and how graders
   are calibrated. Name the tools available in this platform today, with GA or preview status.
4. **Gates.** Which scores block release, which trigger review, and how often evaluations re-run after go-live or
   after the vendor changes a model.
5. **Evidence.** What is kept, where, for how long, mapped to the observability standard.

Output: `notes/evaluation-plan.md`, and a proposal for an eval-gate step in the lifecycle flow.
