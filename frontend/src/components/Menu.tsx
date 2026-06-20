import { useEffect, useMemo, useState } from "react";
import { fetchStallDetails, type MenuItemSummary } from "../lib/api";

interface MenuProps {
  token: string;
  stallId: string;
  stallName: string;
  onBack: () => void;
}

export function Menu({ token, stallId, stallName, onBack }: MenuProps) {
  const [menuItems, setMenuItems] = useState<MenuItemSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMenu() {
      try {
        setIsLoading(true);
        const data = await fetchStallDetails(stallId, token);
        if (!active) {
          return;
        }
        setMenuItems(data.menuItems);
        if (data.menuItems.length > 0) {
          setSelectedCategory(data.menuItems[0].category);
        }
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally {
        setIsLoading(false);
      }
    }

    void loadMenu();

    return () => {
      active = false;
    };
  }, [stallId, token]);

  const categories = useMemo(() => {
    return Array.from(new Set(menuItems.map((item) => item.category)));
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (!selectedCategory) {
      return menuItems;
    }
    return menuItems.filter((item) => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  return (
    <div className="menu-container">
      <div className="menu-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>{stallName}</h1>
      </div>

      <div className="categories-row">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-button ${selectedCategory === category ? "active" : ""}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="menu-loading">Loading menu...</div>
      ) : error ? (
        <div className="menu-error">{error}</div>
      ) : filteredItems.length === 0 ? (
        <div className="menu-empty">No items available</div>
      ) : (
        <div className="menu-grid">
          {filteredItems.map((item) => (
            <div key={item._id} className="menu-item-card">
              <div className="item-image-placeholder" />
              <h3>{item.name}</h3>
              <p className="item-availability">
                Available: <strong>{item.isAvailable ? "Yes" : "No"}</strong>
              </p>
              <div className="item-footer">
                <span className="item-price">Rs. {item.price}</span>
                <button
                  className={`add-to-cart-button ${!item.isAvailable ? "disabled" : ""}`}
                  disabled={!item.isAvailable}
                >
                  Add to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
