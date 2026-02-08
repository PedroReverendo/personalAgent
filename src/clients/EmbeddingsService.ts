import { env } from '../config/env';

/**
 * EmbeddingsService Interface
 * Allows swapping providers (OpenAI, Ollama, Local) without changing business logic.
 */
export interface IEmbeddingsService {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

/**
 * OpenAI Embeddings Service
 * Uses text-embedding-3-small model (1536 dimensions).
 */
class OpenAIEmbeddingsService implements IEmbeddingsService {
  private readonly apiUrl = 'https://api.openai.com/v1/embeddings';
  private readonly model = 'text-embedding-3-small';
  private readonly dimensions = 1536;

  async embed(text: string): Promise<number[]> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: this.model,
        dimensions: this.dimensions,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[EmbeddingsService] OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: texts,
        model: this.model,
        dimensions: this.dimensions,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[EmbeddingsService] OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.data.map((item: { embedding: number[] }) => item.embedding);
  }
}

// Export singleton instance
export const embeddingsService: IEmbeddingsService = new OpenAIEmbeddingsService();
