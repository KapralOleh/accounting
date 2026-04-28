import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { Card } from "../components/Card";
import { GET_ASSET_DASHBOARD_SUMMARY } from "../graphql/asset.operations";
import {
    ASSET_TYPE_PLURAL_LABELS,
    RADIO_SUBTYPE_LABELS,
} from "../constants/assetTypes";
import type { AssetType, RadioSubtype } from "../types";

type AssetTypeCount = {
    type: AssetType;
    count: number;
};

type RadioSubtypeCount = {
    subtype: RadioSubtype;
    count: number;
};

type UnitDashboardSummary = {
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

type DashboardSummaryResponse = {
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

const getRadioSubtypeCount = (
    items: RadioSubtypeCount[],
    subtype: RadioSubtype
) => {
    return items.find((item) => item.subtype === subtype)?.count ?? 0;
};

export function DashboardPage() {
    const [view, setView] = useState<"summary" | "units">("summary");
    const { data, loading, error } =
        useQuery<DashboardSummaryResponse>(GET_ASSET_DASHBOARD_SUMMARY);

    const summary = data?.assetDashboardSummary;
    const radioSubtypeCards = useMemo(() => {
        const counts = summary?.radioBySubtype ?? [];

        return (Object.keys(RADIO_SUBTYPE_LABELS) as RadioSubtype[]).map(
            (subtype) => ({
                label: RADIO_SUBTYPE_LABELS[subtype],
                count: getRadioSubtypeCount(counts, subtype),
            })
        );
    }, [summary?.radioBySubtype]);

    if (loading) {
        return <p className="text-sm text-gray-500">Завантаження...</p>;
    }

    if (error) {
        return <p className="text-sm text-red-600">{error.message}</p>;
    }

    if (!summary) {
        return null;
    }

    const mainCards = [
        {
            label: "Starlink",
            value: summary.starlinkCount,
        },
        {
            label: "Ноутбуки",
            value: summary.laptopCount,
        },
        {
            label: "Радіостанції",
            value: summary.radioCount,
        },
        {
            label: "Решта майна",
            value: summary.otherCount,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                        Дашборд
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Зведення майна за ключовими категоріями
                    </p>
                </div>

                <div className="inline-flex w-fit rounded-lg border border-gray-300 bg-white p-1">
                    <button
                        type="button"
                        onClick={() => setView("summary")}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                            view === "summary"
                                ? "bg-blue-600 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        Загальна інформація
                    </button>
                    <button
                        type="button"
                        onClick={() => setView("units")}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                            view === "units"
                                ? "bg-blue-600 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        По підрозділах
                    </button>
                </div>
            </div>

            {view === "summary" ? (
                <>
                    <div className="grid gap-4 md:grid-cols-4">
                        {mainCards.map((card) => (
                            <Card key={card.label}>
                                <p className="text-sm text-gray-500">
                                    {card.label}
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900">
                                    {card.value}
                                </p>
                            </Card>
                        ))}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
                        <Card>
                            <p className="text-sm text-gray-500">
                                Усього майна
                            </p>
                            <p className="mt-2 text-3xl font-semibold text-gray-900">
                                {summary.total}
                            </p>
                        </Card>

                        <Card>
                            <h3 className="text-base font-semibold text-gray-900">
                                Моделі радіостанцій
                            </h3>
                            <div className="mt-4 grid gap-3 sm:grid-cols-5">
                                {radioSubtypeCards.map((card) => (
                                    <div
                                        key={card.label}
                                        className="rounded-lg border border-gray-200 px-3 py-3"
                                    >
                                        <p className="text-xs font-medium text-gray-500">
                                            {card.label}
                                        </p>
                                        <p className="mt-1 text-xl font-semibold text-gray-900">
                                            {card.count}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <Card>
                        <h3 className="text-base font-semibold text-gray-900">
                            Усі типи майна
                        </h3>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {summary.byType.map((item) => (
                                <div
                                    key={item.type}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                                >
                                    <span className="text-sm text-gray-600">
                                        {ASSET_TYPE_PLURAL_LABELS[item.type]}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {item.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </>
            ) : (
                <div className="grid gap-4">
                    {summary.byUnit.length === 0 ? (
                        <Card>
                            <p className="text-sm text-gray-500">
                                Підрозділів поки немає.
                            </p>
                        </Card>
                    ) : (
                        summary.byUnit.map((unitSummary) => (
                            <Card key={unitSummary.unit._id}>
                                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                    <h3 className="text-base font-semibold text-gray-900">
                                        {unitSummary.unit.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Усього: {unitSummary.total}
                                    </p>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-4">
                                    <div className="rounded-lg border border-gray-200 px-3 py-3">
                                        <p className="text-xs text-gray-500">
                                            Starlink
                                        </p>
                                        <p className="mt-1 text-xl font-semibold text-gray-900">
                                            {unitSummary.starlinkCount}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 px-3 py-3">
                                        <p className="text-xs text-gray-500">
                                            Ноутбуки
                                        </p>
                                        <p className="mt-1 text-xl font-semibold text-gray-900">
                                            {unitSummary.laptopCount}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 px-3 py-3">
                                        <p className="text-xs text-gray-500">
                                            Радіостанції
                                        </p>
                                        <p className="mt-1 text-xl font-semibold text-gray-900">
                                            {unitSummary.radioCount}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 px-3 py-3">
                                        <p className="text-xs text-gray-500">
                                            Решта
                                        </p>
                                        <p className="mt-1 text-xl font-semibold text-gray-900">
                                            {unitSummary.otherCount}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-2 sm:grid-cols-5">
                                    {(Object.keys(
                                        RADIO_SUBTYPE_LABELS
                                    ) as RadioSubtype[]).map((subtype) => (
                                        <div
                                            key={subtype}
                                            className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                                        >
                                            <span className="text-xs text-gray-500">
                                                {subtype}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {getRadioSubtypeCount(
                                                    unitSummary.radioBySubtype,
                                                    subtype
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
