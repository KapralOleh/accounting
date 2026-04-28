import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client/react";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Textarea } from "../../components/Textarea";
import {
    GET_ASSET_DASHBOARD_SUMMARY,
    GET_ASSET,
    GET_ASSETS,
    UPDATE_ASSET,
} from "../../graphql/asset.operations";
import { GET_UNITS } from "../../graphql/unit.operations";
import {
    ASSET_TYPE_LABELS,
    ASSET_TYPES,
    RADIO_SUBTYPES,
} from "../../constants/assetTypes";
import type { AssetType, RadioSubtype } from "../../types";
import { isEmpty, isValidPrice } from "../../utils/validation";
import type {
    EditAssetFormErrors,
    EditAssetFormProps,
    GetAssetResponse,
    GetAssetVariables,
    GetUnitsResponse,
    UpdateAssetResponse,
    UpdateAssetVariables,
} from "./types";
import toast from "react-hot-toast";

export function EditAssetPage() {
    const { id } = useParams<{ id: string }>();

    const {
        data: assetData,
        loading: assetLoading,
        error: assetError,
    } = useQuery<GetAssetResponse, GetAssetVariables>(GET_ASSET, {
        variables: { id: id ?? "" },
        skip: !id,
    });

    const {
        data: unitsData,
        loading: unitsLoading,
        error: unitsError,
    } = useQuery<GetUnitsResponse>(GET_UNITS);

    if (assetLoading || unitsLoading) {
        return <p className="text-sm text-gray-500">Завантаження...</p>;
    }

    if (assetError) {
        return <p className="text-sm text-red-600">{assetError.message}</p>;
    }

    if (unitsError) {
        return <p className="text-sm text-red-600">{unitsError.message}</p>;
    }

    if (!assetData?.asset || !unitsData) {
        return (
            <div className="mx-auto max-w-xl">
                <Card>
                    <p className="text-sm text-gray-500">Майно не знайдено.</p>

                    <Link
                        to="/"
                        className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        Назад
                    </Link>
                </Card>
            </div>
        );
    }

    return <EditAssetForm asset={assetData.asset} units={unitsData.units} />;
}

function EditAssetForm({ asset, units }: EditAssetFormProps) {
    const navigate = useNavigate();

    const [name, setName] = useState(asset.name);
    const [serialNumber, setSerialNumber] = useState(asset.serialNumber);
    const [note, setNote] = useState(asset.note ?? "");
    const [price, setPrice] = useState(String(asset.price));
    const [type, setType] = useState<AssetType>(asset.type);
    const [radioSubtype, setRadioSubtype] = useState<RadioSubtype>(
        asset.radioSubtype ?? "DP4400"
    );
    const [unitId, setUnitId] = useState(asset.unit._id);
    const [errors, setErrors] = useState<EditAssetFormErrors>({});

    const [updateAsset, { loading, error }] =
        useMutation<UpdateAssetResponse, UpdateAssetVariables>(UPDATE_ASSET, {
            refetchQueries: [
                { query: GET_ASSETS },
                { query: GET_ASSET_DASHBOARD_SUMMARY },
            ],
            awaitRefetchQueries: true,
        });

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const newErrors: EditAssetFormErrors = {};

        if (isEmpty(name)) {
            newErrors.name = "Вкажіть назву";
        }

        if (isEmpty(serialNumber)) {
            newErrors.serialNumber = "Вкажіть серійний номер";
        }

        if (!isValidPrice(price)) {
            newErrors.price = "Некоректна ціна";
        }

        if (!unitId) {
            newErrors.unitId = "Оберіть підрозділ";
        }

        if (type === "RADIO" && !radioSubtype) {
            newErrors.radioSubtype = "Оберіть модель радіостанції";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        await updateAsset({
            variables: {
                id: asset._id,
                name: name.trim(),
                serialNumber: serialNumber.trim(),
                note: note.trim(),
                price: Number(price),
                type,
                radioSubtype:
                    type === "RADIO" ? radioSubtype : null,
                unitId,
            },
        });

        toast.success("Майно відредаговано");
        navigate("/");
    };

    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                    Редагувати майно
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Оновіть інформацію про майно та підрозділ.
                </p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Назва майна
                            </label>
                            <Input
                                value={name}
                                error={!!errors.name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Назва майна"
                            />

                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Серійний номер
                            </label>
                            <Input
                                value={serialNumber}
                                error={!!errors.serialNumber}
                                onChange={(event) => setSerialNumber(event.target.value)}
                                placeholder="Серійний номер"
                            />

                            {errors.serialNumber && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.serialNumber}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Ціна
                            </label>
                            <Input
                                value={price}
                                error={!!errors.price}
                                onChange={(event) => setPrice(event.target.value)}
                                placeholder="0"
                                type="number"
                                min="0"
                            />

                            {errors.price && (
                                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Тип
                            </label>
                            <Select
                                value={type}
                                onChange={(event) =>
                                    setType(event.target.value as AssetType)
                                }
                            >
                                {ASSET_TYPES.map((assetType) => (
                                    <option key={assetType} value={assetType}>
                                        {ASSET_TYPE_LABELS[assetType]}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        {type === "RADIO" && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Модель радіостанції
                                </label>
                                <Select
                                    value={radioSubtype}
                                    error={!!errors.radioSubtype}
                                    onChange={(event) =>
                                        setRadioSubtype(
                                            event.target.value as RadioSubtype
                                        )
                                    }
                                >
                                    {RADIO_SUBTYPES.map((subtype) => (
                                        <option key={subtype} value={subtype}>
                                            {subtype}
                                        </option>
                                    ))}
                                </Select>

                                {errors.radioSubtype && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.radioSubtype}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Підрозділ
                            </label>
                            <Select
                                value={unitId}
                                error={!!errors.unitId}
                                onChange={(event) => setUnitId(event.target.value)}
                            >
                                {units.map((unit) => (
                                    <option key={unit._id} value={unit._id}>
                                        {unit.name}
                                    </option>
                                ))}
                            </Select>

                            {errors.unitId && (
                                <p className="mt-1 text-sm text-red-600">{errors.unitId}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Примітка
                            </label>
                            <Textarea
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                placeholder="Додаткова інформація"
                                rows={4}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                            {error.message}
                        </p>
                    )}

                    <div className="flex items-center gap-3">
                        <Button disabled={loading}>
                            {loading ? "Збереження..." : "Зберегти"}
                        </Button>

                        <Link
                            to="/"
                            className="text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                            Скасувати
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}
