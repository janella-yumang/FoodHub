export interface StallSummary {

  _id: string;

  name: string;

  location: string;

  category: string;

  photoUrl?: string | null;

  isActive: boolean;

}



export interface MenuItemSummary {

  _id: string;

  name: string;

  price: number;

  category: string;

  isAvailable: boolean;

}



export interface ReviewSummary {

  averageRating: number;

  reviewCount: number;

}



export interface StallsResponse {

  stalls: StallSummary[];

}



const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";



async function request<T>(path: string, token?: string): Promise<T> {

  const headers: Record<string, string> = {};

  if (token) {

    headers["Authorization"] = `Bearer ${token}`;

  }



  const response = await fetch(`${apiBaseUrl}${path}`, { headers });



  if (!response.ok) {

    throw new Error(`Request failed with status ${response.status}`);

  }



  return response.json() as Promise<T>;

}



export async function fetchStalls(token?: string): Promise<StallSummary[]> {

  const result = await request<StallsResponse>("/stalls", token);

  return result.stalls;

}



export async function fetchStallDetails(

  stallId: string,

  token?: string

): Promise<{

  stall: StallSummary;

  menuItems: MenuItemSummary[];

  reviewSummary: ReviewSummary;

}> {

  return request(`/stalls/${stallId}`, token);

}