import type { AssetType, RadioSubtype } from "../constants/assetTypes";

export type { AssetType, RadioSubtype } from "../constants/assetTypes";

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
