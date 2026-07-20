const DEFAULT_SITE_URL = "https://portal.osasco.sp.gov.br";

export const SITE_NAME = "Portal das Emendas de Osasco";
export const SITE_DESCRIPTION =
    "Acompanhe com transparência as emendas parlamentares destinadas a Osasco, seus valores, autores, áreas beneficiadas e etapas de execução.";

export function getSiteUrl(): URL {
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

    try {
        return new URL(configuredUrl || DEFAULT_SITE_URL);
    } catch {
        return new URL(DEFAULT_SITE_URL);
    }
}

export function absoluteUrl(pathname = "/"): string {
    return new URL(pathname, getSiteUrl()).toString();
}

export function truncateDescription(value: string, maxLength = 160): string {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}
