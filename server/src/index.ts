import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";

import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";

import { connectDB } from "./config/db";

import path from "path";
import jwt from "jsonwebtoken";

dotenv.config({
    path: path.resolve(__dirname, "../../.env"),
});

const app = express();

app.use(cors());
app.use(express.json());

const startServer = async () => {
  await connectDB();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: false,
    plugins: [ApolloServerPluginLandingPageLocalDefault()],
  });

  await server.start();

    app.use(
        "/graphql",
        expressMiddleware(server, {
            context: async ({ req }) => {
                const authHeader = req.headers.authorization;

                if (!authHeader) {
                    return {};
                }

                const token = authHeader.replace("Bearer ", "");

                try {
                    const decoded = jwt.verify(
                        token,
                        process.env.JWT_SECRET as string
                    ) as { userId: string };

                    return {
                        userId: decoded.userId,
                    };
                } catch {
                    return {};
                }
            },
        })
    );

  const PORT = process.env.PORT || 5001;

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`GraphQL ready on http://localhost:${PORT}/graphql`);
    });
};

startServer();
