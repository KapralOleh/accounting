export type AssetType =
    | "PRINTER"
    | "LAPTOP"
    | "STARLINK"
    | "TABLET"
    | "RADIO"
    | "OTHER";

export type RadioSubtype = "DP4400" | "DP4800" | "R7" | "R7a" | "DM4600";

export type Unit = {
    _id: string;
    name: string;
};

export type Asset = {
    _id: string;
    name: string;
    serialNumber: string;
    note?: string;
    price: number;
    type: AssetType;
    radioSubtype?: RadioSubtype | null;
    unit: Unit;
};
