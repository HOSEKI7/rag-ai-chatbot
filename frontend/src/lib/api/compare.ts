import { getBackendBaseUrl } from "@/lib/api/documents";
import { CitationItem } from "@/types/chat";

export interface CompareResultData {
  status: string;
  compared_documents: string[];
  citations: CitationItem[];
  reconstructed_context: string;
  system_prompt: string;
  user_prompt: string;
}

export async function executeDocumentComparison(
  docIds: string[],
  query?: string,
  attributes?: string[],
  baseUrl: string = getBackendBaseUrl()
): Promise<CompareResultData> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/compare`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      doc_ids: docIds,
      query,
      attributes,
    }),
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ detail: res.statusText }));
    throw new Error(
      errorData.detail || `Comparison failed with status ${res.status}`
    );
  }

  return (await res.json()) as CompareResultData;
}
