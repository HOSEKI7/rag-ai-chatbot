export interface IndexedDocumentInfo {
  document_id: string;
  document_title: string;
  category: string;
  page_count: number;
  parent_chunk_count: number;
  child_chunk_count: number;
  file_size?: number;
  created_at: string;
}

export interface IngestResult {
  status: string;
  document_id: string;
  document_title: string;
  category: string;
  page_count: number;
  parent_chunk_count: number;
  child_chunk_count: number;
  message: string;
}

export function getBackendBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    "http://localhost:8000"
  );
}

export async function fetchIndexedDocuments(
  baseUrl: string = getBackendBaseUrl()
): Promise<IndexedDocumentInfo[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/documents`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch indexed documents`);
  }

  return (await res.json()) as IndexedDocumentInfo[];
}

export async function uploadDatasheet(
  file: File,
  documentTitle?: string,
  category?: string,
  baseUrl: string = getBackendBaseUrl()
): Promise<IngestResult> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/ingest`;
  const formData = new FormData();
  formData.append("file", file);
  if (documentTitle) formData.append("document_title", documentTitle);
  if (category) formData.append("category", category);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ detail: res.statusText }));
    throw new Error(
      errorData.detail || `Upload failed with status ${res.status}`
    );
  }

  return (await res.json()) as IngestResult;
}

export async function deleteIndexedDocument(
  documentId: string,
  baseUrl: string = getBackendBaseUrl()
): Promise<{ status: string; message: string }> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/documents/${documentId}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete document: HTTP ${res.status}`);
  }

  return await res.json();
}
