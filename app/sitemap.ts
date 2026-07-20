import type { MetadataRoute } from "next";
import {
    CREDITED_REVENUES_FILE,
    type CreditedRevenue,
    getAmendmentsFromSheet,
    readJsonFile,
} from "@/lib/json-storage";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

function validDate(value?: string): Date {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [amendments, revenues] = await Promise.all([
        getAmendmentsFromSheet(),
        readJsonFile<CreditedRevenue>(CREDITED_REVENUES_FILE),
    ]);

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: absoluteUrl("/"),
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: absoluteUrl("/projetos"),
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
    ];

    const amendmentPages: MetadataRoute.Sitemap = amendments
        .filter((amendment) => Boolean(amendment.id))
        .map((amendment) => ({
            url: absoluteUrl(`/projetos/${encodeURIComponent(String(amendment.id))}`),
            lastModified: validDate(amendment.createdAt),
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));

    const revenuePages: MetadataRoute.Sitemap = revenues
        .filter((revenue) => Boolean(revenue.id))
        .map((revenue) => ({
            url: absoluteUrl(`/projetos/receitas/${encodeURIComponent(String(revenue.id))}`),
            lastModified: validDate(revenue.updatedAt || revenue.creditDate),
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));

    return [...staticPages, ...amendmentPages, ...revenuePages];
}
