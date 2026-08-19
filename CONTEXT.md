# Contexure

AI-powered Technical Support chatbot that answers product/engineering questions strictly from uploaded industrial datasheets, using Retrieval-Augmented Generation.

## Language

**Chunk**:
A segment of a parsed document stored with its vector embedding for retrieval.
_Avoid_: Fragment, piece, passage

**Source Document**:
An uploaded PDF datasheet or technical specification that the system indexes for Q&A.
_Avoid_: File, attachment, upload

**Retrieval**:
The process of finding the most semantically relevant chunks for a user's question via vector similarity search.
_Avoid_: Search, lookup, query (when referring to the vector matching step)

**Generation**:
The process of composing a natural-language answer from retrieved chunks using the LLM.
_Avoid_: Response creation, answer synthesis

**Citation**:
A reference linking a generated answer back to the specific chunk and source document it came from.
_Avoid_: Source, reference (when used without specifying it points back to a chunk)

**Confidence Score**:
The similarity score returned by Qdrant for a retrieved chunk. Below the configured threshold, the system refuses to answer rather than risk hallucination.
_Avoid_: Relevance score, match score

**Reranking**:
A second-pass scoring of retrieved chunks (via FlashRank) that reorders them by relevance before sending to the LLM.
_Avoid_: Re-sorting, re-scoring

**Ingestion Pipeline**:
The end-to-end process of parsing a source document (Docling), chunking it (structure-aware + hierarchical), embedding the chunks (nomic-embed-text), and storing them in Qdrant.
_Avoid_: Upload pipeline, indexing pipeline (indexing is one step within ingestion)

**Knowledge Base**:
The complete collection of indexed chunks across all source documents in Qdrant.
_Avoid_: Document store, corpus, index (index is the Qdrant-level construct, not the domain concept)

**Guardrail**:
A constraint that prevents the bot from answering questions outside the knowledge base scope, implemented via retrieval confidence threshold and system prompt restrictions.
_Avoid_: Filter, safety net, boundary
