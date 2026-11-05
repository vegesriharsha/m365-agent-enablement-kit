// Policy model for the simulator. Conditions are evaluated against a
// simplified request: { type, location, tags, publicBlob }.
export const ALLOWED_LOCATIONS = ['eastus2', 'centralus'];

export const policies = {
  denyPip: {
    name: 'Deny public IP addresses',
    short: 'No public IPs',
    effect: 'Deny',
    applies: (r) => r.type === 'pip',
    why: 'Internal workloads should only be reachable through the hub.',
    json: `{
  "if": {
    "field": "type",
    "equals": "Microsoft.Network/publicIPAddresses"
  },
  "then": { "effect": "Deny" }
}`,
    rego: `package main

import rego.v1

# Fails the Terraform plan if it creates a public IP.
deny contains msg if {
  some rc in input.resource_changes
  rc.type == "azurerm_public_ip"
  "create" in rc.change.actions
  msg := sprintf("%s: public IP addresses are not allowed", [rc.address])
}`,
  },
  allowedLoc: {
    name: 'Allowed locations: East US 2, Central US',
    short: 'Allowed locations',
    effect: 'Deny',
    applies: (r) => r.location !== 'global' && !ALLOWED_LOCATIONS.includes(r.location),
    why: 'Keeps data in the regions the bank has approved.',
    json: `{
  "if": {
    "allOf": [
      { "field": "location",
        "notIn": "[parameters('listOfAllowedLocations')]" },
      { "field": "location", "notEquals": "global" },
      { "field": "type",
        "notEquals": "Microsoft.AzureActiveDirectory/b2cDirectories" }
    ]
  },
  "then": { "effect": "deny" }
}`,
    rego: `package main

import rego.v1

allowed := {"eastus2", "centralus"}

deny contains msg if {
  some rc in input.resource_changes
  "create" in rc.change.actions
  loc := rc.change.after.location
  not loc in allowed
  msg := sprintf("%s: location %s is not allowed", [rc.address, loc])
}`,
  },
  requireCostCenter: {
    name: "Require a 'costCenter' tag on resources",
    short: 'Require costCenter',
    effect: 'Deny',
    applies: (r) => !r.tags.costCenter,
    why: 'Every resource must say who pays for it.',
    json: `{
  "if": {
    "field": "[concat('tags[', parameters('tagName'), ']')]",
    "exists": "false"
  },
  "then": { "effect": "deny" }
}`,
    rego: `package main

import rego.v1

deny contains msg if {
  some rc in input.resource_changes
  "create" in rc.change.actions
  "tags" in object.keys(rc.change.after)
  not rc.change.after.tags.costCenter
  msg := sprintf("%s: missing costCenter tag", [rc.address])
}`,
  },
  inheritCostCenter: {
    name: "Inherit 'costCenter' from the subscription if missing",
    short: 'Inherit costCenter',
    effect: 'Modify',
    applies: (r, sub) => !r.tags.costCenter && !!sub.tags.costCenter,
    why: 'Fills the tag automatically instead of blocking the deployment.',
    json: `{
  "if": {
    "allOf": [
      { "field": "[concat('tags[', parameters('tagName'), ']')]",
        "exists": "false" },
      { "value": "[subscription().tags[parameters('tagName')]]",
        "notEquals": "" }
    ]
  },
  "then": {
    "effect": "modify",
    "details": {
      "roleDefinitionIds": [
        "/providers/microsoft.authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"
      ],
      "operations": [{
        "operation": "add",
        "field": "[concat('tags[', parameters('tagName'), ']')]",
        "value": "[subscription().tags[parameters('tagName')]]"
      }]
    }
  }
}`,
    rego: `# No equivalent. OPA can only pass or fail a plan;
# it cannot change the request the way Modify does.
# Instead, merge the subscription's tags into every
# resource in your Terraform module, and keep a Rego
# rule (like "Require costCenter") to catch misses.`,
  },
  auditStoragePublic: {
    name: 'Audit storage accounts that allow public blob access',
    short: 'Audit public blobs',
    effect: 'Audit',
    applies: (r) => r.type === 'storage' && r.publicBlob,
    why: 'Flags risky storage without blocking teams while they fix it.',
    json: `{
  "if": {
    "allOf": [
      { "field": "type",
        "equals": "Microsoft.Storage/storageAccounts" },
      { "field": "Microsoft.Storage/storageAccounts/allowBlobPublicAccess",
        "equals": "true" }
    ]
  },
  "then": { "effect": "audit" }
}`,
    rego: `package main

import rego.v1

# Conftest "warn" reports without failing,
# the closest match to Audit.
warn contains msg if {
  some rc in input.resource_changes
  rc.type == "azurerm_storage_account"
  rc.change.after.allow_nested_items_to_be_public == true
  msg := sprintf("%s: allows public blob access", [rc.address])
}`,
  },
  deployDiag: {
    name: 'Deploy diagnostic settings to the platform workspace',
    short: 'Deploy diagnostics',
    effect: 'DeployIfNotExists',
    applies: (r) => r.type !== 'pip',
    why: 'Every new resource starts logging without anyone remembering to switch it on.',
    json: `{
  "if": { "field": "type", "equals": "Microsoft.KeyVault/vaults" },
  "then": {
    "effect": "deployIfNotExists",
    "details": {
      "type": "Microsoft.Insights/diagnosticSettings",
      "existenceCondition": { "...": "a setting that sends allLogs to the workspace" },
      "roleDefinitionIds": [ "...Monitoring Contributor, Log Analytics Contributor..." ],
      "deployment": { "...": "ARM template that creates the diagnostic setting" }
    }
  }
}
// Abridged. ALZ uses Microsoft's built-in "Enable allLogs
// category group" initiative, one definition per resource type.`,
    rego: `# No equivalent. OPA cannot deploy anything.
# You can require the plan to contain a diagnostic
# setting for each resource you create:
package main

import rego.v1

deny contains msg if {
  some rc in input.resource_changes
  rc.type == "azurerm_key_vault"
  "create" in rc.change.actions
  not has_diag(rc.name)
  msg := sprintf("%s: add a diagnostic setting", [rc.address])
}

has_diag(name) if {
  some d in input.resource_changes
  d.type == "azurerm_monitor_diagnostic_setting"
  indexof(d.address, name) >= 0
}`,
  },
};

