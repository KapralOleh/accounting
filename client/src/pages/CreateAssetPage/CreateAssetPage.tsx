import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client/react";
import { isEmpty, isValidPrice } from "../../utils/validation";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Textarea } from "../../components/Textarea";
import {
    CREATE_ASSET,
    GET_ASSET_DASHBOARD_SUMMARY,
    GET_ASSETS,
} from "../../graphql/asset.operations";
import { GET_UNITS } from "../../graphql/unit.operations";
import {
    ASSET_TYPE_LABELS,
    ASSET_TYPES,
    RADIO_SUBTYPES,
} from "../../constants/assetTypes";
import type { AssetType, RadioSubtype } from "../../types";
import type {
    CreateAssetFormErrors,
    CreateAssetResponse,
    CreateAssetVariables,
    GetUnitsResponse,
} from "./types";
import toast from "react-hot-toast";

export function CreateAssetPage() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [serialNumber, setSerialNumber] = useState("");
    const [note, setNote] = useState("");
    const [price, setPrice] = useState("");
    const [type, setType] = useState<AssetType>("LAPTOP");
    const [radioSubtype, setRadioSubtype] =
        useState<RadioSubtype>("DP4400");
    const [unitId, setUnitId] = useState("");
    const [errors, setErrors] = useState<CreateAssetFormErrors>({});

    const {
        data: unitsData,
        loading: unitsLoading,
        error: unitsError,
    } = useQuery<GetUnitsResponse>(GET_UNITS);

    const [createAsset, { loading, error }] = useMutation<
        CreateAssetResponse,
        CreateAssetVariables
    >(CREATE_ASSET, {
        refetchQueries: [
            { query: GET_ASSETS },
            { query: GET_ASSET_DASHBOARD_SUMMARY },
        ],
        awaitRefetchQueries: true,
    });

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const newErrors: CreateAssetFormErrors = {};

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

        await createAsset({
            variables: {
                name: name.trim(),
                serialNumber: serialNumber.trim(),
                note: note.trim(),
                price: Number(price),
                type,
                radioSubtype:
                    type === "RADIO" ? radioSubtype : undefined,
                unitId,
            },
        });

        toast.success("Майно створено");
        navigate("/");
    };

    if (unitsLoading) {
        return <p className="text-sm text-gray-500">Завантаження підрозділів...</p>;
    }

    if (unitsError) {
        return <p className="text-sm text-red-600">{unitsError.message}</p>;
    }

    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                    Створити майно
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Додайте майно та закріпіть його за підрозділом.
                </p>
            </div>

            <Card>
                {unitsData?.units.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                        <p className="text-sm text-gray-500">
                            Спочатку потрібно створити підрозділ.
                        </p>

                        <Link
                            to="/units/create"
                            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Створити підрозділ
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Назва майна
                                </label>
                                <Input
                                    value={name}
                                    error={!!errors.name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Наприклад: HP LaserJet"
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
                                    onChange={(e) => setSerialNumber(e.target.value)}
                                    placeholder="SN-123456"
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
                                    onChange={(e) => setPrice(e.target.value)}
                                    type="number"
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
                                    onChange={(event) => {
                                        setType(event.target.value as AssetType);
                                    }}
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
                                    <option value="">Оберіть підрозділ</option>

                                    {unitsData?.units.map((unit) => (
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
                                {loading ? "Створення..." : "Створити"}
                            </Button>

                            <Link
                                to="/"
                                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                            >
                                Скасувати
                            </Link>
                        </div>
                    </form>
                )}
            </Card>
        </div>
    );
}
