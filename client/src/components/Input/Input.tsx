import type { InputProps } from "./types";

export function Input({ className = "", error, ...props }: InputProps) {
    return (
        <input
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition
      ${error ? "border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}
      ${className}`}
            {...props}
        />
    );
}
