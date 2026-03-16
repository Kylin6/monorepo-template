const mysql = require("mysql2/promise");

function envInt(name, def) {
  const v = process.env[name];
  if (v == null || v === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function envList(name, defCsv) {
  const v = (process.env[name] ?? defCsv).trim();
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function tableExists(conn, db, table) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
    [db, table],
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function main() {
  const host = process.env.MYSQL_HOST ?? "localhost";
  const port = envInt("MYSQL_PORT", 3306);
  const user = process.env.MYSQL_USER ?? "root";
  const password = process.env.MYSQL_PASSWORD ?? "";
  const db = process.env.MYSQL_DB ?? "app";

  const tables = envList("MYSQL_WAIT_TABLES", "users");
  const timeoutMs = envInt("MYSQL_WAIT_TIMEOUT_MS", 180_000);
  const intervalMs = envInt("MYSQL_WAIT_INTERVAL_MS", 2000);

  const start = Date.now();
  // eslint-disable-next-line no-console
  console.log(
    `[wait-for-mysql] waiting for tables in ${db}@${host}:${port}: ${tables.join(
      ", ",
    )}`,
  );

  let lastErr = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const conn = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database: db,
      });
      try {
        const missing = [];
        for (const t of tables) {
          // eslint-disable-next-line no-await-in-loop
          const ok = await tableExists(conn, db, t);
          if (!ok) missing.push(t);
        }
        if (missing.length === 0) {
          // eslint-disable-next-line no-console
          console.log("[wait-for-mysql] all tables are ready");
          await conn.end();
          return;
        }
        // eslint-disable-next-line no-console
        console.log(
          `[wait-for-mysql] still missing (${missing.length}): ${missing.join(
            ", ",
          )}`,
        );
      } finally {
        await conn.end().catch(() => {});
      }
      lastErr = null;
    } catch (e) {
      lastErr = e;
      // eslint-disable-next-line no-console
      console.log(`[wait-for-mysql] connection not ready: ${e?.message ?? e}`);
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(intervalMs);
  }

  // eslint-disable-next-line no-console
  console.error("[wait-for-mysql] timed out waiting for MySQL tables");
  if (lastErr) {
    // eslint-disable-next-line no-console
    console.error("[wait-for-mysql] last error:", lastErr);
  }
  process.exit(1);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[wait-for-mysql] fatal error", e);
  process.exit(1);
});

