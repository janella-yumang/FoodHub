import { useEffect, useMemo, useState } from "react";
import { fetchStalls, type StallSummary } from "../lib/api";

interface StallPickerProps {
  token: string;
  onSelectStall: (stallId: string, stallName: string) => void;
}

export function StallPicker({ token, onSelectStall }: StallPickerProps) {
  const [stalls, setStalls] = useState<StallSummary[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStalls() {
      try {
        setIsLoading(true);
        const result = await fetchStalls(token);
        if (!active) {
          return;
        }
        setStalls(result);
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load stalls");
      } finally {
        setIsLoading(false);
      }
    }

    void loadStalls();

    return () => {
      active = false;
    };
  }, [token]);

  const filteredStalls = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return stalls;
    }

    return stalls.filter((stall) => {
      return [stall.name, stall.location, stall.category].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, stalls]);

  return (
    <div className="stall-picker-container">
      <div className="stall-picker-header">
        <h1>Select a Stall</h1>
        <p>Choose where you'd like to order from</p>
      </div>

      <div className="stall-search-section">
        <input
          type="text"
          placeholder="Search stalls..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="stall-search-input"
        />
      </div>

      {isLoading ? (
        <div className="stall-picker-loading">Loading stalls...</div>
      ) : error ? (
        <div className="stall-picker-error">{error}</div>
      ) : filteredStalls.length === 0 ? (
        <div className="stall-picker-empty">No stalls available</div>
      ) : (
        <div className="stalls-grid">
          {filteredStalls.map((stall) => (
            <button
              key={stall._id}
              className="stall-picker-card"
              onClick={() => onSelectStall(stall._id, stall.name)}
            >
              <div className="stall-picker-badge">{stall.category}</div>
              <h3>{stall.name}</h3>
              <p className="stall-location">{stall.location}</p>
              <span className={`stall-status ${stall.isActive ? "open" : "closed"}`}>
                {stall.isActive ? "Open" : "Closed"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
