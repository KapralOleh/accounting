import { Button } from "./Button";

type ConfirmModalProps = {
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
};

export function ConfirmModal({
    open,
    title,
    description,
    confirmText = "Підтвердити",
    cancelText = "Скасувати",
    loading = false,
    onConfirm,
    onClose,
}: ConfirmModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

                <p className="mt-2 text-sm text-gray-500">{description}</p>

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>

                    <Button variant="danger" onClick={onConfirm} disabled={loading}>
                        {loading ? "Видалення..." : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}