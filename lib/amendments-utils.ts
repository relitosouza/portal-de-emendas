// Shared utilities for amendment data — centralizes duplicated logic across pages

// ─── Foto dos Vereadores ───────────────────────────────────────────────────────

export const VEREADORES_PHOTOS: Record<string, string> = {
    "alexandre capriotti": "https://www.osasco.sp.leg.br/images/vereadores/400x533/45388db9259060c2f847a9acf050a525.jpg",
    "batista comunidade": "https://www.osasco.sp.leg.br/images/vereadores/400x533/a616933d8c8620c941db8c6389743b26.jpg",
    "cantor goleiro": "https://www.osasco.sp.leg.br/images/vereadores/400x533/0767c1963d740186c59c2e830c10e16b.jpg",
    "gilmeiron medeiros": "https://www.osasco.sp.leg.br/images/vereadores/400x533/0767c1963d740186c59c2e830c10e16b.jpg",
    "gilmeiron": "https://www.osasco.sp.leg.br/images/vereadores/400x533/0767c1963d740186c59c2e830c10e16b.jpg",
    "carmônio bastos": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9ed34e28b9efdc33b9a383d18abc6946.jpg",
    "carmonio bastos": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9ed34e28b9efdc33b9a383d18abc6946.jpg",
    "délbio teruel": "https://www.osasco.sp.leg.br/images/vereadores/400x533/e535033db602c5581a7ac0b1d0315046.jpg",
    "delbio teruel": "https://www.osasco.sp.leg.br/images/vereadores/400x533/e535033db602c5581a7ac0b1d0315046.jpg",
    "elania silva": "https://www.osasco.sp.leg.br/images/vereadores/400x533/2d5fce8da59d004aaf94a048306c88c2.jpg",
    "elsa oliveira": "https://www.osasco.sp.leg.br/images/vereadores/400x533/3ee2bfdd86e0fe13ff2eba5087f754af.JPEG",
    "emerson osasco": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9df54556d1ce3e52f5f92b34e0e902b7.jpg",
    "fábio chirinhan": "https://www.osasco.sp.leg.br/images/vereadores/400x533/7637eecf3bafafa18bf946866c3d7ebb.jpg",
    "fabio chirinhan": "https://www.osasco.sp.leg.br/images/vereadores/400x533/7637eecf3bafafa18bf946866c3d7ebb.jpg",
    "gabriel saúde": "https://www.osasco.sp.leg.br/images/vereadores/400x533/64d036a8536d88813efe862c01f17196.jpg",
    "gabriel saude": "https://www.osasco.sp.leg.br/images/vereadores/400x533/64d036a8536d88813efe862c01f17196.jpg",
    "guilherme prado": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9a0b3136fdaadd2c3eafa95bc9ac8a67.jpg",
    "heber do juntoz": "https://www.osasco.sp.leg.br/images/vereadores/400x533/451dca9078df3a7b78ba7dbcae04f519.jpg",
    "heber": "https://www.osasco.sp.leg.br/images/vereadores/400x533/451dca9078df3a7b78ba7dbcae04f519.jpg",
    "josias da juco": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9af83e98e89d0d11384218be586f9c15.jpg",
    "josias": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9af83e98e89d0d11384218be586f9c15.jpg",
    "laércio mendonça": "https://www.osasco.sp.leg.br/images/vereadores/400x533/24d2dd1f169220dd29a534cab813846f.jpg",
    "laercio mendonca": "https://www.osasco.sp.leg.br/images/vereadores/400x533/24d2dd1f169220dd29a534cab813846f.jpg",
    "lúcia da saúde": "https://www.osasco.sp.leg.br/images/vereadores/400x533/8eda3967aa4a294208d7d14ccf96f63a.jpg",
    "lucia da saude": "https://www.osasco.sp.leg.br/images/vereadores/400x533/8eda3967aa4a294208d7d14ccf96f63a.jpg",
    "francisca jenilúcia": "https://www.osasco.sp.leg.br/images/vereadores/400x533/8eda3967aa4a294208d7d14ccf96f63a.jpg",
    "francisca jenilucia": "https://www.osasco.sp.leg.br/images/vereadores/400x533/8eda3967aa4a294208d7d14ccf96f63a.jpg",
    "jenilúcia": "https://www.osasco.sp.leg.br/images/vereadores/400x533/8eda3967aa4a294208d7d14ccf96f63a.jpg",
    "paulo junior": "https://www.osasco.sp.leg.br/images/vereadores/400x533/1dae1fb1d07087c4955141b0c4a187ae.jpg",
    "pedrinho cantagessi": "https://www.osasco.sp.leg.br/images/vereadores/400x533/1f3f10d6b03bf5dc76cab37061b8bf0a.jpg",
    "ralfi silva": "https://www.osasco.sp.leg.br/images/vereadores/400x533/aad42d63bda566e06fc169d1e1bf70e7.jpg",
    "ralfi rafael": "https://www.osasco.sp.leg.br/images/vereadores/400x533/aad42d63bda566e06fc169d1e1bf70e7.jpg",
    "ralfi": "https://www.osasco.sp.leg.br/images/vereadores/400x533/aad42d63bda566e06fc169d1e1bf70e7.jpg",
    "rodrigo gansinho": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9b61b998c846d6a0bf42416efcf1ea12.jpg",
    "sergio fontellas": "https://www.osasco.sp.leg.br/images/vereadores/400x533/ed4f5329b802c35ca71bfe51a0547a4a.jpg",
    "sérgio fontellas": "https://www.osasco.sp.leg.br/images/vereadores/400x533/ed4f5329b802c35ca71bfe51a0547a4a.jpg",
    "stephane rossi": "https://www.osasco.sp.leg.br/images/vereadores/400x533/c019dab55864b3d4a328aeb49686e753.jpg",
    "paulo fiorilo": "https://www3.al.sp.gov.br/legis/biografia/fotos/300638/8724f840684b834e46bb3550cdab9150d23eab9003b2bc6a65ba12320235895a.jpeg",
    "samia bomfim": "https://www.camara.leg.br/internet/deputado/bandep/pagina_do_deputado/204535.jpg",
    "juliana cardoso": "https://www.camara.leg.br/internet/deputado/bandep/pagina_do_deputado/220640.jpg",
    "delegado cunha": "https://www.camara.leg.br/internet/deputado/bandep/pagina_do_deputado/220649.jpg",
    "giordano": "https://upload.wikimedia.org/wikipedia/commons/3/39/Foto_Oficial_de_Giordano_como_Senador_por_S%C3%A3o_Paulo_-_Vers%C3%A3o_2.jpg",
    "kiko celeguim": "https://www.camara.leg.br/internet/deputado/bandep/pagina_do_deputado/162067.jpg",
    "carlos zarattini": "https://www.camara.leg.br/internet/deputado/bandep/pagina_do_deputado/141398.jpg",
    "gilberto nascimento": "https://www.camara.leg.br/internet/deputado/bandep/pagina_do_deputado/74270.jpg",
    "maria rosas": "https://www.camara.leg.br/internet/deputado/bandep/pagina_do_deputado/204540.jpg",
    "vinicius carvalho": "https://www.camara.leg.br/internet/deputado/bandep/pagina_do_deputado/141555.jpg",
};

