export type RegisterResponse = {
    register: {
        token: string;
        user: {
            _id: string;
            name: string;
            email: string;
        };
    };
};

export type RegisterVariables = {
    name: string;
    email: string;
    password: string;
};

export type RegisterFormErrors = {
    name?: string;
    email?: string;
    password?: string;
};
