export interface Portal {
  domain: string;
  label: string;
  city: string;
}

export const PORTALS: Portal[] = [
  { domain: "data.cityofchicago.org", label: "Chicago", city: "Chicago" },
  { domain: "data.ny.gov", label: "New York State", city: "New York" },
  { domain: "data.sfgov.org", label: "San Francisco", city: "San Francisco" },
  { domain: "data.seattle.gov", label: "Seattle", city: "Seattle" },
  { domain: "data.cityofnewyork.us", label: "New York City", city: "NYC" },
  { domain: "data.lacounty.gov", label: "Los Angeles County", city: "LA County" },
  { domain: "data.austintexas.gov", label: "Austin", city: "Austin" },
  { domain: "data.boston.gov", label: "Boston", city: "Boston" },
];

export const DEFAULT_PORTAL = PORTALS[0];

export function findPortal(domain: string): Portal | undefined {
  return PORTALS.find((p) => p.domain === domain);
}

export function getPortalLabel(domain: string): string {
  return findPortal(domain)?.label ?? domain;
}
