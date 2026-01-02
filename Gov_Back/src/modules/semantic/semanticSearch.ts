import { prisma } from '../../db/prisma.js';
import { cosineSimilarity } from './cosine.js';
import type { EmbeddingProvider } from './embeddingProvider.js';

export type SemanticSearchResult = {
  serviceId: string;
  canonicalName: string;
  score: number;
};

export async function semanticSearchServices(opts: {
  query: string;
  provider: EmbeddingProvider;
  topK?: number;
}): Promise<SemanticSearchResult[]> {
  const { query, provider, topK = 5 } = opts;
  const qvec = await provider.embed(query);
  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: { id: true, canonicalName: true, embedding: true }
  });

  const scored: SemanticSearchResult[] = services
    .filter((s) => Array.isArray(s.embedding) && s.embedding.length === qvec.length)
    .map((s) => ({
      serviceId: s.id,
      canonicalName: s.canonicalName,
      score: cosineSimilarity(qvec, s.embedding as number[])
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}
