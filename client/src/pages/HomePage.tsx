import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client/react";
import toast from "react-hot-toast";
import { ConfirmModal } from "../components/ConfirmModal";
import { Input } from "../components/Input";
import { Card } from "../components/Card";
import { Select } from "../components/Select";
import { DELETE_ASSET, GET_ASSETS_PAGE } from "../graphql/asset.operations";
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

const ASSETS_PAGE_SIZE = 5;

type GetAssetsResponse = {
    assetsPage: {
        items: Asset[];
        total: number;
        totalPrice: number;
        page: number;
        limit: number;
        totalPages: number;
    };
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

type GetAssetsVariables = {
    page: number;
    limit: number;
    unitId?: string;
    search?: string;
};

export function HomePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [assetIdToDelete, setAssetIdToDelete] = useState<string | null>(null);
    const updateSearchParams = useCallback(
        (params: { unitId?: string; search?: string; page?: number }) => {
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

            if (params.page !== undefined) {
                if (params.page <= 1) {
                    nextParams.delete("page");
                } else {
                    nextParams.set("page", String(params.page));
                }
            } else if (
                params.unitId !== undefined ||
                params.search !== undefined
            ) {
                nextParams.delete("page");
            }

            setSearchParams(nextParams);
        },
        [searchParams, setSearchParams]
    );

    const selectedUnitId = searchParams.get("unitId") ?? "ALL";
    const search = searchParams.get("search") ?? "";
    const pageParam = Number(searchParams.get("page") ?? "1");
    const currentPage =
        Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
    const assetsPageVariables = useMemo<GetAssetsVariables>(
        () => ({
            page: currentPage,
            limit: ASSETS_PAGE_SIZE,
            unitId: selectedUnitId === "ALL" ? undefined : selectedUnitId,
            search: search.trim() || undefined,
        }),
        [currentPage, selectedUnitId, search]
    );

    const {
        data: assetsData,
        loading: assetsLoading,
        error: assetsError,
    } = useQuery<GetAssetsResponse, GetAssetsVariables>(GET_ASSETS_PAGE, {
        variables: assetsPageVariables,
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
        refetchQueries: [
            {
                query: GET_ASSETS_PAGE,
                variables: assetsPageVariables,
            },
        ],
        awaitRefetchQueries: true,
    });

    const assetsPage = assetsData?.assetsPage;
    const assets = assetsPage?.items ?? [];
    const totalAssets = assetsPage?.total ?? 0;
    const totalPrice = assetsPage?.totalPrice ?? 0;
    const totalPages = assetsPage?.totalPages ?? 1;
    const firstVisibleAsset =
        totalAssets === 0 ? 0 : (currentPage - 1) * ASSETS_PAGE_SIZE + 1;
    const lastVisibleAsset = Math.min(
        currentPage * ASSETS_PAGE_SIZE,
        totalAssets
    );
    const hasActiveFilters = selectedUnitId !== "ALL" || !!search.trim();

    useEffect(() => {
        if (assetsPage && currentPage > assetsPage.totalPages) {
            updateSearchParams({ page: assetsPage.totalPages });
        }
    }, [assetsPage, currentPage, updateSearchParams]);

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

    if ((assetsLoading && !assetsPage) || unitsLoading) {
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
                        {totalAssets}
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

                {assets.length === 0 ? (
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
                                {assets.map((asset) => (
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

                {totalAssets > 0 && (
                    <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
                        <p>
                            Показано {firstVisibleAsset}-{lastVisibleAsset} з{" "}
                            {totalAssets}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={currentPage <= 1 || assetsLoading}
                                onClick={() =>
                                    updateSearchParams({ page: currentPage - 1 })
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Назад
                            </button>

                            <span className="px-2">
                                Сторінка {currentPage} з {totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={currentPage >= totalPages || assetsLoading}
                                onClick={() =>
                                    updateSearchParams({ page: currentPage + 1 })
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Вперед
                            </button>
                        </div>
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
