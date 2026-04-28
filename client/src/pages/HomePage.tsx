import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client/react";
import toast from "react-hot-toast";
import { ConfirmModal } from "../components/ConfirmModal";
import { Input } from "../components/Input";
import { Card } from "../components/Card";
import { Select } from "../components/Select";
import { DELETE_ASSET, GET_ASSETS } from "../graphql/asset.operations";
import { GET_UNITS } from "../graphql/unit.operations";
import type { Asset, AssetType, Unit } from "../types";

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
    PRINTER: "Принтер",
    LAPTOP: "Ноутбук",
    MONITOR: "Монітор",
    PHONE: "Телефон",
    TABLET: "Планшет",
    OTHER: "Інше",
};

type GetAssetsResponse = {
    assets: Asset[];
};

type GetUnitsResponse = {
    units: Unit[];
};

type DeleteAssetResponse = {
    deleteAsset: boolean;
};

type DeleteAssetVariables = {
    id: string;
};

export function HomePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [assetIdToDelete, setAssetIdToDelete] = useState<string | null>(null);
    const updateSearchParams = (params: {
        unitId?: string;
        search?: string;
    }) => {
        const nextParams = new URLSearchParams(searchParams);

        if (params.unitId !== undefined) {
            if (params.unitId === "ALL") {
                nextParams.delete("unitId");
            } else {
                nextParams.set("unitId", params.unitId);
            }
        }

        if (params.search !== undefined) {
            if (!params.search.trim()) {
                nextParams.delete("search");
            } else {
                nextParams.set("search", params.search);
            }
        }

        setSearchParams(nextParams);
    };

    const selectedUnitId = searchParams.get("unitId") ?? "ALL";

    const search = searchParams.get("search") ?? "";

    const {
        data: assetsData,
        loading: assetsLoading,
        error: assetsError,
    } = useQuery<GetAssetsResponse>(GET_ASSETS, {
        fetchPolicy: "cache-and-network",
    });

    const {
        data: unitsData,
        loading: unitsLoading,
        error: unitsError,
    } = useQuery<GetUnitsResponse>(GET_UNITS);

    const [deleteAsset, { loading: deleteLoading }] = useMutation<
        DeleteAssetResponse,
        DeleteAssetVariables
    >(DELETE_ASSET, {
        refetchQueries: [{ query: GET_ASSETS }],
        awaitRefetchQueries: true,
    });

    const filteredAssets = useMemo(() => {
        const assets = assetsData?.assets ?? [];
        const normalizedSearch = search.trim().toLowerCase();

        return assets.filter((asset) => {
            const matchesUnit =
                selectedUnitId === "ALL" || asset.unit._id === selectedUnitId;

            const matchesSearch =
                !normalizedSearch ||
                asset.name.toLowerCase().includes(normalizedSearch) ||
                asset.serialNumber.toLowerCase().includes(normalizedSearch) ||
                (asset.note ?? "").toLowerCase().includes(normalizedSearch);

            return matchesUnit && matchesSearch;
        });
    }, [assetsData?.assets, selectedUnitId, search]);

    const totalPrice = filteredAssets.reduce(
        (sum, asset) => sum + asset.price,
        0
    );
    const hasActiveFilters = selectedUnitId !== "ALL" || !!search.trim();

    const handleDeleteAsset = async () => {
        if (!assetIdToDelete) return;

        try {
            const { data } = await deleteAsset({
                variables: {
                    id: assetIdToDelete,
                },
            });

            if (!data?.deleteAsset) {
                throw new Error("Майно не знайдено або вже видалено");
            }

            toast.success("Майно видалено");
            setAssetIdToDelete(null);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Не вдалося видалити майно"
            );
        }
    };

    const clearFilters = () => {
        setSearchParams(new URLSearchParams());
    };

    if (assetsLoading || unitsLoading) {
        return <p className="text-sm text-gray-500">Завантаження...</p>;
    }

    if (assetsError) {
        return <p className="text-sm text-red-600">{assetsError.message}</p>;
    }

    if (unitsError) {
        return <p className="text-sm text-red-600">{unitsError.message}</p>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="mr-auto">
                    <h2 className="text-2xl font-semibold text-gray-900">
                        Майно
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Усе майно, закріплене за підрозділами
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <p className="text-sm text-gray-500">Кількість майна</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                        {filteredAssets.length}
                    </p>
                </Card>

                <Card>
                    <p className="text-sm text-gray-500">Загальна вартість</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                        {totalPrice.toLocaleString("uk-UA")} грн
                    </p>
                </Card>

                <Card>
                    <p className="text-sm text-gray-500">Підрозділів</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                        {unitsData?.units.length ?? 0}
                    </p>
                </Card>
            </div>

            <Card>
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="w-full md:max-w-sm">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Пошук
                        </label>

                        <Input
                            value={search}
                            onChange={(event) => {
                                updateSearchParams({
                                    search: event.target.value,
                                });
                            }}
                            placeholder="Назва, серійний номер або примітка"
                        />
                    </div>
                    <div className="w-full md:max-w-xs">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Фільтр по підрозділу
                        </label>

                        <Select
                            value={selectedUnitId}
                            onChange={(event) => {
                                updateSearchParams({
                                    unitId: event.target.value,
                                });
                            }}
                        >
                            <option value="ALL">Всі підрозділи</option>

                            {unitsData?.units.map((unit) => (
                                <option key={unit._id} value={unit._id}>
                                    {unit.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                {filteredAssets.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                        <p className="text-sm text-gray-500">
                            {hasActiveFilters
                                ? "За цими фільтрами майна не знайдено."
                                : "Майна поки немає."}
                        </p>

                        {hasActiveFilters ? (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Очистити фільтри
                            </button>
                        ) : (
                            <Link
                                to="/assets/create"
                                className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Створити перше майно
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-[920px] w-full border-collapse bg-white text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                                        Назва
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                                        Серійний номер
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                                        Тип
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                                        Ціна
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                                        Підрозділ
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                                        Примітка
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                                        Дії
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {filteredAssets.map((asset) => (
                                    <tr key={asset._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {asset.name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {asset.serialNumber}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {ASSET_TYPE_LABELS[asset.type]}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {asset.price.toLocaleString("uk-UA")} грн
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {asset.unit.name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {asset.note || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                to={`/assets/${asset._id}/edit`}
                                                className="mr-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                                            >
                                                Редагувати
                                            </Link>

                                            <button
                                                onClick={() => setAssetIdToDelete(asset._id)}
                                                className="text-sm font-medium text-red-600 hover:text-red-700"
                                            >
                                                Видалити
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
            <ConfirmModal
                open={!!assetIdToDelete}
                title="Видалити майно?"
                description="Цю дію неможливо скасувати. Майно буде повністю видалене з бази."
                confirmText="Видалити"
                loading={deleteLoading}
                onClose={() => setAssetIdToDelete(null)}
                onConfirm={handleDeleteAsset}
            />
        </div>
    );
}
