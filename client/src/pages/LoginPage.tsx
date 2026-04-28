import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { isEmpty, isValidEmail } from "../utils/validation";

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        _id
        name
        email
      }
    }
  }
`;

type LoginResponse = {
    login: {
        token: string;
        user: {
            _id: string;
            name: string;
            email: string;
        };
    };
};

type LoginVariables = {
    email: string;
    password: string;
};

export function LoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{
        email?: string;
        password?: string;
    }>({});

    const [login, { loading, error }] = useMutation<
        LoginResponse,
        LoginVariables
    >(LOGIN);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const newErrors: typeof errors = {};

        if (isEmpty(email)) {
            newErrors.email = "Вкажіть email";
        } else if (!isValidEmail(email)) {
            newErrors.email = "Некоректний email";
        }

        if (isEmpty(password)) {
            newErrors.password = "Вкажіть пароль";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        const result = await login({
            variables: {
                email: email.trim(),
                password,
            },
        });

        const token = result.data?.login.token;

        if (token) {
            localStorage.setItem("token", token);
            navigate("/");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 px-4 py-10 flex items-center justify-center">
            <Card className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-semibold text-gray-900">Вхід</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Увійдіть для доступу до обліку майна
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                            placeholder="Ваш пароль"
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
                        {loading ? "Вхід..." : "Увійти"}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Немає акаунта?{" "}
                    <Link
                        to="/register"
                        className="font-medium text-blue-600 hover:text-blue-700"
                    >
                        Зареєструватися
                    </Link>
                </p>
            </Card>
        </div>
    );
}