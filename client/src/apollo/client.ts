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
    uri: "http://localhost:5001/graphql",
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

    // GraphQL errors
    if (CombinedGraphQLErrors.is(error)) {
        error.errors.forEach((err) => {
            if (err.message === "Not authorized") {
                localStorage.removeItem("token");
                window.location.href = "/login";
            }

            toast.error(err.message);
        });
        return;
    }

    // Network error
    toast.error("Помилка мережі");
});

export const apolloClient = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
});
