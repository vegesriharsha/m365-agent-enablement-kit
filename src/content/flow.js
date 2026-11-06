// Archetype: flow. Steps advance one column unless `stack: true`; `gate: true` draws a diamond.
// Steps map to real product features; log lines are illustrative.
export default {
  header: {
    eyebrow: 'Flow · Agent lifecycle',
    title: 'One agent, from request to retirement, through the real product steps',
    deck: 'Follow a Copilot Studio agent through intake, review, registration, publishing, monitoring and re-attestation. Then break it the ways it breaks in practice.',
  },
  sources: ['agent365Requests', 'agent365Actions', 'entraAgentOwnersSponsors', 'csEntraAgentIds', 'csDataPolicies', 'csToolAuthentication', 'entraAgentIdGovernance', 'purviewAuditCopilot', 'entraAgentIdBestPractices'],
  okText: 'Each standard shows up as a step: intake and triage, risk review and approval, registration with a sponsor and an Entra Agent ID, admin approval in Agent Requests, Purview audit while it runs, re-attestation through access-package expiry, and a clean retirement with a 30-day restore window.',
  lanes: [
    { id: 'maker', name: 'Maker' },
    { id: 'platform', name: 'Platform team' },
    { id: 'risk', name: 'Risk and approvers' },
    { id: 'prod', name: 'Registry and audit' },
  ],
  steps: [
    { lane: 'maker', label: 'Request', log: 'Intake submitted: purpose, knowledge sources, users, sponsor, owners' },
    { lane: 'platform', label: 'Triage', log: 'Triaged as Medium: shared with a team, reads a confidential SharePoint site, no tools' },
    { lane: 'risk', label: 'Risk review', log: 'Risk review complete: user authentication required for the SharePoint knowledge' },
    { lane: 'risk', label: 'Approve', gate: true, log: 'Approved by the business owner and the platform lead' },
    { lane: 'platform', label: 'Register', log: 'Entra Agent ID created with the agent; sponsor set; registry metadata completed' },
    { lane: 'prod', label: 'Publish', log: 'Submitted for the organisation; approved in Agent Requests with a policy template' },
    { lane: 'prod', label: 'Monitor', log: 'Purview audit shows CopilotInteraction records; weekly measures reviewed' },
    { lane: 'platform', label: 'Re-attest', gate: true, log: 'Access package renewed: sponsor confirmed the agent still needs its permissions' },
    { lane: 'platform', label: 'Retire', log: 'Blocked, then deleted: 30-day restore window; evidence kept to the schedule' },
  ],
  scenarios: {
    ok: { label: 'Normal lifecycle', fail: null },
    sponsor: {
      label: 'No sponsor named',
      fail: 1,
      log: 'Triage stopped: no sponsor on the intake',
      why: 'Every agent identity needs a sponsor, and Agent 365 protections apply only when the sponsor or owner is licensed. Without one the agent cannot be rated or protected.',
      fix: 'The identity standard makes a licensed sponsor a required intake field. If the sponsor leaves, Entra moves sponsorship to their manager.',
    },
    policy: {
      label: 'Data policy blocks publish',
      fail: 5,
      log: 'Publish disabled: HTTP connector is in the Blocked group of the tenant data policy',
      why: 'Copilot Studio enforces Power Platform data policies in real time and disables the Publish button when an agent uses a blocked connector.',
      fix: 'Redesign without the blocked connector, or request an exception with a compensating control through the exception procedure.',
    },
    drift: {
      label: 'Changed after approval',
      fail: 6,
      log: 'Monitoring flagged a new tool using maker-provided credentials: agent blocked pending review',
      why: 'After approval the maker added a connector tool with agent-author authentication. Everyone using the agent now acts with the maker’s access, which the approval never covered.',
      fix: 'Block in the admin center, then send the change back through intake. New tools, knowledge or audiences are new requests, not edits.',
    },
    attest: {
      label: 'Re-attestation missed',
      fail: 7,
      log: 'Access package expired: no sponsor attestation within the cadence; access removed',
      why: 'Contoso re-attests through access-package expiry. As the end date nears the sponsor is notified and may request an extension; if they do nothing, the assignment expires and the agent loses its access.',
      fix: 'The sponsor attests within the cadence to restore access, or the agent moves to retirement.',
    },
  },
};
