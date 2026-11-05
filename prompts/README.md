# Prompts

For an architect learning, understanding, testing and setting strategy for a technology. Run them roughly in this
order; each writes its working output to `notes/` (git-ignored, so internal details stay out of a public repo), and
most end by proposing pages for the site.

| Stage | Prompt | Produces |
| --- | --- | --- |
| Set up | `01-new-pathway.md` | The spec, research, page plan and the built site |
| Learn | `06-how-it-works.md` | Planes, identities, data paths, trust boundaries, defaults, surprises |
| Learn | `05-visualize-a-concept.md` | An interactive visual for one hard idea |
| Learn | `02-add-custom-page.md` | A custom simulator page |
| Understand | `07-threats-and-controls.md` | Threat model, controls, framework mapping, evidence |
| Understand | `08-licensing-and-cost.md` | Licence matrix, usage charges, cost scenarios, upgrade comparison |
| Understand | `09-current-state.md` | Inventory method, scenarios, fit-gap by domain |
| Test | `10-prove-it.md` | Hypotheses and sandbox tests for open questions and vendor claims |
| Test | `11-evaluation-plan.md` | Quality and safety evaluation for AI capabilities |
| Decide | `12-options-and-decisions.md` | Options analysis and an ADR per key decision |
| Decide | `13-strategy-brief.md` | The strategy for the review board |
| Challenge | `14-pre-mortem.md` | An independent pre-mortem of the strategy |
| Challenge | `03-fact-check.md` | An independent fact-check of the site |
| Share | `15-stakeholder-briefs.md` | Briefs, FAQ and a training plan per audience |
| Keep current | `04-refresh.md` | Monthly review of due register entries and vendor changes |

Run `03` and `14` in a separate session or sub-agent, so the reviewer hasn't seen the work being made.

In a private, internal repo you can remove `notes/` from `.gitignore` to keep the notes' history; in a public repo,
leave it ignored.
