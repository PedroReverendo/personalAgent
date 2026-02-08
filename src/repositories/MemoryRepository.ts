import { db } from '../config/database';

export interface Memory {
  id: string;
  content: string;
  embedding?: number[];
  category: string | null;
  created_at: Date;
}

export interface MemorySearchResult {
  id: string;
  content: string;
  category: string | null;
  similarity: number;
  created_at: Date;
}

export class MemoryRepository {
  /**
   * Save a memory with its embedding vector
   */
  async save(content: string, embedding: number[], category?: string): Promise<Memory> {
    const vectorStr = `[${embedding.join(',')}]`;
    
    const query = `
      INSERT INTO memories (content, embedding, category)
      VALUES ($1, $2::vector, $3)
      RETURNING id, content, category, created_at
    `;
    
    const rows = await db.query<Memory>(query, [content, vectorStr, category || null]);
    return rows[0];
  }

  /**
   * Search for similar memories using cosine distance
   * @param queryVector - The embedding vector to search with
   * @param topK - Number of results to return (default 5)
   * @param threshold - Maximum cosine distance (default 0.7, lower = more similar)
   */
  async searchSimilar(
    queryVector: number[],
    topK: number = 5,
    threshold: number = 0.7
  ): Promise<MemorySearchResult[]> {
    const vectorStr = `[${queryVector.join(',')}]`;
    
    // Using <=> operator for cosine distance (0 = identical, 2 = opposite)
    // Convert to similarity: 1 - distance
    const query = `
      SELECT 
        id,
        content,
        category,
        created_at,
        1 - (embedding <=> $1::vector) as similarity
      FROM memories
      WHERE embedding <=> $1::vector < $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    `;
    
    const rows = await db.query<MemorySearchResult>(query, [vectorStr, threshold, topK]);
    return rows;
  }

  /**
   * Get all memories (for debugging)
   */
  async getAll(): Promise<Memory[]> {
    const query = `
      SELECT id, content, category, created_at
      FROM memories
      ORDER BY created_at DESC
    `;
    return db.query<Memory>(query);
  }

  /**
   * Delete a memory by ID
   */
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM memories WHERE id = $1`;
    await db.query(query, [id]);
    return true;
  }
}

export const memoryRepository = new MemoryRepository();
