import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/admin/",
                "/api/",
                "/projetos/relatorio-indicacoes",
                "/projetos/*/relatorio",
                "/projetos/*/relatorio-indicacoes",
            ],
        },
        sitemap: absoluteUrl("/sitemap.xml"),
        host: getSiteUrl().origin,
    };
}
