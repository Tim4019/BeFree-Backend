import dotenv from "dotenv";

dotenv.config();

export const PORT = Number.parseInt(process.env.PORT ?? "5005", 10);
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
export const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
export const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN ?? "7d";
