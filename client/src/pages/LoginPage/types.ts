export type LoginResponse = {
    login: {
        token: string;
        user: {
            _id: string;
            name: string;
            email: string;
        };
    };
};

export type LoginVariables = {
    email: string;
    password: string;
};

export type LoginFormErrors = {
    email?: string;
    password?: string;
};
