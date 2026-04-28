export const ASSET_TYPES = [
    "PRINTER",
    "LAPTOP",
    "MONITOR",
    "PHONE",
    "TABLET",
    "OTHER",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];