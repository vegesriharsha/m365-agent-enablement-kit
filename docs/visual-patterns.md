# Visual patterns

Fifteen ways to make a concept move, each proven on Landing Zone Explorer or in this kit. Pick the pattern from the
**shape of the concept**, not from the look you want. Reference code for the explorer pages is in
`examples/landing-zone-explorer/pages/` (read-only: it imports paths that only exist in that repo).

| # | Pattern | Use it when the concept is… | The reader… | What they should notice | Reference |
| --- | --- | --- | --- | --- | --- |
| 1 | **Token on a path** | Something travels through components and can be stopped or diverted | Picks a route and settings, sends it | Where it goes, where it's inspected, where it stops | `NetworkFlow.jsx` |
| 2 | **Swim lanes with failure scenarios** | A process handed between roles or systems | Picks a scenario, watches a run, reads the log | The exact step and error where it breaks, and the fix | `Pipeline.jsx`, `archetypes/Flow.jsx` |
| 3 | **Inheritance tree** | Settings or rules that flow down a hierarchy | Assigns rules to nodes, moves a child | What a child gains and loses when it moves | `PolicySimulator.jsx` |
| 4 | **Ordered evaluation** | Several rules applied in a fixed order | Triggers a request, steps through the checks | Which rule wins and why the order matters | `PolicySimulator.jsx` (steps) |
| 5 | **Sort into buckets + stress tests** | Grouping decisions with consequences | Places items, then runs what-ifs | Which grouping survives deletes, access grants, locks | `ResourceGroups.jsx` |
| 6 | **Anatomy** | An identifier, name, token or message made of parts | Edits the parts | Which part breaks a rule, and how close it is to a limit | `Naming.jsx` |
| 7 | **Concurrency timeline** | Two things happening at once (locks, races, queues) | Switches the mechanism, replays | Who waits, who fails, who silently overwrites | `StateBackends.jsx` |
| 8 | **Version history and recovery** | Change over time that can be undone or not | Breaks the latest version, tries to restore | What you can get back, and what you can't | `StateBackends.jsx` (section 2) |
| 9 | **Layer stack with a ripple** | A stack of dependencies where change travels | Selects a layer, traces an update | Who owns each layer, and where a change waits for you | `BuildOptions.jsx` (section 2) |
| 10 | **Re-ranking options** | A choice that depends on circumstances | Answers questions | How the best option changes, and the reasons | `BuildOptions.jsx`, `archetypes/Decision.jsx` |
| 11 | **Gated waves** | Capabilities released as their prerequisites are met | Ticks prerequisites | What each gate needs and what it unlocks | `archetypes/Sequencer.jsx` |
| 12 | **Stepper with component states** | A migration or transformation in stages | Steps forward and back, flips choices | How each part's state changes, and the risk of each choice | `Brownfield.jsx` |
| 13 | **Meter against a limit** | Consumption against a budget, quota or capacity | Switches items on and off, sets durations | When the limit is hit, and which item causes it | `LabCost.jsx` |
| 14 | **Race between two lanes** | Two ways of doing the same job | Changes load, replays | Where the time goes (waiting versus working) | `PavedPaths.jsx` |
| 15 | **Scrubbable dashboard** | A rollout or trend with decisions along it | Moves through time, acts at a point | The consequence of acting early versus late | `Guardrails.jsx` |

Also useful: a **cost mix with consequences** (`Observability.jsx`: cheaper choices that cost a capability), a
**form that generates artefacts** (`Vending.jsx`: inputs become names, steps and code), and a **hierarchy explorer**
(`Billing.jsx`: who owns each level, what works at each).

## What every one of them does

- **One concept per visual.** If you need “and”, it's two visuals.
- **Controls above the picture, explanation beside or below it.** At most four controls; defaults show the
  interesting case, not the empty one.
- **An Insight panel that changes with state.** Write the state → explanation table before the code. The picture
  shows *what*; the Insight says *why*, in one or two sentences.
- **A failure or edge state on purpose.** The fastest learning comes from breaking it: a blocked packet, a refused
  token, an overwritten file. Every visual has at least one.
- **Real rules, labelled inventions.** The mechanism follows the product's documented behaviour, with the source
  on the page. Invented numbers, names and weights carry the `Illustrative` label.
- **Motion that means something.** Animate the thing that moves in reality (a request, a token, time), once per
  action, through `useProgress` so reduced-motion users get the end state.
- **Readable at phone width.** Wide SVGs scroll inside their own box; text in SVG is at least 11px after scaling.
