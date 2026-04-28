import { useQuery } from "@apollo/client/react";
import { Navigate, Outlet } from "react-router-dom";
import { ME } from "../../graphql/auth.operations";
import type { MeResponse } from "./types";

export function ProtectedRoute() {
    const token = localStorage.getItem("token");

    const { data, loading, error } = useQuery<MeResponse>(ME, {
        skip: !token,
        fetchPolicy: "network-only",
    });

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (loading) {
        return <p className="text-sm text-gray-500">Перевірка сесії...</p>;
    }

    if (error) {
        return (
            <p className="text-sm text-red-600">
                Не вдалося перевірити сесію. Перевірте підключення до сервера.
            </p>
        );
    }

    if (!data?.me) {
        localStorage.removeItem("token");
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