export function findVereadorPhoto(name: string): string | undefined {
    const normalized = name.toLowerCase().trim();

    // Ignore collective/committee names to avoid false matches (e.g. Comissao, Bancada, Prefeitura)
    if (normalized.includes("comissao") || normalized.includes("comissão") || 
        normalized.includes("bancada") || normalized.includes("coletivo") ||
        normalized.includes("lideranca") || normalized.includes("liderança") ||
        normalized.includes("mesa diretora") || normalized.includes("prefeitura")) {
        return undefined;
    }

    if (VEREADORES_PHOTOS[normalized]) return VEREADORES_PHOTOS[normalized];
    for (const [key, url] of Object.entries(VEREADORES_PHOTOS)) {
        if (normalized.includes(key) || key.includes(normalized)) return url;
    }
    const parts = normalized.split(" ");
    for (const part of parts) {
        if (part.length < 3) continue;
        if (["das", "dos", "com", "sem", "para", "pelo", "pela"].includes(part)) continue;
        for (const [key, url] of Object.entries(VEREADORES_PHOTOS)) {
            if (key.split(" ").some(k => k === part)) return url;
        }
    }
    return undefined;
}

// ─── Mapa de Categorias Orçamentárias ─────────────────────────────────────────

export const CATEGORY_MAP: Record<string, string> = {
    "1": "LEGISLATIVA", "2": "JUDICIÁRIA", "3": "ESSENCIAL À JUSTIÇA",
    "4": "ADMINISTRAÇÃO", "5": "DEFESA NACIONAL", "6": "SEGURANÇA PÚBLICA",
    "7": "RELAÇÕES EXTERIORES", "8": "ASSISTÊNCIA SOCIAL", "9": "PREVIDÊNCIA SOCIAL",
    "10": "SAÚDE", "11": "TRABALHO", "12": "EDUCAÇÃO", "13": "CULTURA",
    "14": "DIREITOS DA CIDADANIA", "15": "URBANISMO", "16": "HABITAÇÃO",
    "17": "SANEAMENTO", "18": "GESTÃO AMBIENTAL", "19": "CIÊNCIA E TECNOLOGIA",
    "20": "AGRICULTURA", "21": "ORGANIZAÇÃO AGRÁRIA", "22": "INDÚSTRIA",
    "23": "COMÉRCIO E SERVIÇOS", "24": "COMUNICAÇÕES", "25": "ENERGIA",
    "26": "TRANSPORTE", "27": "DESPORTO E LAZER", "28": "ENCARGOS ESPECIAIS",
    "99": "RESERVA DE CONTIGÊNCIA",
};

