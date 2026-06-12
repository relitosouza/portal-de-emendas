import Redis from "ioredis";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        console.error("REDIS_URL is not set in environment!");
        process.exit(1);
    }

    const redis = new Redis(redisUrl);
    const dataDir = path.join(process.cwd(), "data");

    const keys = ["financial", "emendas-externas", "amendments", "sync_info"];

    for (const key of keys) {
        try {
            const raw = await redis.get(key);
            if (raw) {
                const data = JSON.parse(raw);
                const filename = key === "sync_info" ? "sync_info.json" : `${key}.json`;
                const filePath = path.join(dataDir, filename);
                await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
                console.log(`✓ Exported Redis key "${key}" to file "${filename}"`);
            } else {
                console.log(`⚠ Redis key "${key}" is empty/not found.`);
            }
        } catch (e) {
            console.error(`Error exporting key "${key}":`, e);
        }
    }

    redis.disconnect();
    process.exit(0);
}

main();
