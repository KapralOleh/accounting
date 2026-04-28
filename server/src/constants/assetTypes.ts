export const ASSET_TYPES = [
    "PRINTER",
    "LAPTOP",
    "STARLINK",
    "TABLET",
    "RADIO",
    "OTHER",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export const RADIO_SUBTYPES = [
    "DP4400",
    "DP4800",
    "R7",
    "R7a",
    "DM4600",
] as const;

export type RadioSubtype = (typeof RADIO_SUBTYPES)[number];