export const effectTone = {
  Deny: 'bad',
  Modify: 'navy',
  Audit: 'gold',
  DeployIfNotExists: 'good',
};

export const actions = [
  { id: 'pip', label: 'Public IP address in East US 2', req: { type: 'pip', location: 'eastus2', publicBlob: false } },
  { id: 'stg-weu', label: 'Storage account in West Europe', req: { type: 'storage', location: 'westeurope', publicBlob: false } },
  { id: 'stg-public', label: 'Storage account with public blob access, East US 2', req: { type: 'storage', location: 'eastus2', publicBlob: true } },
  { id: 'kv', label: 'Key vault in Central US', req: { type: 'kv', location: 'centralus', publicBlob: false } },
  { id: 'vm', label: 'Virtual machine in East US 2', req: { type: 'vm', location: 'eastus2', publicBlob: false } },
];

// Management-group tree (ids follow the ALZ library; names follow Microsoft Learn).
export const mgTree = {
  id: 'tenant',
  name: 'Tenant root group',
  children: [
    {
      id: 'contoso',
      name: 'Contoso (intermediate root)',
      children: [
        {
          id: 'platform',
          name: 'Platform',
          children: [
            { id: 'security', name: 'Security', children: [] },
            { id: 'management', name: 'Management', children: [] },
            { id: 'connectivity', name: 'Connectivity', children: [] },
            { id: 'identity', name: 'Identity', children: [] },
          ],
        },
        {
          id: 'landingzones',
          name: 'Workload landing zones',
          children: [
            { id: 'corp', name: 'Internal (Corp)', children: [] },
            { id: 'online', name: 'Online', children: [] },
            { id: 'local', name: 'Local', children: [] },
          ],
        },
        { id: 'sandbox', name: 'Sandbox', children: [] },
        { id: 'decommissioned', name: 'Decommissioned', children: [] },
      ],
    },
  ],
};

export const initialSubs = [
  { id: 'payments-prod', mg: 'corp', tags: { costCenter: 'CC-210' } },
  { id: 'portal-prod', mg: 'online', tags: { costCenter: 'CC-330' } },
  { id: 'platform-management', mg: 'management', tags: { costCenter: 'CC-100' } },
  { id: 'platform-connectivity', mg: 'connectivity', tags: { costCenter: 'CC-100' } },
  { id: 'lab-sandbox-01', mg: 'sandbox', tags: {} },
  { id: 'legacy-crm', mg: 'decommissioned', tags: { costCenter: 'CC-410' } },
];

export const initialAssignments = [
  { id: 'a1', policy: 'allowedLoc', scope: 'contoso', mode: 'Default' },
  { id: 'a2', policy: 'inheritCostCenter', scope: 'contoso', mode: 'Default' },
  { id: 'a3', policy: 'deployDiag', scope: 'contoso', mode: 'Default' },
  { id: 'a4', policy: 'auditStoragePublic', scope: 'contoso', mode: 'Default' },
  { id: 'a5', policy: 'requireCostCenter', scope: 'landingzones', mode: 'Default' },
  { id: 'a6', policy: 'denyPip', scope: 'corp', mode: 'Default' },
];
