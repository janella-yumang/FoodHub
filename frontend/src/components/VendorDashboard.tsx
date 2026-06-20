import { useEffect, useState } from "react";
import {
  type AdminCategoryItem,
  type AdminStallItem,
  createAdminCategory,
  createAdminMenuItem,
  createAdminStall,
  deleteAdminCategory,
  deleteAdminStall,
  fetchAdminCategories,
  fetchAdminStalls,
  updateAdminCategory,
  updateAdminMenuItem,
  updateAdminStall
} from "../lib/adminApi";

interface VendorDashboardProps {
  token: string;
  userId: string;
}

const emptyStall = {
  name: "",
  location: "",
  category: "general",
  description: "",
  section: "",
  openingHours: "",
  photoUrl: "",
  isActive: true
};

const emptyCategory = {
  name: "",
  description: ""
};

const emptyMenuItem = {
  name: "",
  description: "",
  price: 0,
  category: "general",
  ingredients: "",
  allergens: "",
  calories: 0,
  proteinGrams: 0,
  carbsGrams: 0,
  fatGrams: 0,
  sodiumMilligrams: 0,
  isAvailable: true,
  isFeatured: false
};

export function VendorDashboard({ token, userId }: VendorDashboardProps) {
  const [activeTab, setActiveTab] = useState<"stalls" | "products">("stalls");
  const [stalls, setStalls] = useState<AdminStallItem[]>([]);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [stallForm, setStallForm] = useState(() => ({ ...emptyStall }));
  const [menuItemForm, setMenuItemForm] = useState(() => ({ ...emptyMenuItem }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadData() {
    try {
      const [stallData, categoryData] = await Promise.all([
        fetchAdminStalls(token),
        fetchAdminCategories(token)
      ]);
      // Filter stalls by vendor
      setStalls(stallData);
      setCategories(categoryData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendor data.");
    }
  }

  useEffect(() => {
    void loadData();
  }, [token]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const saveStall = async () => {
    setIsSaving(true);
    try {
      if (selectedStallId) {
        const result = await updateAdminStall(token, selectedStallId, stallForm);
        setStalls((prev) => prev.map((stall) => (stall._id === result.stall._id ? result.stall : stall)));
        showSuccess("Stall updated successfully");
      } else {
        const result = await createAdminStall(token, stallForm);
        setStalls((prev) => [...prev, result.stall]);
        showSuccess("Stall created successfully");
      }
      setSelectedStallId(null);
      setStallForm({ ...emptyStall });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save stall.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveMenuItem = async () => {
    setIsSaving(true);
    try {
      if (!selectedStallId && stalls.length > 0) {
        setError("Select a stall first to add a product.");
        return;
      }

      const submission = {
        name: menuItemForm.name,
        description: menuItemForm.description,
        price: Number(menuItemForm.price),
        category: menuItemForm.category,
        ingredients: menuItemForm.ingredients.split(",").map((item) => item.trim()).filter(Boolean),
        allergens: menuItemForm.allergens.split(",").map((item) => item.trim()).filter(Boolean),
        nutrition: {
          calories: Number(menuItemForm.calories) || 0,
          proteinGrams: Number(menuItemForm.proteinGrams) || 0,
          carbsGrams: Number(menuItemForm.carbsGrams) || 0,
          fatGrams: Number(menuItemForm.fatGrams) || 0,
          sodiumMilligrams: Number(menuItemForm.sodiumMilligrams) || 0
        },
        isAvailable: menuItemForm.isAvailable,
        isFeatured: menuItemForm.isFeatured
      };

      if (selectedProductId) {
        await updateAdminMenuItem(token, selectedProductId, submission);
        showSuccess("Product updated successfully");
      } else {
        if (!selectedStallId) {
          throw new Error("Select a stall before adding products.");
        }
        await createAdminMenuItem(token, selectedStallId, submission);
        showSuccess("Product created successfully");
      }
      setSelectedProductId(null);
      setMenuItemForm({ ...emptyMenuItem });
      setError(null);
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteStall = async (stallId: string) => {
    if (!window.confirm("Delete this stall? This action cannot be undone.")) return;
    try {
      await deleteAdminStall(token, stallId);
      setStalls((prev) => prev.filter((s) => s._id !== stallId));
      showSuccess("Stall deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete stall.");
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await deleteAdminCategory(token, categoryId);
      setCategories((prev) => prev.filter((c) => c._id !== categoryId));
      showSuccess("Category deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category.");
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>Vendor Dashboard</h1>
            <p>Manage your stalls and menu items</p>
          </div>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === "stalls" ? "active" : ""}`} onClick={() => setActiveTab("stalls")}>
          <span>🏪</span> My Stalls
        </button>
        <button className={`tab-btn ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")}>
          <span>🍜</span> Products
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "stalls" && (
          <div className="admin-section">
            <div className="admin-list-panel">
              <div className="panel-title">
                <h2>Your Stalls</h2>
                <button className="btn-primary" onClick={() => { setSelectedStallId(null); setStallForm({ ...emptyStall }); }}>
                  + New Stall
                </button>
              </div>
              <ul className="item-list">
                {stalls.length === 0 ? (
                  <li className="empty-state">No stalls yet</li>
                ) : (
                  stalls.map((stall) => (
                    <li key={stall._id} className="item-row">
                      <div className="item-info">
                        <div className="item-name">{stall.name}</div>
                        <div className="item-meta">{stall.location} {stall.isActive ? "🟢" : "🔴"}</div>
                      </div>
                      <div className="item-actions">
                        <button className="btn-sm btn-edit" onClick={() => { 
                          setSelectedStallId(stall._id);
                          setStallForm({
                            name: stall.name,
                            location: stall.location,
                            category: stall.category,
                            description: stall.description,
                            section: stall.section,
                            openingHours: stall.openingHours,
                            photoUrl: stall.photoUrl ?? "",
                            isActive: stall.isActive
                          });
                        }}>
                          Edit
                        </button>
                        <button className="btn-sm btn-danger" onClick={() => void deleteStall(stall._id)}>
                          Delete
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="admin-form-panel">
              <h3>{selectedStallId ? "Edit Stall" : "Create New Stall"}</h3>
              <form className="form-grid" onSubmit={(e) => { e.preventDefault(); void saveStall(); }}>
                <div className="form-group">
                  <label>Name *</label>
                  <input value={stallForm.name} onChange={(e) => setStallForm({ ...stallForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input value={stallForm.location} onChange={(e) => setStallForm({ ...stallForm, location: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input value={stallForm.category} onChange={(e) => setStallForm({ ...stallForm, category: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Section</label>
                  <input value={stallForm.section} onChange={(e) => setStallForm({ ...stallForm, section: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea value={stallForm.description} onChange={(e) => setStallForm({ ...stallForm, description: e.target.value })} rows={3} />
                </div>
                <div className="form-group">
                  <label>Opening Hours</label>
                  <input value={stallForm.openingHours} onChange={(e) => setStallForm({ ...stallForm, openingHours: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Photo URL</label>
                  <input value={stallForm.photoUrl ?? ""} onChange={(e) => setStallForm({ ...stallForm, photoUrl: e.target.value })} />
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input type="checkbox" checked={stallForm.isActive} onChange={(e) => setStallForm({ ...stallForm, isActive: e.target.checked })} />
                    Active (Visible to customers)
                  </label>
                </div>
                <button type="submit" className="btn-primary full-width" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Stall"}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="admin-section">
            <div className="admin-list-panel">
              <div className="panel-title">
                <h2>Menu Items</h2>
                <button className="btn-primary" onClick={() => { setSelectedProductId(null); setMenuItemForm({ ...emptyMenuItem }); }}>
                  + New Item
                </button>
              </div>
              <div className="stall-selector">
                <label>Select Stall:</label>
                <select value={selectedStallId ?? ""} onChange={(e) => setSelectedStallId(e.target.value || null)}>
                  <option value="">All Stalls</option>
                  {stalls.map((stall) => (
                    <option key={stall._id} value={stall._id}>
                      {stall.name}
                    </option>
                  ))}
                </select>
              </div>
              <ul className="item-list">
                {stalls.length === 0 ? (
                  <li className="empty-state">Create a stall first</li>
                ) : (
                  <li className="empty-state">Select a stall to view products</li>
                )}
              </ul>
            </div>

            <div className="admin-form-panel">
              <h3>{selectedProductId ? "Edit Product" : "Create New Product"}</h3>
              <form className="form-grid" onSubmit={(e) => { e.preventDefault(); void saveMenuItem(); }}>
                <div className="form-group full-width">
                  <label>Stall *</label>
                  <select value={selectedStallId ?? ""} onChange={(e) => setSelectedStallId(e.target.value)} required>
                    <option value="">Select a stall</option>
                    {stalls.map((stall) => (
                      <option key={stall._id} value={stall._id}>
                        {stall.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input value={menuItemForm.name} onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Price *</label>
                  <input type="number" value={menuItemForm.price} onChange={(e) => setMenuItemForm({ ...menuItemForm, price: Number(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input value={menuItemForm.category} onChange={(e) => setMenuItemForm({ ...menuItemForm, category: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea value={menuItemForm.description} onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })} rows={2} />
                </div>
                <div className="form-group full-width">
                  <label>Ingredients (comma separated)</label>
                  <input value={menuItemForm.ingredients} onChange={(e) => setMenuItemForm({ ...menuItemForm, ingredients: e.target.value })} placeholder="e.g., flour, sugar, eggs" />
                </div>
                <div className="form-group full-width">
                  <label>Allergens (comma separated)</label>
                  <input value={menuItemForm.allergens} onChange={(e) => setMenuItemForm({ ...menuItemForm, allergens: e.target.value })} placeholder="e.g., peanuts, gluten" />
                </div>
                <fieldset className="nutrition-section full-width">
                  <legend>Nutritional Info (per serving)</legend>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Calories</label>
                      <input type="number" value={menuItemForm.calories} onChange={(e) => setMenuItemForm({ ...menuItemForm, calories: Number(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Protein (g)</label>
                      <input type="number" value={menuItemForm.proteinGrams} onChange={(e) => setMenuItemForm({ ...menuItemForm, proteinGrams: Number(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Carbs (g)</label>
                      <input type="number" value={menuItemForm.carbsGrams} onChange={(e) => setMenuItemForm({ ...menuItemForm, carbsGrams: Number(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Fat (g)</label>
                      <input type="number" value={menuItemForm.fatGrams} onChange={(e) => setMenuItemForm({ ...menuItemForm, fatGrams: Number(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Sodium (mg)</label>
                      <input type="number" value={menuItemForm.sodiumMilligrams} onChange={(e) => setMenuItemForm({ ...menuItemForm, sodiumMilligrams: Number(e.target.value) })} />
                    </div>
                  </div>
                </fieldset>
                <div className="form-group checkbox">
                  <label>
                    <input type="checkbox" checked={menuItemForm.isAvailable} onChange={(e) => setMenuItemForm({ ...menuItemForm, isAvailable: e.target.checked })} />
                    Available
                  </label>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input type="checkbox" checked={menuItemForm.isFeatured} onChange={(e) => setMenuItemForm({ ...menuItemForm, isFeatured: e.target.checked })} />
                    Featured
                  </label>
                </div>
                <button type="submit" className="btn-primary full-width" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Product"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
