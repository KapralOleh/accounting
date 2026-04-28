import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";

type Props = {
    children: ReactNode;
};

export function Layout({ children }: Props) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
                    <h1 className="text-xl font-semibold mr-auto">
                        Облік майна
                    </h1>

                    <Link
                        to="/"
                        className="text-sm text-gray-700 hover:text-black"
                    >
                        Головна
                    </Link>

                    <Link
                        to="/dashboard"
                        className="text-sm text-gray-700 hover:text-black"
                    >
                        Дашборд
                    </Link>

                    <Link to="/units/create">
                        <Button variant="secondary">+ Підрозділ</Button>
                    </Link>

                    <Link to="/assets/create">
                        <Button>+ Майно</Button>
                    </Link>

                    <Button variant="danger" onClick={handleLogout}>
                        Вийти
                    </Button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-4 py-6">
                {children}
            </main>
        </div>
    );
}
