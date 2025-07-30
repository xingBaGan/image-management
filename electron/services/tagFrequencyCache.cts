import { TagFrequency } from '../dao/ImageDAO.cjs';
import { LocalImageData } from '../dao/type.cjs';
import { logger } from './logService.cjs';

interface CacheEntry {
  tagFrequency: TagFrequency[];
  lastUpdated: number;
  imageCount: number;
  totalTags: number;
}

class TagFrequencyCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  private readonly MAX_CACHE_SIZE = 100; // Maximum cache entries

  /**
   * Generate cache key based on options
   */
  private generateCacheKey(options: { sortDirection?: 'asc' | 'desc'; limit?: number } = {}): string {
    const { sortDirection = 'desc', limit } = options;
    return `${sortDirection}_${limit || 'all'}`;
  }

  /**
   * Check if cache is valid (not expired and data is current)
   */
  private isCacheValid(entry: CacheEntry, currentImageCount: number, currentTotalTags: number): boolean {
    const now = Date.now();
    const isExpired = now - entry.lastUpdated > this.CACHE_DURATION;
    const isDataStale = entry.imageCount !== currentImageCount || entry.totalTags !== currentTotalTags;
    
    return !isExpired && !isDataStale;
  }

  /**
   * Get current data statistics for cache validation
   */
  private async getDataStats(images: LocalImageData[]): Promise<{ imageCount: number; totalTags: number }> {
    const imageCount = images.length;
    const totalTags = images.reduce((sum, image) => sum + (image.tags?.length || 0), 0);
    return { imageCount, totalTags };
  }

  /**
   * Calculate tag frequency from images data
   */
  private calculateTagFrequency(images: LocalImageData[]): TagFrequency[] {
    const tagCountMap = new Map<string, number>();
    
    // Single pass through all images to count tags
    for (const image of images) {
      if (image.tags && Array.isArray(image.tags)) {
        for (const tag of image.tags) {
          if (tag && typeof tag === "string") {
            const normalizedTag = tag.trim();
            if (normalizedTag) {
              tagCountMap.set(normalizedTag, (tagCountMap.get(normalizedTag) || 0) + 1);
            }
          }
        }
      }
    }
    
    // Convert Map to array
    return Array.from(tagCountMap.entries()).map(([name, times]) => ({ name, times }));
  }

  /**
   * Sort and limit tag frequency array
   */
  private sortAndLimit(tagFrequency: TagFrequency[], options: { sortDirection?: 'asc' | 'desc'; limit?: number } = {}): TagFrequency[] {
    const { sortDirection = 'desc', limit } = options;
    
    // Sort by frequency
    const sorted = [...tagFrequency].sort((a, b) => {
      return sortDirection === "desc" ? b.times - a.times : a.times - b.times;
    });
    
    // Apply limit if specified
    if (limit && limit > 0) {
      return sorted.slice(0, limit);
    }
    
    return sorted;
  }

  /**
   * Get tag frequency with caching
   */
  async getTagFrequency(
    images: LocalImageData[], 
    options: { sortDirection?: 'asc' | 'desc'; limit?: number } = {}
  ): Promise<TagFrequency[]> {
    try {
      const cacheKey = this.generateCacheKey(options);
      const { imageCount, totalTags } = await this.getDataStats(images);
      
      // Check if we have valid cached data
      const cachedEntry = this.cache.get(cacheKey);
      if (cachedEntry && this.isCacheValid(cachedEntry, imageCount, totalTags)) {
        logger.debug('Tag frequency cache hit', { cacheKey, imageCount, totalTags });
        return cachedEntry.tagFrequency;
      }
      
      // Calculate fresh data
      logger.debug('Tag frequency cache miss, calculating fresh data', { cacheKey, imageCount, totalTags });
      const tagFrequency = this.calculateTagFrequency(images);
      const sortedAndLimited = this.sortAndLimit(tagFrequency, options);
      
      // Cache the result
      this.cache.set(cacheKey, {
        tagFrequency: sortedAndLimited,
        lastUpdated: Date.now(),
        imageCount,
        totalTags
      });
      
      // Clean up old cache entries if needed
      this.cleanupCache();
      
      return sortedAndLimited;
    } catch (error) {
      logger.error('Error in getTagFrequency cache', { error });
      // Fallback to direct calculation
      const tagFrequency = this.calculateTagFrequency(images);
      return this.sortAndLimit(tagFrequency, options);
    }
  }

  /**
   * Invalidate cache when data changes
   */
  invalidateCache(): void {
    logger.debug('Invalidating tag frequency cache');
    this.cache.clear();
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) {
      return;
    }
    
    // Remove oldest entries
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastUpdated - b[1].lastUpdated);
    
    const toRemove = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => this.cache.delete(key));
    
    logger.debug('Cleaned up tag frequency cache', { 
      removed: toRemove.length, 
      remaining: this.cache.size 
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('Tag frequency cache cleared');
  }
}

// Export singleton instance
export const tagFrequencyCache = new TagFrequencyCache(); 