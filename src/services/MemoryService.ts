import { embeddingsService } from '../clients/EmbeddingsService';
import { memoryRepository, MemorySearchResult } from '../repositories/MemoryRepository';
import { actionLogRepository } from '../repositories/ActionLogRepository';

export interface SaveMemoryResult {
  id: string;
  status: 'saved';
}

export interface RetrieveContextResult {
  content: string;
  similarity: number;
  category: string | null;
}

export class MemoryService {
  /**
   * Save a memory: vectorize text and store in DB
   */
  async saveMemory(content: string, category?: string): Promise<SaveMemoryResult> {
    const start = Date.now();
    
    try {
      // 1. Generate embedding
      const embedding = await embeddingsService.embed(content);
      
      // 2. Save to database
      const memory = await memoryRepository.save(content, embedding, category);
      
      await actionLogRepository.log(
        'memory_save',
        { content: content.substring(0, 100), category },
        `Saved memory: ${memory.id}`,
        Date.now() - start
      );
      
      return { id: memory.id, status: 'saved' };
    } catch (error) {
      await actionLogRepository.log(
        'memory_save',
        { content: content.substring(0, 100), category },
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Date.now() - start
      );
      throw error;
    }
  }

  /**
   * Retrieve relevant context for a query
   * @param query - User message to find relevant memories for
   * @param topK - Number of results (default 5)
   * @param threshold - Max cosine distance (default 0.7)
   */
  async retrieveContext(
    query: string,
    topK: number = 5,
    threshold: number = 0.7
  ): Promise<RetrieveContextResult[]> {
    const start = Date.now();
    
    try {
      // 1. Generate embedding for query
      const queryVector = await embeddingsService.embed(query);
      
      // 2. Search for similar memories
      const results: MemorySearchResult[] = await memoryRepository.searchSimilar(
        queryVector,
        topK,
        threshold
      );
      
      await actionLogRepository.log(
        'memory_retrieve',
        { query: query.substring(0, 100), topK, threshold },
        `Found ${results.length} relevant memories`,
        Date.now() - start
      );
      
      return results.map(r => ({
        content: r.content,
        similarity: r.similarity,
        category: r.category,
      }));
    } catch (error) {
      await actionLogRepository.log(
        'memory_retrieve',
        { query: query.substring(0, 100), topK, threshold },
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Date.now() - start
      );
      throw error;
    }
  }
}

export const memoryService = new MemoryService();
