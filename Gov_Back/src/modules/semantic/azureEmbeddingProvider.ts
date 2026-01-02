import type { EmbeddingProvider } from "./embeddingProvider";
import { env } from "../../config/env";

export class AzureEmbeddingProvider implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    const url =
      `${env.AZURE_OPENAI_ENDPOINT}` +
      `openai/deployments/${env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT}` +
      `/embeddings?api-version=${env.AZURE_OPENAI_API_VERSION}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": env.AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        input: text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Azure OpenAI embedding failed: ${res.status} ${err}`);
    }

    const data = await res.json();

    const embedding = data.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error("Azure OpenAI returned empty embedding");
    }

    return embedding;
  }
}
