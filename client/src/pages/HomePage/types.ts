import type { Asset, Unit } from "../../types";

export type GetAssetsResponse = {
    assetsPage: {
        items: Asset[];
        total: number;
        totalPrice: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};

export type GetUnitsResponse = {
    units: Unit[];
};

export type DeleteAssetResponse = {
    deleteAsset: boolean;
};

export type DeleteAssetVariables = {
    id: string;
};

export type GetAssetsVariables = {
    page: number;
    limit: number;
    unitId?: string;
    search?: string;
};

export type AssetSearchParams = {
    unitId?: string;
    search?: string;
    page?: number;
};
