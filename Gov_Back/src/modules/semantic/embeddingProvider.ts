import crypto from 'crypto';

/**
 * MVP embedding provider.
 * Replace this with a real embedding model (Azure OpenAI / OpenAI / etc.)
 */
export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}
