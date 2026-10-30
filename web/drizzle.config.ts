import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

const databaseUrl = new URL(process.env.DATABASE_URL!);
databaseUrl.searchParams.set("sslmode", "require");

export default defineConfig({
  schema: "./lib/supabase/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl.toString(),
  },
  schemaFilter: ["public"],
  tablesFilter: ["managed_agent_session"],
  strict: true,
});
