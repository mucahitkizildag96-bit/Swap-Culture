import { User, Item, SwapOffer, ChatMessage, Report, AppAnalytics } from "./types";

const API_BASE = "";

export async function login(paramsOrEmail: string | {
  email?: string;
  password?: string;
  loginMode?: "email" | "google" | "phone";
  phone?: string;
  username?: string;
  avatarUrl?: string;
  isRegister?: boolean;
}): Promise<User> {
  const body = typeof paramsOrEmail === "string" ? { email: paramsOrEmail } : paramsOrEmail;
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Giriş yapılamadı.");
  }
  const data = await res.json();
  return data.user;
}

export async function verifyPhone(userId: string, phone: string, code: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users/${userId}/verify-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Doğrulama başarısız oldu.");
  }
  const data = await res.json();
  return data.user;
}

export async function verifyFace(userId: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users/${userId}/verify-face`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Yüz doğrulaması başarısız oldu.");
  }
  const data = await res.json();
  return data.user;
}

export async function onboard(params: {
  userId: string;
  username: string;
  city: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<User> {
  const res = await fetch(`${API_BASE}/api/auth/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Profil güncellenemedi.");
  }
  const data = await res.json();
  return data.user;
}

export async function getUser(id: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users/${id}`);
  if (!res.ok) throw new Error("Kullanıcı bulunamadı.");
  const data = await res.json();
  return data.user;
}

export async function getAdminUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/api/admin/users`);
  const data = await res.json();
  return data.users;
}

export async function updateAdminUser(id: string, params: { isBlocked?: boolean; isVerified?: boolean }): Promise<User> {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  return data.user;
}

export async function getItems(): Promise<Item[]> {
  const res = await fetch(`${API_BASE}/api/items`);
  if (!res.ok) throw new Error("İlanlar alınamadı.");
  const data = await res.json();
  return data.items;
}

export async function createItem(params: {
  userId: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  targetSwap: string;
  city: string;
  imageUrl?: string;
  estimatedValue?: number;
}): Promise<Item> {
  const res = await fetch(`${API_BASE}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "İlan oluşturulamadı.");
  }
  const data = await res.json();
  return data.item;
}

export async function deleteItem(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/items/${id}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function reportItem(id: string, reporterId: string, reason: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/items/${id}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reporterId, reason }),
  });
  return res.ok;
}

export async function getSwaps(userId: string): Promise<SwapOffer[]> {
  const res = await fetch(`${API_BASE}/api/swaps?userId=${userId}`);
  if (!res.ok) throw new Error("Takaslar alınamadı.");
  const data = await res.json();
  return data.swaps;
}

export async function proposeSwap(params: {
  proposerId: string;
  proposerItemId: string;
  receiverId: string;
  receiverItemId: string;
  message?: string;
  monetaryType?: 'give' | 'take' | 'none';
  monetaryAmount?: number;
}): Promise<SwapOffer> {
  const res = await fetch(`${API_BASE}/api/swaps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Takas teklifi gönderilemedi.");
  }
  const data = await res.json();
  return data.swap;
}

export async function updateSwapStatus(id: string, status: string, updaterId: string): Promise<SwapOffer> {
  const res = await fetch(`${API_BASE}/api/swaps/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, updaterId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Takas durumu güncellenemedi.");
  }
  const data = await res.json();
  return data.swap;
}

export async function rateSwap(id: string, raterId: string, rating: number, comment?: string): Promise<SwapOffer> {
  const res = await fetch(`${API_BASE}/api/swaps/${id}/rate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raterId, rating, comment }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Puanlama yapılamadı.");
  }
  const data = await res.json();
  return data.swap;
}

export async function getChatMessages(swapId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/api/swaps/${swapId}/chat`);
  const data = await res.json();
  return data.messages;
}

export async function sendChatMessage(swapId: string, senderId: string, text: string, imageUrl?: string): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE}/api/swaps/${swapId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId, text, imageUrl }),
  });
  const data = await res.json();
  return data.message;
}

export async function getAdminReports(): Promise<Report[]> {
  const res = await fetch(`${API_BASE}/api/admin/reports`);
  const data = await res.json();
  return data.reports;
}

export async function resolveAdminReport(id: string, action: "delete_item" | "dismiss"): Promise<Report[]> {
  const res = await fetch(`${API_BASE}/api/admin/reports/${id}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const data = await res.json();
  return data.reports;
}

export async function getAdminAnalytics(): Promise<AppAnalytics> {
  const res = await fetch(`${API_BASE}/api/admin/analytics`);
  const data = await res.json();
  return data.analytics;
}

// Simple dynamic background images for items
export const SAMPLE_PRODUCTS = [
  { title: "Bilgisayar", url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600" },
  { title: "Kulaklık", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" },
  { title: "Saat", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600" },
  { title: "Ayakkabı", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600" },
  { title: "Kitap", url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600" },
  { title: "Telefon", url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600" },
];

export function formatDisplayName(username: string): string {
  if (!username) return "";
  // Check if it's already structured or if it's a typical username under_score / dot split
  // Let's split by common separators.
  const parts = username.split(/[\s_.-]+/).filter(Boolean);
  if (parts.length === 0) return username;
  if (parts.length === 1) {
    const word = parts[0];
    // Capitalize first, dot the rest if too long, or capitalize cleanly
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  
  // E.g., mucahit_kizildag -> Mucahit K.
  const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const last = parts[parts.length - 1];
  const lastInitial = last.charAt(0).toUpperCase() + ".";
  return `${first} ${lastInitial}`;
}

export async function deleteAccount(userId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: "DELETE"
  });
  return res.ok;
}
