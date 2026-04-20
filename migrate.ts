import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { config } from "dotenv";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL!.replace("-pooler", "");
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false } // Required for local connections to Neon on some systems
});

async function main() {
  await client.connect();
  const db = drizzle(client);

  console.log("Running migrations with standard PG driver...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully!");
  
  await client.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Migration failed!", err);
  await client.end().catch(() => {});
  process.exit(1);
});
