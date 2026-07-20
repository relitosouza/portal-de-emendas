import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Emendas parlamentares",
    description:
        "Consulte e filtre as emendas parlamentares destinadas a Osasco por autor, área, localidade, situação e etapa da execução financeira.",
    alternates: {
        canonical: "/projetos",
    },
    openGraph: {
        url: "/projetos",
        title: "Emendas parlamentares de Osasco",
        description:
            "Consulte valores, autores, áreas beneficiadas e a execução das emendas parlamentares de Osasco.",
    },
};

export default function ProjetosLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
