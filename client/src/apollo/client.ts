import {
    ApolloClient,
    InMemoryCache,
    HttpLink,
    from,
} from "@apollo/client";

import { SetContextLink } from "@apollo/client/link/context";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { ErrorLink } from "@apollo/client/link/error";

import toast from "react-hot-toast";

const httpLink = new HttpLink({
    uri: import.meta.env.VITE_API_URL || "http://localhost:5001/graphql",
});

const authLink = new SetContextLink((prevContext) => {
    const token = localStorage.getItem("token");

    return {
        headers: {
            ...prevContext.headers,
            authorization: token ? `Bearer ${token}` : "",
        },
    };
});

const errorLink = new ErrorLink(({ error }) => {
    if (!error) return;

    if (CombinedGraphQLErrors.is(error)) {
        const isAuthError = error.errors.some(
            (err) => err.message === "Not authorized"
        );

        if (isAuthError) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }

        return;
    }

    toast.error("Помилка мережі");
});

export const apolloClient = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
});
