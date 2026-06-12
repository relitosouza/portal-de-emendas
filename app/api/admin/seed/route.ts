import { NextResponse } from "next/server";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import { writeJsonFile, AMENDMENTS_FILE, EXTERNAL_FILE, FINANCIAL_FILE } from "@/lib/json-storage";

export async function POST(request: Request) {
    if (!(await isAuthenticated())) {
        return unauthorizedResponse();
    }

    try {
        const dataDir = path.join(process.cwd(), "data");
        
        // Read file contents from the bundled assets
        const amendmentsContent = await fs.readFile(path.join(dataDir, AMENDMENTS_FILE), "utf-8");
        const externalContent = await fs.readFile(path.join(dataDir, EXTERNAL_FILE), "utf-8");
        const financialContent = await fs.readFile(path.join(dataDir, FINANCIAL_FILE), "utf-8");

        // Force write them to Redis (since writeJsonFile writes to Redis if HAS_REDIS is true)
        await writeJsonFile(AMENDMENTS_FILE, JSON.parse(amendmentsContent));
        await writeJsonFile(EXTERNAL_FILE, JSON.parse(externalContent));
        await writeJsonFile(FINANCIAL_FILE, JSON.parse(financialContent));

        return NextResponse.json({
            success: true,
            message: "Redis de produção populado com sucesso a partir dos arquivos JSON locais!"
        });
    } catch (error) {
        console.error("Error seeding production Redis:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
