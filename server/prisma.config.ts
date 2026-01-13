import "dotenv/config";
import { defineConfig } from "prisma/config";

// Ensure the DATABASE_URL environment variable is set
const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
