import React, { useState, useEffect } from "react";
import { getTagFrequency, type TagFrequency as TagFrequencyType, type TagFrequencyOptions } from "../services/tagService";
import { BarChart3, TrendingUp, TrendingDown, Hash } from "lucide-react";

interface TagFrequencyProps {
  className?: string;
}

export const TagFrequency: React.FC<TagFrequencyProps> = ({ className = "" }) => {
  const [tagFrequency, setTagFrequency] = useState<TagFrequencyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [limit, setLimit] = useState<number>(20);

  const loadTagFrequency = async () => {
    setLoading(true);
    try {
      const options: TagFrequencyOptions = {
        sortDirection,
        limit
      };
      const data = await getTagFrequency(options);
      setTagFrequency(data);
    } catch (error) {
      console.error("Failed to load tag frequency:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTagFrequency();
  }, [sortDirection, limit]);

  const handleSortDirectionChange = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(Math.max(1, Math.min(100, newLimit)));
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Tag Frequency Statistics
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Limit:
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={limit}
              onChange={(e) => handleLimitChange(parseInt(e.target.value) || 20)}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              aria-label="Limit number of tags to display"
            />
          </div>
          <button
            onClick={handleSortDirectionChange}
            className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            {sortDirection === 'desc' ? (
              <>
                <TrendingDown className="w-4 h-4" />
                <span>Desc</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Asc</span>
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {tagFrequency.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tags found</p>
            </div>
          ) : (
            tagFrequency.map((tag, index) => (
              <div
                key={tag.name}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {tag.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {tag.times} {tag.times === 1 ? 'time' : 'times'}
                  </span>
                  <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (tag.times / Math.max(...tagFrequency.map(t => t.times))) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Total tags: {tagFrequency.length}</span>
          <span>
            Total occurrences: {tagFrequency.reduce((sum, tag) => sum + tag.times, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}; 