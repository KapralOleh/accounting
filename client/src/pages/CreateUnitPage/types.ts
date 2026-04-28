export type CreateUnitResponse = {
    createUnit: {
        _id: string;
        name: string;
    };
};

export type CreateUnitVariables = {
    name: string;
};

export type CreateUnitFormErrors = {
    name?: string;
};
