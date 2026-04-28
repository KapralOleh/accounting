import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { isEmpty, isValidEmail } from "../utils/validation";

const REGISTER = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      token
      user {
        _id
        name
        email
      }
    }
  }
`;

type RegisterResponse = {
    register: {
        token: string;
        user: {
            _id: string;
            name: string;
            email: string;
        };
    };
};

type RegisterVariables = {
    name: string;
    email: string;
    password: string;
};

export function RegisterPage() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
    }>({});

    const [register, { loading, error }] = useMutation<
        RegisterResponse,
        RegisterVariables
    >(REGISTER);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const newErrors: typeof errors = {};

        if (isEmpty(name)) {
            newErrors.name = "Вкажіть імʼя";
        }

        if (isEmpty(email)) {
            newErrors.email = "Вкажіть email";
        } else if (!isValidEmail(email)) {
            newErrors.email = "Некоректний email";
        }

        if (isEmpty(password)) {
            newErrors.password = "Вкажіть пароль";
        } else if (password.length < 6) {
            newErrors.password = "Пароль має бути мінімум 6 символів";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        const result = await register({
            variables: {
                name: name.trim(),
                email: email.trim(),
                password,
            },
        });

        const token = result.data?.register.token;

        if (token) {
            localStorage.setItem("token", token);
            navigate("/");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 px-4 py-10 flex items-center justify-center">
            <Card className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-semibold text-gray-900">Реєстрація</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Створіть акаунт для обліку майна
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Імʼя
                        </label>
                        <Input
                            value={name}
                            error={!!errors.name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Ваше імʼя"
                        />

                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <Input
                            value={email}
                            error={!!errors.email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="email@example.com"
                            type="email"
                        />

                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Пароль
                        </label>
                        <Input
                            value={password}
                            error={!!errors.password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Мінімум 6 символів"
                            type="password"
                        />

                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>

                    {error && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                            {error.message}
                        </p>
                    )}

                    <Button disabled={loading} className="w-full">
                        {loading ? "Створення..." : "Зареєструватися"}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Вже є акаунт?{" "}
                    <Link
                        to="/login"
                        className="font-medium text-blue-600 hover:text-blue-700"
                    >
                        Увійти
                    </Link>
                </p>
            </Card>
        </div>
    );
}