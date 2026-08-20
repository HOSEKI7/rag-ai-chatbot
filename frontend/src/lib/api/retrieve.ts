export interface CitationItem {
  index: number;
  document_id: string;
  document_title: string;
  category: string;
  section_title: string;
  page_number: number;
  chunk_id: string;
  parent_id: string;
  excerpt: string;
  confidence_score: number;
}

export interface RetrieveResponseData {
  passed_guardrail: boolean;
  confidence_score: number;
  refusal_message: string | null;
  reconstructed_context: string;
  citations: CitationItem[];
}

export async function retrieveQuery(
  backendBaseUrl: string,
  query: string,
  confidenceThreshold: number = 0.65,
  limit: number = 5
): Promise<RetrieveResponseData> {
  const url = `${backendBaseUrl.replace(/\/$/, "")}/api/v1/retrieve`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      limit,
      confidence_threshold: confidenceThreshold,
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
  }

  return (await res.json()) as RetrieveResponseData;
}
