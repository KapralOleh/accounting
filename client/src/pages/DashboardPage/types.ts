import type { AssetType, RadioSubtype } from "../../types";

export type { RadioSubtype } from "../../types";

export type AssetTypeCount = {
    type: AssetType;
    count: number;
};

export type RadioSubtypeCount = {
    subtype: RadioSubtype;
    count: number;
};

export type UnitDashboardSummary = {
    unit: {
        _id: string;
        name: string;
    };
    total: number;
    starlinkCount: number;
    laptopCount: number;
    radioCount: number;
    otherCount: number;
    radioBySubtype: RadioSubtypeCount[];
};

export type DashboardSummaryResponse = {
    assetDashboardSummary: {
        total: number;
        starlinkCount: number;
        laptopCount: number;
        radioCount: number;
        otherCount: number;
        byType: AssetTypeCount[];
        radioBySubtype: RadioSubtypeCount[];
        byUnit: UnitDashboardSummary[];
    };
};

export type DashboardView = "summary" | "units";
