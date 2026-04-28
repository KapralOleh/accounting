type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    error?: boolean;
};

export function Textarea({ className = "", error, ...props }: TextareaProps) {
    return (
        <textarea
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition
      ${error
                    ? "border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}
      ${className}`}
            {...props}
        />
    );
}