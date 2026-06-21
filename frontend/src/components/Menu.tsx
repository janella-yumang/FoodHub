import { useEffect, useMemo, useState } from "react";
import { fetchStallDetails, type MenuItemSummary, type StallSummary } from "../lib/api";

interface MenuProps {
  token: string;
  stallId: string;
  stallName: string;
  onBack: () => void;
}

export function Menu({ token, stallId, stallName, onBack }: MenuProps) {
  const [menuItems, setMenuItems] = useState<MenuItemSummary[]>([]);
  const [stall, setStall] = useState<StallSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Modal state for viewing details
  const [selectedItem, setSelectedItem] = useState<MenuItemSummary | null>(null);

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
        setStall(data.stall);
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

      {stall && (
        <div className="menu-stall-detail-card">
          <div className="menu-stall-detail-image-wrapper">
            {stall.photoUrl ? (
              <img src={stall.photoUrl} alt={stall.name} className="menu-stall-detail-image" />
            ) : (
              <div className="menu-stall-detail-placeholder">🏪</div>
            )}
          </div>
          <div className="menu-stall-detail-info">
            <div className="menu-stall-detail-badge">{stall.category || "General"}</div>
            <h2>{stall.name}</h2>
            {stall.description && <p className="menu-stall-detail-desc">{stall.description}</p>}
            
            <div className="menu-stall-detail-meta">
              <span className="meta-item">📍 <strong>Location:</strong> {stall.location}</span>
              {stall.openingHours && (
                <span className="meta-item">⏰ <strong>Opening Hours:</strong> {stall.openingHours}</span>
              )}
              {typeof stall.vendorId === "object" && stall.vendorId && (
                <span className="meta-item">
                  👤 <strong>Owner:</strong> {stall.vendorId.name} ({stall.vendorId.email})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

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
              {item.photoUrl ? (
                <img 
                  src={item.photoUrl} 
                  alt={item.name} 
                  className="menu-item-image" 
                  style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "6px 6px 0 0" }} 
                />
              ) : (
                <div className="item-image-placeholder" />
              )}
              <h3>{item.name}</h3>
              <p className="item-availability">
                Available: <strong>{item.isAvailable ? "Yes" : "No"}</strong>
              </p>
              
              <div className="item-footer" style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span className="item-price" style={{ fontWeight: "bold", fontSize: "16px", color: "#008080" }}>
                    Rs. {item.price}
                  </span>
                  <button
                    type="button"
                    className="btn-view-details-inline"
                    onClick={() => setSelectedItem(item)}
                  >
                    👁️ View Details
                  </button>
                </div>
                <button
                  className={`add-to-cart-button ${!item.isAvailable ? "disabled" : ""}`}
                  disabled={!item.isAvailable}
                  style={{ width: "100%" }}
                >
                  Add to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details View Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content info-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>🍜 Product Information</h3>
              <button className="close-btn" onClick={() => setSelectedItem(null)}>&times;</button>
            </div>
            
            <div className="info-modal-body" style={{ padding: "20px 0" }}>
              {selectedItem.photoUrl && (
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <img 
                    src={selectedItem.photoUrl} 
                    alt={selectedItem.name} 
                    style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px", objectFit: "cover" }} 
                  />
                </div>
              )}
              
              <h2 style={{ margin: "0 0 10px 0", color: "#8B0000" }}>{selectedItem.name}</h2>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#008080", marginBottom: "16px" }}>
                Price: Rs. {selectedItem.price}
              </div>
              
              <div style={{ marginBottom: "16px" }}>
                <strong style={{ display: "block", marginBottom: "4px", color: "#333" }}>Description:</strong>
                <p style={{ margin: 0, color: "#666", fontSize: "14px", lineHeight: "1.5" }}>
                  {selectedItem.description || "No description available for this item."}
                </p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong style={{ display: "block", marginBottom: "6px", color: "#333" }}>🌾 Ingredients:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selectedItem.ingredients && selectedItem.ingredients.length > 0 ? (
                    selectedItem.ingredients.map((ing: string, idx: number) => (
                      <span 
                        key={idx} 
                        style={{ background: "#e0f2f1", color: "#00796b", padding: "3px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 500 }}
                      >
                        {ing.trim()}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "#888", fontSize: "13px" }}>No ingredients listed</span>
                  )}
                </div>
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <strong style={{ display: "block", marginBottom: "6px", color: "#333" }}>⚠️ Allergens:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selectedItem.allergens && selectedItem.allergens.length > 0 ? (
                    selectedItem.allergens.map((all: string, idx: number) => (
                      <span 
                        key={idx} 
                        style={{ background: "#ffebee", color: "#c62828", padding: "3px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 500 }}
                      >
                        {all.trim()}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "#2e7d32", background: "#e8f5e9", padding: "3px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 500 }}>
                      No allergens detected
                    </span>
                  )}
                </div>
              </div>

              <fieldset className="nutrition-fieldset" style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "12px 16px" }}>
                <legend style={{ padding: "0 8px", fontWeight: "bold", color: "#008080" }}>🍎 Nutritional Facts</legend>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", textAlign: "center" }}>
                  <div style={{ background: "#fcfcfc", padding: "6px", borderRadius: "4px", border: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase" }}>Calories</div>
                    <strong style={{ fontSize: "14px", color: "#333", display: "block", marginTop: "4px" }}>
                      {selectedItem.nutrition?.calories ?? "0"} kcal
                    </strong>
                  </div>
                  <div style={{ background: "#fcfcfc", padding: "6px", borderRadius: "4px", border: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase" }}>Protein</div>
                    <strong style={{ fontSize: "14px", color: "#333", display: "block", marginTop: "4px" }}>
                      {selectedItem.nutrition?.proteinGrams ?? "0"}g
                    </strong>
                  </div>
                  <div style={{ background: "#fcfcfc", padding: "6px", borderRadius: "4px", border: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase" }}>Carbs</div>
                    <strong style={{ fontSize: "14px", color: "#333", display: "block", marginTop: "4px" }}>
                      {selectedItem.nutrition?.carbsGrams ?? "0"}g
                    </strong>
                  </div>
                  <div style={{ background: "#fcfcfc", padding: "6px", borderRadius: "4px", border: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase" }}>Fat</div>
                    <strong style={{ fontSize: "14px", color: "#333", display: "block", marginTop: "4px" }}>
                      {selectedItem.nutrition?.fatGrams ?? "0"}g
                    </strong>
                  </div>
                  <div style={{ background: "#fcfcfc", padding: "6px", borderRadius: "4px", border: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase" }}>Sodium</div>
                    <strong style={{ fontSize: "14px", color: "#333", display: "block", marginTop: "4px" }}>
                      {selectedItem.nutrition?.sodiumMilligrams ?? "0"}mg
                    </strong>
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="modal-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setSelectedItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
