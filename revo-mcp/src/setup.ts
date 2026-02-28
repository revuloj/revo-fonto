#!/usr/bin/env bun
/**
 * Setup script: downloads the pre-built Revo SQLite database from GitHub releases
 * and augments it with FTS5 indexes for fast lookup.
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const DB_PATH = join(DATA_DIR, "revo.db");
const REPO = "revuloj/revo-fonto";

async function getLatestReleaseDbUrl(): Promise<string> {
  const resp = await fetch(
    `https://api.github.com/repos/${REPO}/releases/latest`
  );
  if (!resp.ok) throw new Error(`GitHub API error: ${resp.status}`);
  const data = (await resp.json()) as {
    assets: { name: string; browser_download_url: string }[];
  };
  const asset = data.assets.find((a) => a.name.startsWith("revosql_") && a.name.endsWith(".zip"));
  if (!asset) throw new Error("No revosql_*.zip found in latest release");
  return asset.browser_download_url;
}

async function downloadAndExtract(url: string): Promise<void> {
  console.log(`Downloading ${url}...`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
  const zipData = await resp.arrayBuffer();
  const zipPath = join(DATA_DIR, "revosql.zip");
  await Bun.write(zipPath, zipData);
  console.log(`Downloaded ${(zipData.byteLength / 1024 / 1024).toFixed(1)} MB`);

  console.log("Extracting...");
  const proc = Bun.spawnSync(["unzip", "-o", zipPath, "-d", DATA_DIR]);
  if (proc.exitCode !== 0) {
    throw new Error(`unzip failed: ${proc.stderr.toString()}`);
  }

  // The zip contains revo.db
  const extractedPath = join(DATA_DIR, "revo.db");
  if (!existsSync(extractedPath)) {
    throw new Error("revo.db not found after extraction");
  }

  // Clean up zip
  await Bun.write(zipPath, ""); // truncate
  const { unlinkSync } = await import("fs");
  unlinkSync(zipPath);
  console.log("Extracted revo.db");
}

function augmentWithIndexes(dbPath: string): void {
  console.log("Augmenting database with FTS5 indexes...");
  const db = new Database(dbPath);

  // Standard indexes for common queries
  db.run("CREATE INDEX IF NOT EXISTS idx_nodo_kap ON nodo(kap COLLATE NOCASE)");
  db.run("CREATE INDEX IF NOT EXISTS idx_nodo_art ON nodo(art)");
  db.run("CREATE INDEX IF NOT EXISTS idx_traduko_mrk ON traduko(mrk)");
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_traduko_lng_trd ON traduko(lng, trd COLLATE NOCASE)"
  );
  db.run("CREATE INDEX IF NOT EXISTS idx_var_kap ON var(kap COLLATE NOCASE)");
  db.run("CREATE INDEX IF NOT EXISTS idx_referenco_mrk ON referenco(mrk)");
  db.run("CREATE INDEX IF NOT EXISTS idx_uzo_mrk ON uzo(mrk)");
  console.log("  Standard indexes created.");

  // FTS5 for headword search
  const ftsKapExists = db
    .query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='fts_kap'"
    )
    .get();
  if (!ftsKapExists) {
    db.run(`
      CREATE VIRTUAL TABLE fts_kap USING fts5(
        kap,
        tokenize='unicode61 remove_diacritics 2'
      )
    `);
    db.run("INSERT INTO fts_kap(rowid, kap) SELECT rowid, kap FROM nodo");
    // Include variant headwords
    db.run(`
      INSERT INTO fts_kap(kap)
        SELECT v.kap FROM var v
    `);
    console.log("  FTS5 headword index created.");
  } else {
    console.log("  FTS5 headword index already exists.");
  }

  // FTS5 for translation search
  const ftsTrdExists = db
    .query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='fts_trd'"
    )
    .get();
  if (!ftsTrdExists) {
    db.run(`
      CREATE VIRTUAL TABLE fts_trd USING fts5(
        trd,
        tokenize='unicode61 remove_diacritics 2'
      )
    `);
    db.run("INSERT INTO fts_trd(rowid, trd) SELECT rowid, trd FROM traduko");
    console.log("  FTS5 translation index created.");
  } else {
    console.log("  FTS5 translation index already exists.");
  }

  db.close();
  console.log("Database augmentation complete.");
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  if (existsSync(DB_PATH)) {
    console.log("revo.db already exists. Re-augmenting indexes...");
  } else {
    const url = await getLatestReleaseDbUrl();
    await downloadAndExtract(url);
  }

  augmentWithIndexes(DB_PATH);
  console.log("\nSetup complete! Run `bun run start` to start the MCP server.");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
