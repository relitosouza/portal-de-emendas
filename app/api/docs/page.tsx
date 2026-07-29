import type { Metadata } from "next";

import { publicOpenApiDocument } from "@/lib/public-api/openapi";
import { ApiDocsClient } from "./api-docs-client";

export const metadata: Metadata = {
    title: "Documentação da API | Portal das Emendas",
    description: "Referência interativa da API Pública do Portal das Emendas de Osasco.",
    robots: { index: false, follow: false },
};

export default function ApiDocsPage() {
    return <ApiDocsClient specification={publicOpenApiDocument} />;
}

