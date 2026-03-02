export interface Portal {
  domain: string;
  label: string;
  city: string;
  suggestions: string[];
}

export const PORTALS: Portal[] = [
  {
    domain: "data.cityofchicago.org",
    label: "Chicago",
    city: "Chicago",
    suggestions: [
      "Restaurant inspection failures",
      "Building permits this year",
      "Crime data by neighborhood",
    ],
  },
  {
    domain: "data.ny.gov",
    label: "New York State",
    city: "New York",
    suggestions: [
      "Health facility inspections",
      "School enrollment data",
      "Environmental permits",
    ],
  },
  {
    domain: "data.sfgov.org",
    label: "San Francisco",
    city: "San Francisco",
    suggestions: [
      "311 service requests",
      "Film location permits",
      "Business registrations",
    ],
  },
  {
    domain: "data.seattle.gov",
    label: "Seattle",
    city: "Seattle",
    suggestions: [
      "Building permits issued",
      "Public safety incidents",
      "Utility usage data",
    ],
  },
  {
    domain: "data.cityofnewyork.us",
    label: "New York City",
    city: "NYC",
    suggestions: [
      "311 complaints by borough",
      "Restaurant health grades",
      "Street tree census",
    ],
  },
  {
    domain: "data.lacounty.gov",
    label: "Los Angeles County",
    city: "LA County",
    suggestions: [
      "Property tax data",
      "Restaurant inspections",
      "COVID case data",
    ],
  },
  {
    domain: "data.austintexas.gov",
    label: "Austin",
    city: "Austin",
    suggestions: [
      "311 service requests",
      "Building permits",
      "Animal shelter outcomes",
    ],
  },
  {
    domain: "data.boston.gov",
    label: "Boston",
    city: "Boston",
    suggestions: [
      "311 service requests",
      "Building violations",
      "Crime incident reports",
    ],
  },
];

export const DEFAULT_PORTAL = PORTALS[0];

export function findPortal(domain: string): Portal | undefined {
  return PORTALS.find((p) => p.domain === domain);
}

export function getPortalLabel(domain: string): string {
  return findPortal(domain)?.label ?? domain;
}
