import { useState, useEffect, useRef } from "react";

interface SearchBarProps<T> {
  fetchFn: (query: string) => Promise<T[]>;
  onSelect: (item: T) => void;
  getKey: (item: T) => number | string;
  placeholder?: string;
  renderSuggestion: (item: T) => React.ReactNode;
}

function SearchBar<T>({
  fetchFn,
  onSelect,
  getKey,
  placeholder = "Search...",
  renderSuggestion,
}: SearchBarProps<T>) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      try {
        const results = await fetchFn(query);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [query, fetchFn]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        } else if (suggestions.length === 1) {
          handleSelect(suggestions[0]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.trim().length >= 2 && setIsOpen(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((item, idx) => (
            <li
              key={getKey(item)}
              onClick={() => handleSelect(item)}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                idx === selectedIndex ? "bg-blue-100" : ""
              }`}
            >
              {renderSuggestion(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;