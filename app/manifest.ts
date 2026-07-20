import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: SITE_NAME,
        short_name: "Emendas Osasco",
        description: SITE_DESCRIPTION,
        start_url: "/",
        display: "standalone",
        background_color: "#f8fafc",
        theme_color: "#1d4ed8",
        lang: "pt-BR",
        icons: [
            {
                src: "/brasao-osasco.png",
                sizes: "500x507",
                type: "image/png",
                purpose: "any",
            },
        ],
    };
}
