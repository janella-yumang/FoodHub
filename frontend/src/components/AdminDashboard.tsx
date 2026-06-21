import { useEffect, useState } from "react";
import {
  type AdminCategoryItem,
  type AdminStallItem,
  type AdminUserItem,
  createAdminCategory,
  createAdminMenuItem,
  createAdminStall,
  deleteAdminCategory,
  deleteAdminStall,
  fetchAdminCategories,
  fetchAdminStalls,
  fetchAdminUsers,
  updateAdminCategory,
  updateAdminMenuItem,
  updateAdminStall,
  updateAdminUser
} from "../lib/adminApi";

interface AdminDashboardProps {
  token: string;
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

export function AdminDashboard({ token }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"users" | "stalls" | "categories" | "products">("users");
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stalls, setStalls] = useState<AdminStallItem[]>([]);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Partial<AdminUserItem>>({ name: "", email: "", role: "user", isActive: true });
  const [stallForm, setStallForm] = useState(() => ({ ...emptyStall }));
  const [categoryForm, setCategoryForm] = useState(() => ({ ...emptyCategory }));
  const [menuItemForm, setMenuItemForm] = useState(() => ({ ...emptyMenuItem }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadData() {
    try {
      const [userData, stallData, categoryData] = await Promise.all([
        fetchAdminUsers(token),
        fetchAdminStalls(token),
        fetchAdminCategories(token)
      ]);
      setUsers(userData);
      setStalls(stallData);
      setCategories(categoryData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
    }
  }

  useEffect(() => {
    void loadData();
  }, [token]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const saveUser = async () => {
    setIsSaving(true);
    try {
      if (selectedUserId) {
        const result = await updateAdminUser(token, selectedUserId, userForm);
        setUsers((prev) => prev.map((user) => (user._id === result.user._id ? result.user : user)));
        showSuccess("User updated successfully");
        setSelectedUserId(null);
        setUserForm({ name: "", email: "", role: "user", isActive: true });
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setIsSaving(false);
    }
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

  const saveCategory = async () => {
    setIsSaving(true);
    try {
      if (selectedCategoryId) {
        const result = await updateAdminCategory(token, selectedCategoryId, categoryForm);
        setCategories((prev) => prev.map((category) => (category._id === result.category._id ? result.category : category)));
        showSuccess("Category updated successfully");
      } else {
        const result = await createAdminCategory(token, categoryForm);
        setCategories((prev) => [...prev, result.category]);
        showSuccess("Category created successfully");
      }
      setSelectedCategoryId(null);
      setCategoryForm({ ...emptyCategory });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category.");
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
            <h1>Admin Dashboard</h1>
            <p>Manage stalls, categories, and menu items</p>
          </div>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
          <span>👥</span> Users
        </button>
        <button className={`tab-btn ${activeTab === "stalls" ? "active" : ""}`} onClick={() => setActiveTab("stalls")}>
          <span>🏪</span> Stalls
        </button>
        <button className={`tab-btn ${activeTab === "categories" ? "active" : ""}`} onClick={() => setActiveTab("categories")}>
          <span>🏷️</span> Categories
        </button>
        <button className={`tab-btn ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")}>
          <span>🍜</span> Products
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "users" && (
          <div className="admin-section">
            <div className="admin-list-panel">
              <div className="panel-title">
                <h2>Users</h2>
              </div>
              <ul className="item-list">
                {users.length === 0 ? (
                  <li className="empty-state">No users found</li>
                ) : (
                  users.map((user) => (
                    <li key={user._id} className="item-row">
                      <div className="item-info">
                        <div className="item-name">{user.name}</div>
                        <div className="item-meta">{user.email}</div>
                      </div>
                      <div className="item-actions">
                        <button className="btn-sm btn-edit" onClick={() => { setSelectedUserId(user._id); setUserForm({ ...user }); }}>
                          Edit
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="admin-form-panel">
              <h3>{selectedUserId ? "Edit User" : "Select a user to edit"}</h3>
              {selectedUserId && (
                <form className="form-grid" onSubmit={(e) => { e.preventDefault(); void saveUser(); }}>
                  <div className="form-group full-width">
                    <label>Name</label>
                    <input value={userForm.name ?? ""} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} disabled />
                  </div>
                  <div className="form-group full-width">
                    <label>Email</label>
                    <input value={userForm.email ?? ""} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} disabled />
                  </div>
                  <div className="form-group">
                    <label>Role *</label>
                    <select value={userForm.role ?? "user"} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as "user" | "vendor" | "admin" })} required>
                      <option value="user">User</option>
                      <option value="vendor">Vendor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group checkbox">
                    <label>
                      <input type="checkbox" checked={userForm.isActive ?? true} onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })} />
                      Active
                    </label>
                  </div>
                  <button type="submit" className="btn-primary full-width" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Update User"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === "stalls" && (
          <div className="admin-section">
            <div className="admin-list-panel">
              <div className="panel-title">
                <h2>Stalls</h2>
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
                        <div className="item-meta">{stall.location}</div>
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
                    Active
                  </label>
                </div>
                <button type="submit" className="btn-primary full-width" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Stall"}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="admin-section">
            <div className="admin-list-panel">
              <div className="panel-title">
                <h2>Categories</h2>
                <button className="btn-primary" onClick={() => { setSelectedCategoryId(null); setCategoryForm({ ...emptyCategory }); }}>
                  + New Category
                </button>
              </div>
              <ul className="item-list">
                {categories.length === 0 ? (
                  <li className="empty-state">No categories yet</li>
                ) : (
                  categories.map((category) => (
                    <li key={category._id} className="item-row">
                      <div className="item-info">
                        <div className="item-name">{category.name}</div>
                        <div className="item-meta">{category.description}</div>
                      </div>
                      <div className="item-actions">
                        <button className="btn-sm btn-edit" onClick={() => { setSelectedCategoryId(category._id); setCategoryForm({ ...category }); }}>
                          Edit
                        </button>
                        <button className="btn-sm btn-danger" onClick={() => void deleteCategory(category._id)}>
                          Delete
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="admin-form-panel">
              <h3>{selectedCategoryId ? "Edit Category" : "Create New Category"}</h3>
              <form className="form-grid" onSubmit={(e) => { e.preventDefault(); void saveCategory(); }}>
                <div className="form-group full-width">
                  <label>Category Name *</label>
                  <input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={3} />
                </div>
                <button type="submit" className="btn-primary full-width" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Category"}
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

