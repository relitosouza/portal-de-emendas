"use client";

export default function PrintReportButton() {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">print</span>
            Imprimir / Salvar PDF
        </button>
    );
}
