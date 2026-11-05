// Retail list prices in USD for East US 2, read from the Azure Retail Prices
// API on the date below. Your agreement (CSP, MCA, EA) may price differently,
// and prices change: re-check before relying on them.
export const PRICES_VERIFIED = '1 Nov 2026';
export const PRICE_REGION = 'East US 2';
export const HOURS_PER_MONTH = 730;

export const logs = {
  analyticsPerGB: 2.76, // Analytics Logs Data Ingestion, after the free tier
  analyticsFreeGBPerMonth: 5,
  basicPerGB: 0.5, // Basic Logs Data Ingestion
  auxiliaryPerGB: 0.05, // Auxiliary Logs Data Ingestion
  interactiveRetentionPerGBMonth: 0.12, // Analytics Logs Data Retention, beyond the included 30 days
  longTermPerGBMonth: 0.02, // Data Archive (long-term retention)
  queryScannedPerGB: 0.005, // Search Queries Scanned (Basic and Auxiliary)
  logAlert15MinPerMonth: 0.5,
  logAlert1MinPerMonth: 3,
};

// Hourly unless noted. Monthly = hourly x 730.
export const lab = {
  firewallBasicHour: 0.395,
  firewallBasicPerGB: 0.065,
  firewallStandardHour: 1.25,
  bastionBasicHour: 0.19,
  vpnGw1AZHour: 0.21, // VpnGw1AZ; non-zone-redundant VpnGw1 can no longer be created
  vwanStandardHubHour: 0.25,
  dnsResolverEndpointMonth: 180,
  privateDnsZoneMonth: 0.5,
  privateEndpointHour: 0.01,
  natGatewayHour: 0.045,
  publicIpHour: 0.005,
  vmB2atsV2Hour: 0.0094,
  vmB2sHour: 0.0416,
  keyVaultPer10kOps: 0.03,
};
