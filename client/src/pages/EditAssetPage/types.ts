import type { Asset, AssetType, RadioSubtype, Unit } from "../../types";

export type GetAssetResponse = {
    asset: Asset | null;
};

export type GetAssetVariables = {
    id: string;
};

export type GetUnitsResponse = {
    units: Unit[];
};

export type UpdateAssetResponse = {
    updateAsset: {
        _id: string;
        name: string;
    };
};

export type UpdateAssetVariables = {
    id: string;
    name?: string;
    serialNumber?: string;
    note?: string;
    price?: number;
    type?: AssetType;
    radioSubtype?: RadioSubtype | null;
    unitId?: string;
};

export type EditAssetFormProps = {
    asset: Asset;
    units: Unit[];
};

export type EditAssetFormErrors = {
    name?: string;
    serialNumber?: string;
    price?: string;
    radioSubtype?: string;
    unitId?: string;
};
