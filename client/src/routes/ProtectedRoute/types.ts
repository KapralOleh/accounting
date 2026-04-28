export type MeResponse = {
    me: {
        _id: string;
        name: string;
        email: string;
    } | null;
};
