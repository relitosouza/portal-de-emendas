/**
 * Library to interact with the Internal Management System (GerenciamentoEmenda)
 */

const MANAGEMENT_API_URL = process.env.NEXT_PUBLIC_MANAGEMENT_API_URL || "http://localhost:3001";

export interface ManagementAmendment {
  id: string;
  status: string;
  percentualExecucaoFisica: number;
  dataAtualizacao: string;
  updatedAt?: string;
  processoAdministrativo?: string;
  planoTrabalho?: any;
  pareceres?: any[];
  vistorias?: any[];
  documentosFiscais?: any[];
  rendimentos?: any[];
  checklist?: any;
}

export async function fetchManagementDetails(id: string): Promise<ManagementAmendment | null> {
  try {
    const res = await fetch(`${MANAGEMENT_API_URL}/api/emendas/${id}`, {
      next: { revalidate: 60 } // Cache for 1 minute
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching management details:", error);
    return null;
  }
}
