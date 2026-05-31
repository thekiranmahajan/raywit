"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void;
}

interface Gif {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
    };
  };
}

const GifPicker: React.FC<GifPickerProps> = ({ onGifSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Get API key from environment - for demo purposes using a public key
  // In production, you should use your own Giphy API key
  const GIPHY_API_KEY =
    process.env.NEXT_PUBLIC_GIPHY_API_KEY || "gi09c5BQicgEYVWNuAS3nKEYXp6P8HQ5";

  // Fetch trending GIFs on mount
  useEffect(() => {
    fetchTrendingGifs();
  }, []);

  const fetchTrendingGifs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=r`,
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error("Error fetching trending GIFs:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchTrendingGifs();
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
          query,
        )}&limit=24&rating=r`,
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error("Error searching GIFs:", error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchGifs(query);
  };

  const handleGifClick = (gif: Gif) => {
    // Use the fixed height URL for consistent sizing
    onGifSelect(gif.images.fixed_height.url);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-3 w-80 max-h-96 flex flex-col">
      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search GIFs..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {searchLoading && (
          <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* GIFs Grid */}
      <div className="flex-1 overflow-y-auto">
        {loading && !gifs.length ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => handleGifClick(gif)}
                className="relative group overflow-hidden rounded-md transition-transform hover:scale-105"
                title={gif.title}
              >
                <img
                  src={gif.images.fixed_height.url}
                  alt={gif.title}
                  className="w-full h-24 object-cover group-hover:opacity-75 transition-opacity"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity rounded-md" />
              </button>
            ))}
          </div>
        )}

        {!loading && gifs.length === 0 && searchQuery && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No GIFs found for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Powered by Giphy */}
      <div className="text-xs text-gray-400 dark:text-gray-600 text-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        Powered by <span className="font-semibold">GIPHY</span>
      </div>
    </div>
  );
};

export default GifPicker;
