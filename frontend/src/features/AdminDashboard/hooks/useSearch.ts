import { useState, useRef } from "react";

interface UseSearchOptions<T> {
  fetchFn: (query: string) => Promise<T[]>;
  debounceMs?: number;
}

export const useSearch = <T>({ fetchFn, debounceMs = 300 }: UseSearchOptions<T>) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: string) => {
    setQuery(value);
    setError("");

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await fetchFn(value.trim());
        setSuggestions(results);
        setOpen(true);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Search failed");
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  };

  const handleSelect = () => {
    setSuggestions([]);
    setOpen(false);
  };

  const reset = () => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    setError("");
  };

  return {
    query,
    suggestions,
    loading,
    error,
    open,
    setOpen,
    setQuery,
    handleChange,
    handleSelect,
    reset,
  };
};