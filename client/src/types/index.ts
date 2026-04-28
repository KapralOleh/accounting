export type AssetType =
    | "PRINTER"
    | "LAPTOP"
    | "MONITOR"
    | "PHONE"
    | "TABLET"
    | "OTHER";

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
    unit: Unit;
};