export function getCategoryLabel(cat?: string): string | null {
    if (!cat) return null;
    let catNum = cat;
    if (typeof catNum === "string" && catNum.includes(" - ")) catNum = catNum.split(" - ")[0].trim();
    return CATEGORY_MAP[String(catNum)] || cat;
}

// ─── Parsing de Moeda ──────────────────────────────────────────────────────────

/**
 * Parse Brazilian currency format to number.
 * Handles formats like: "R$ 1.234,56", "1.234,56", "1234,56", "1234.56"
 * Returns 0 for invalid input instead of NaN.
 */
export function parseCurrency(val?: string | number): number {
    if (!val && val !== 0) return 0;

    // If already a number, validate range and return
    if (typeof val === "number") {
        // Reject NaN, Infinity, and unreasonably large values
        if (!isFinite(val)) return 0;
        if (val < 0) return 0; // No negative values
        if (val > 999_999_999_999) return 0; // Reject values over 1 trillion
        return val;
    }

    let str = String(val).trim();

    // Remove currency symbol and spaces
    str = str.replace(/[R$\s]/g, "");

    if (!str) return 0;

    // Check if it's a simple decimal number: "12345.67"
    if (/^\d+(\.\d{1,2})?$/.test(str)) {
        const num = parseFloat(str);
        return isFinite(num) ? Math.max(0, num) : 0;
    }

    // Check if it has both comma and dot: determine which is decimal separator
    if (str.includes(",") && str.includes(".")) {
        // In Brazilian format: last separator is decimal, others are thousands
        const lastCommaIdx = str.lastIndexOf(",");
        const lastDotIdx = str.lastIndexOf(".");

        if (lastCommaIdx > lastDotIdx) {
            // Comma is decimal: "1.234,56"
            str = str.replace(/\./g, "").replace(",", ".");
        } else {
            // Dot is decimal: "1,234.56" (rare but handle it)
            str = str.replace(/,/g, "");
        }
    } else if (str.includes(",")) {
        // Only comma present: likely "1.234,56" or "1234,56"
        str = str.replace(",", ".");
    } else if (str.includes(".")) {
        // Only dot present: could be "1.234.567" (thousands) or "1234.56" (decimal)
        const lastDot = str.lastIndexOf(".");
        const decimalPart = str.substring(lastDot + 1);

        // If 2 or 3 digits after last dot, it's likely thousands separator
        if (decimalPart.length === 3) {
            // Multiple dots: "1.234.567" - remove all dots
            str = str.replace(/\./g, "");
        }
        // If 1-2 digits after last dot, treat as decimal
        // Keep the last dot as decimal, remove others
        else if (decimalPart.length <= 2) {
            const beforeLastDot = str.substring(0, lastDot);
            str = beforeLastDot.replace(/\./g, "") + "." + decimalPart;
        }
    }

    // Final parsing
    const num = parseFloat(str);

    // Validate result
    if (!isFinite(num)) return 0;
    if (num < 0) return 0;
    if (num > 999_999_999_999) return 0;

    // Round to 2 decimal places to avoid floating point precision issues
    return Math.round(num * 100) / 100;
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
