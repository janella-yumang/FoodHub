const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export interface AdminStallItem {
  _id: string;
  name: string;
  location: string;
  category: string;
  description: string;
  section: string;
  openingHours: string;
  photoUrl?: string | null;
  isActive: boolean;
}

export interface AdminMenuItem {
  _id: string;
  stallId: string;
  name: string;
  description: string;
  allergens: string[];
  ingredients: string[];
  nutrition: {
    calories?: number | null;
    proteinGrams?: number | null;
    carbsGrams?: number | null;
    fatGrams?: number | null;
    sodiumMilligrams?: number | null;
  };
  price: number;
  category: string;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface AdminCategoryItem {
  _id: string;
  name: string;
  description: string;
}

export async function fetchAdminStalls(token: string): Promise<AdminStallItem[]> {
  const result = await request<{ stalls: AdminStallItem[] }>("/stalls", {}, token);
  return result.stalls;
}

export async function fetchVendorStalls(token: string): Promise<AdminStallItem[]> {
  const result = await request<{ stalls: AdminStallItem[] }>("/stalls/vendor/my", {}, token);
  return result.stalls;
}

export async function createAdminStall(token: string, input: Partial<AdminStallItem>) {
  return request<{ stall: AdminStallItem }>("/stalls", {
    method: "POST",
    body: JSON.stringify(input)
  }, token);
}

export async function updateAdminStall(token: string, stallId: string, input: Partial<AdminStallItem>) {
  return request<{ stall: AdminStallItem }>(`/stalls/${stallId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  }, token);
}

export async function deleteAdminStall(token: string, stallId: string) {
  return request<void>(`/stalls/${stallId}`, { method: "DELETE" }, token);
}

export async function fetchAdminCategories(token: string): Promise<AdminCategoryItem[]> {
  const result = await request<{ categories: AdminCategoryItem[] }>("/categories", {}, token);
  return result.categories;
}

export async function createAdminCategory(token: string, input: Partial<AdminCategoryItem>) {
  return request<{ category: AdminCategoryItem }>("/categories", {
    method: "POST",
    body: JSON.stringify(input)
  }, token);
}

export async function updateAdminCategory(token: string, categoryId: string, input: Partial<AdminCategoryItem>) {
  return request<{ category: AdminCategoryItem }>(`/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  }, token);
}

export async function deleteAdminCategory(token: string, categoryId: string) {
  return request<void>(`/categories/${categoryId}`, { method: "DELETE" }, token);
}

export async function fetchAdminStallMenuItems(token: string, stallId: string) {
  const result = await request<{ menuItems: AdminMenuItem[] }>(`/stalls/${stallId}/menu-items`, {}, token);
  return result.menuItems;
}

export async function createAdminMenuItem(token: string, stallId: string, input: Partial<AdminMenuItem>) {
  return request<{ menuItem: AdminMenuItem }>(`/stalls/${stallId}/menu-items`, {
    method: "POST",
    body: JSON.stringify(input)
  }, token);
}

export async function updateAdminMenuItem(token: string, menuItemId: string, input: Partial<AdminMenuItem>) {
  return request<{ menuItem: AdminMenuItem }>(`/stalls/menu-items/${menuItemId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  }, token);
}

export async function deleteAdminMenuItem(token: string, menuItemId: string) {
  return request<void>(`/stalls/menu-items/${menuItemId}`, { method: "DELETE" }, token);
}

export interface AdminUserItem {
  _id: string;
  name: string;
  email: string;
  role: "user" | "vendor" | "admin";
  isActive: boolean;
}

export async function fetchAdminUsers(token: string): Promise<AdminUserItem[]> {
  const result = await request<{ users: AdminUserItem[] }>("/users", {}, token);
  return result.users;
}

export async function updateAdminUser(token: string, userId: string, input: Partial<AdminUserItem>) {
  return request<{ user: AdminUserItem }>(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  }, token);
}
