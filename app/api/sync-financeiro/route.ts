import { NextResponse } from "next/server";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST() {
    if (!(await isAuthenticated())) {
        return unauthorizedResponse();
    }

    try {
        const scriptPath = path.join(process.cwd(), "scripts", "sync-financial-osasco.ts");
        
        // Executa o script usando npx tsx para suporte a TypeScript
        // Usamos shell: true no Windows para garantir que comandos como npx funcionem
        const { stdout, stderr } = await execAsync(`npx tsx "${scriptPath}"`, {
            cwd: process.cwd(),
            env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0" }
        });

        console.log("Sync Script Output:", stdout);
        
        if (stderr && !stderr.includes("Warning")) {
            console.error("Sync Script Error:", stderr);
        }

        // Extrair estatísticas do stdout se possível
        const matched = stdout.match(/concluída: (\d+)/);
        const count = matched ? matched[1] : "0";

        return NextResponse.json({
            success: true,
            message: "Sincronização concluída com sucesso",
            updatedCount: parseInt(count),
            log: stdout
        });

    } catch (error) {
        console.error("Critical error during sync execution:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Falha ao executar script de sincronização",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
