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

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
    PRINTER: "Принтер",
    LAPTOP: "Ноутбук",
    STARLINK: "Starlink",
    TABLET: "Планшет",
    RADIO: "Радіостанція",
    OTHER: "Інше",
};

export const ASSET_TYPE_PLURAL_LABELS: Record<AssetType, string> = {
    PRINTER: "Принтери",
    LAPTOP: "Ноутбуки",
    STARLINK: "Starlink",
    TABLET: "Планшети",
    RADIO: "Радіостанції",
    OTHER: "Інше",
};

export const RADIO_SUBTYPE_LABELS: Record<RadioSubtype, string> = {
    DP4400: "DP4400",
    DP4800: "DP4800",
    R7: "R7",
    R7a: "R7a",
    DM4600: "DM4600",
};
