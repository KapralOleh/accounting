export const isEmpty = (value: string) => {
    return !value.trim();
};

export const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const isValidPrice = (value: string) => {
    if (!value.trim()) return false;

    const numberValue = Number(value);

    return !Number.isNaN(numberValue) && numberValue >= 0;
};