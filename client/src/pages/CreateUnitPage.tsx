import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { CREATE_UNIT, GET_UNITS } from "../graphql/unit.operations";
import { isEmpty } from "../utils/validation";

type CreateUnitResponse = {
    createUnit: {
        _id: string;
        name: string;
    };
};

type CreateUnitVariables = {
    name: string;
};

export function CreateUnitPage() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [errors, setErrors] = useState<{
        name?: string;
    }>({});

    const [createUnit, { loading, error }] = useMutation<
        CreateUnitResponse,
        CreateUnitVariables
    >(CREATE_UNIT, {
        refetchQueries: [{ query: GET_UNITS }],
        awaitRefetchQueries: true,
    });

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const newErrors: typeof errors = {};

        if (isEmpty(name)) {
            newErrors.name = "Вкажіть назву підрозділу";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        await createUnit({
            variables: {
                name: name.trim(),
            },
        });

        navigate("/");
    };

    return (
        <div className="mx-auto max-w-xl">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                    Створити підрозділ
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Додайте підрозділ, за яким буде закріплюватися майно.
                </p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Назва підрозділу
                        </label>

                        <Input
                            value={name}
                            error={!!errors.name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Наприклад: 1 рота"
                        />

                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
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
            </Card>
        </div>
    );
}