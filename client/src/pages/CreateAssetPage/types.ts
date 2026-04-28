import type { AssetType, RadioSubtype, Unit } from "../../types";

export type GetUnitsResponse = {
    units: Unit[];
};

export type CreateAssetResponse = {
    createAsset: {
        _id: string;
        name: string;
    };
};

export type CreateAssetVariables = {
    name: string;
    serialNumber: string;
    note?: string;
    price: number;
    type: AssetType;
    radioSubtype?: RadioSubtype;
    unitId: string;
};

export type CreateAssetFormErrors = {
    name?: string;
    serialNumber?: string;
    price?: string;
    radioSubtype?: string;
    unitId?: string;
};
