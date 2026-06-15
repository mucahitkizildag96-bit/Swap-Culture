import { User, Item, SwapOffer, ChatMessage, Report, AppAnalytics } from "./types";
import { supabase, isSupabaseConfigured } from "./utils/supabase";

const API_BASE = "";

// -----------------------------------------------------------------------------
// LOCAL DB SEED & HELPERS (Offline Fallback & Dev Mock State)
// -----------------------------------------------------------------------------

const INITIAL_USERS: User[] = [
  {
    id: "u1_mucahit",
    email: "mucahitkizildag96@gmail.com",
    username: "mucahit_takas",
    city: "İstanbul",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    rating: 4.9,
    ratingCount: 15,
    completedSwaps: 12,
    bio: "Teknoloji meraklısı, dürüst takasçı. İstanbul içi elden teslim takas yapabilirim.",
    isVerified: true,
    isBlocked: false,
    isAdmin: true,
    createdAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "u2_elif",
    email: "elif98@gmail.com",
    username: "elif_kitap_hobi",
    city: "Eskişehir",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    rating: 4.8,
    ratingCount: 22,
    completedSwaps: 18,
    bio: "Kitap, retro aksesuarlar ve hobi ürünleri takaslamayı seviyorum. PTT kargo ile gönderim yaparım.",
    isVerified: true,
    isBlocked: false,
    isAdmin: false,
    createdAt: "2026-02-15T00:00:00.000Z",
  },
  {
    id: "u3_can",
    email: "can_demir@gmail.com",
    username: "can_motor_spor",
    city: "İzmir",
    avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&auto=format&fit=crop&q=80",
    rating: 4.2,
    ratingCount: 5,
    completedSwaps: 4,
    bio: "Kamp ekipmanları, outdoor ve spor ürünleri takas tekliflerine açığım.",
    isVerified: false,
    isBlocked: false,
    isAdmin: false,
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "u4_zeynep",
    email: "zeynep_kaya@gmail.com",
    username: "zeynep_vintage",
    city: "Ankara",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    rating: 4.7,
    ratingCount: 8,
    completedSwaps: 6,
    bio: "Vintage giysiler ve aksesuarlar. Ankara Bahçelievler elden teslim önceliklidir.",
    isVerified: true,
    isBlocked: false,
    isAdmin: false,
    createdAt: "2026-03-12T00:00:00.000Z",
  },
  {
    id: "u5_burak",
    email: "burak_arslan@gmail.com",
    username: "burak_gamer",
    city: "Bursa",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    rating: 4.5,
    ratingCount: 11,
    completedSwaps: 9,
    bio: "Ps5, Nintendo oyunları ve konsol aksesuarları takas edilir.",
    isVerified: false,
    isBlocked: false,
    isAdmin: false,
    createdAt: "2026-04-02T00:00:00.000Z",
  },
];

const INITIAL_ITEMS: Item[] = [
  {
    id: "i1",
    userId: "u1_mucahit",
    username: "mucahit_takas",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    title: "iPhone 13 Pro 128GB Gümüş",
    description: "Pil sağlığı %85. Kutusu ve faturası mevcut. Hatasız çiziksiz cihaz, kılıfla kullanıldı. Temiz bir bilgisayar veya eşdeğer tabletle takas olur.",
    category: "Elektronik",
    condition: "Az Kullanılmış",
    targetSwap: "Elektronik",
    city: "İstanbul",
    imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80",
    createdAt: "2026-06-01T10:00:00Z",
    isModerated: true,
    reportsCount: 0,
    views: 142,
  },
  {
    id: "i2",
    userId: "u5_burak",
    username: "burak_gamer",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    title: "Sony PlayStation 5 Slim 1TB",
    description: "İki adet DualSense kol ile birlikte. Çizik dahi yok, garantisi devam ediyor. Akıllı ev cihazları veya temiz kargo edilebilir donanım takas tekliflerini değerlendiririm.",
    category: "Oyun & Konsol",
    condition: "Yeni",
    targetSwap: "Elektronik",
    city: "Bursa",
    imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80",
    createdAt: "2026-06-02T11:30:00Z",
    isModerated: true,
    reportsCount: 0,
    views: 298,
  },
  {
    id: "i3",
    userId: "u4_zeynep",
    username: "zeynep_vintage",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    title: "Vintage Hakiki Deri Ceket M Beden",
    description: "90'lardan kalma çok özel, kalın derili ceket. Çok temiz durumda, yırtık sökük yok. Vintage polar veya güzel bir mekanik saatle takas etmek istiyorum.",
    category: "Giyim & Aksesuar",
    condition: "Kullanılmış",
    targetSwap: "Giyim & Aksesuar",
    city: "Ankara",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    createdAt: "2026-06-03T09:12:00Z",
    isModerated: true,
    reportsCount: 0,
    views: 78,
  },
  {
    id: "i4",
    userId: "u3_can",
    username: "can_motor_spor",
    userAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&auto=format&fit=crop&q=80",
    title: "Bianchi Dağ Bisikleti 21 Vites",
    description: "Amortisörlü, disk frenli dağ bisikleti. Çok az kullanıldı, tüm bakımları yeni yapıldı. Evde kullanabileceğim elektrikli dikey süpürge veya Xiaomi Scooter ile takas edebilirim.",
    category: "Spor & Outdoor",
    condition: "Az Kullanılmış",
    targetSwap: "Ev & Yaşam",
    city: "İzmir",
    imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80",
    createdAt: "2026-06-04T16:20:00Z",
    isModerated: true,
    reportsCount: 0,
    views: 95,
  },
  {
    id: "i5",
    userId: "u2_elif",
    username: "elif_kitap_hobi",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    title: "Fender Squier Bullet Strat Elektro Gitar",
    description: "Yeni başlayanlar için kusursuzdur. Sahnede hiç kullanılmadı, evde temiz çalındı. Yanında kılıfı ve kablosu hediye. Klasik akustik gitar veya kompresör pedallı amfi aranıyor.",
    category: "Müzik Enstrümanları",
    condition: "Az Kullanılmış",
    targetSwap: "Müzik Enstrümanları",
    city: "Eskişehir",
    imageUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&auto=format&fit=crop&q=80",
    createdAt: "2026-06-05T14:45:00Z",
    isModerated: true,
    reportsCount: 0,
    views: 121,
  },
  {
    id: "i6",
    userId: "u2_elif",
    username: "elif_kitap_hobi",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    title: "Deluxe Espresso & Filtre Kahve Makinesi",
    description: "Hem kapsül hem taze çekilmiş kahve yapabiliyor. Süt köpürtücüsü mevcut. Çok lezzetli kahveler demliyor. Kitap seti veya güzel mekanik klavye ile takas edilir.",
    category: "Ev & Yaşam",
    condition: "Az Kullanılmış",
    targetSwap: "Elektronik",
    city: "Eskişehir",
    imageUrl: "https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?w=600&auto=format&fit=crop&q=80",
    createdAt: "2026-06-06T18:00:00Z",
    isModerated: true,
    reportsCount: 0,
    views: 64,
  },
  {
    id: "i7",
    userId: "u1_mucahit",
    username: "mucahit_takas",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    title: "Koleksiyonluk Harry Potter Set",
    description: "İngilizce özel sert kapak baskı. Kitaplar bir kere okundu, kutusuyla birlikte saklandı. Koleksiyon severler için mükemmel durumda. Bilim-kurgu klasik kitap setleri veya çizim tabletiyle takas ederim.",
    category: "Hobi & Eğlence",
    condition: "Yeni",
    targetSwap: "Elektronik",
    city: "İstanbul",
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
    createdAt: "2026-06-07T08:30:00Z",
    isModerated: true,
    reportsCount: 0,
    views: 104,
  }
];

const INITIAL_SWAPS: SwapOffer[] = [
  {
    id: "s1",
    proposerId: "u2_elif",
    proposerUsername: "elif_kitap_hobi",
    proposerItemId: "i6",
    proposerItemTitle: "Deluxe Espresso & Filtre Kahve Makinesi",
    proposerItemImage: "https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?w=600&auto=format&fit=crop&q=80",
    receiverId: "u1_mucahit",
    receiverUsername: "mucahit_takas",
    receiverItemId: "i7",
    receiverItemTitle: "Koleksiyonluk Harry Potter Set",
    receiverItemImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
    message: "Merhaba Mücahit Bey! Kahve makinesi karşılığında İngilizce Harry Potter setinizi takas etmek isterim. Benim ilanım da temizdir.",
    status: "accepted",
    proposerRated: false,
    receiverRated: false,
    createdAt: "2026-06-09T12:00:00Z",
  },
  {
    id: "s2",
    proposerId: "u4_zeynep",
    proposerUsername: "zeynep_vintage",
    proposerItemId: "i3",
    proposerItemTitle: "Vintage Hakiki Deri Ceket M Beden",
    proposerItemImage: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    receiverId: "u3_can",
    receiverUsername: "can_motor_spor",
    receiverItemId: "i4",
    receiverItemTitle: "Bianchi Dağ Bisikleti 21 Vites",
    receiverItemImage: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80",
    message: "Can merhaba, bisikletle ceketimi takas etmek ister misin? Üzerine ek takaslık başka vintage ürünlerim de var.",
    status: "pending",
    proposerRated: false,
    receiverRated: false,
    createdAt: "2026-06-10T15:40:00Z",
  }
];

const INITIAL_CHATS: ChatMessage[] = [
  {
    id: "c1",
    swapId: "s1",
    senderId: "u2_elif",
    text: "Merhaba! Kahve makinesi neredeyse sıfır durumda, kutusuyla gönderebilirim.",
    createdAt: "2026-06-09T12:05:00Z",
  },
  {
    id: "c2",
    swapId: "s1",
    senderId: "u1_mucahit",
    text: "Harika bir teklif! Harry Potter seti de kitaplıkta çok iyi korundu. PTT kargo ile karşılıklı takaslaşalım mı?",
    createdAt: "2026-06-10T10:15:00Z",
  },
  {
    id: "c3",
    swapId: "s1",
    senderId: "u2_elif",
    text: "Çok sevinirim. Ben Eskişehir'den kargoya veririm yarın.",
    createdAt: "2026-06-10T12:00:00Z",
  }
];

const INITIAL_REPORTS: Report[] = [
  {
    id: "r1",
    itemId: "i4",
    itemTitle: "Bianchi Dağ Bisikleti 21 Vites",
    itemImageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80",
    reporterId: "u2_elif",
    reporterUsername: "elif_kitap_hobi",
    reason: "Hatalı kategori veya ulaşılamayan takas detayları.",
    status: "pending",
    createdAt: "2026-06-11T13:00:00Z"
  }
];

interface LocalDB {
  users: User[];
  items: Item[];
  swaps: SwapOffer[];
  chats: ChatMessage[];
  reports: Report[];
}

function loadLocalDB(): LocalDB {
  const data = localStorage.getItem("swap_culture_db");
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.users && parsed.items && parsed.swaps) {
        return parsed as LocalDB;
      }
    } catch (e) {
      console.error("Local database corrupted, re-seeding", e);
    }
  }
  const defaultDB: LocalDB = {
    users: INITIAL_USERS,
    items: INITIAL_ITEMS,
    swaps: INITIAL_SWAPS,
    chats: INITIAL_CHATS,
    reports: INITIAL_REPORTS
  };
  saveLocalDB(defaultDB);
  return defaultDB;
}

function saveLocalDB(db: LocalDB) {
  localStorage.setItem("swap_culture_db", JSON.stringify(db));
}

// -----------------------------------------------------------------------------
// BACKEND REAL-TIME SYNCHRONIZATION HELPERS (PORT 3000 SYNC)
// -----------------------------------------------------------------------------
async function apiGet<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (res.ok) {
      return await res.json() as T;
    }
  } catch (err) {
    console.warn(`apiGet failed for ${url}, utilizing local storage callback:`, err);
  }
  return fallback;
}

async function apiPost<T>(url: string, body: any, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      return await res.json() as T;
    }
  } catch (err) {
    console.warn(`apiPost failed for ${url}, logging action locally:`, err);
  }
  return fallback;
}

// -----------------------------------------------------------------------------
// CORE SUPABASE / LOCAL DATA INTERFACE COMPLIANCE
// -----------------------------------------------------------------------------

export async function login(paramsOrEmail: string | {
  email?: string;
  password?: string;
  loginMode?: "email" | "google" | "phone" | "supabase";
  phone?: string;
  username?: string;
  avatarUrl?: string;
  isRegister?: boolean;
  supabaseUserId?: string;
}): Promise<User> {
  const body = typeof paramsOrEmail === "string" ? { email: paramsOrEmail } : paramsOrEmail;
  const loginMode = body.loginMode || "email";
  const email = (body.email || "").toLowerCase();
  const phone = body.phone;
  const username = body.username;
  const avatarUrl = body.avatarUrl;
  const supabaseUserId = body.supabaseUserId;

  // Real Supabase Operation
  if (isSupabaseConfigured() && supabase) {
    try {
      if (loginMode === "supabase" && supabaseUserId) {
        // Query profile from Supabase
        const { data: su, error: suErr } = await supabase
          .from("users")
          .select("*")
          .eq("supabaseUserId", supabaseUserId)
          .maybeSingle();

        if (su) {
          if (su.isBlocked) throw new Error("Hesabınız engellenmiştir.");
          return su as User;
        }

        // Search by email as secondary key to link existing accounts
        if (email) {
          const { data: emailUser } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

          if (emailUser) {
            const { data: updatedUser, error: uErr } = await supabase
              .from("users")
              .update({ supabaseUserId })
              .eq("id", emailUser.id)
              .select()
              .single();
            if (uErr) console.error("Update error: ", uErr);
            if (updatedUser) return updatedUser as User;
          }
        }

        // Else, register/push new user to database
        const autoUsername = username || (email ? email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_") : `sb_${Math.random().toString(36).substr(2, 5)}`);
        const { data: allUsers } = await supabase.from("users").select("id");
        const isFirst = !allUsers || allUsers.length === 0;

        const newUser: User = {
          id: "u_" + Math.random().toString(36).substr(2, 9),
          email: email || `${supabaseUserId}@supabase.temp`,
          username: autoUsername,
          city: "İstanbul",
          avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
          rating: 5.0,
          ratingCount: 0,
          completedSwaps: 0,
          bio: "Swap Culture dünyasına yeni katıldı!",
          isVerified: false,
          isBlocked: false,
          isAdmin: isFirst,
          createdAt: new Date().toISOString(),
          phoneVerified: false,
          supabaseUserId
        };

        const { data: created, error: createErr } = await supabase
          .from("users")
          .insert([newUser])
          .select()
          .single();

        if (createErr) throw createErr;
        return created as User;
      }
    } catch (err: any) {
      console.warn("Supabase query error, fallback to local database storage:", err);
    }
  }

  // Fallback / Preserved Local Database Store
  const db = loadLocalDB();

  if (loginMode === "supabase" && supabaseUserId) {
    let matched = db.users.find(u => u.supabaseUserId === supabaseUserId || (email && u.email.toLowerCase() === email));
    if (!matched) {
      const isFirst = db.users.length === 0;
      const autoUsername = username || (email ? email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_") : `sb_${Math.random().toString(36).substr(2, 5)}`);
      matched = {
        id: "u_" + Math.random().toString(36).substr(2, 9),
        email: email || `${supabaseUserId}@supabase.temp`,
        username: autoUsername,
        city: "İstanbul",
        avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        rating: 5.0,
        ratingCount: 0,
        completedSwaps: 0,
        bio: "Swap Culture dünyasına yeni katıldı!",
        isVerified: false,
        isBlocked: false,
        isAdmin: isFirst,
        createdAt: new Date().toISOString(),
        phoneVerified: false,
        supabaseUserId
      };
      db.users.push(matched);
      saveLocalDB(db);
      await apiPost<User>("/api/users", matched, matched);
    } else {
      if (!matched.supabaseUserId) {
        matched.supabaseUserId = supabaseUserId;
        saveLocalDB(db);
        await apiPost<User>("/api/users", matched, matched);
      }
    }
    if (matched.isBlocked) throw new Error("Hesabınız engellenmiştir.");
    return matched;
  }

  // Normal Email/Password fallback (mock authenticator)
  // Retrieve the most up-to-date registered users list from the server first to support cross-device logins
  try {
    const serverUsers = await apiGet<User[]>("/api/users", db.users);
    if (serverUsers && serverUsers.length > 0 && serverUsers !== db.users) {
      db.users = serverUsers;
      saveLocalDB(db);
    }
  } catch (err) {
    console.warn("Could not sync users from server during login:", err);
  }

  let found = db.users.find(u => u.email.toLowerCase() === email);
  if (!found) {
    if (body.isRegister) {
      const isFirst = db.users.length === 0;
      found = {
        id: "u_" + Math.random().toString(36).substr(2, 9),
        email: email,
        username: email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_"),
        city: "İstanbul",
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        rating: 5.0,
        ratingCount: 0,
        completedSwaps: 0,
        bio: "Swap Culture dünyasına yeni katıldı!",
        isVerified: false,
        isBlocked: false,
        isAdmin: isFirst,
        createdAt: new Date().toISOString(),
        phoneVerified: false
      };
      db.users.push(found);
      saveLocalDB(db);
      await apiPost<User>("/api/users", found, found);
    } else {
      throw new Error("Kullanıcı bulunamadı. Lütfen kayıt olun.");
    }
  }

  if (found.isBlocked) throw new Error("Hesabınız engellenmiştir.");
  return found;
}

export async function verifyPhone(userId: string, phone: string, code: string): Promise<User> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({ phone, phoneVerified: true })
        .eq("id", userId)
        .select()
        .single();
      if (!error && data) return data as User;
    } catch (e) {
      console.warn("Supabase verifyPhone failed, saving locally:", e);
    }
  }

  const db = loadLocalDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) throw new Error("Kullanıcı bulunamadı.");
  user.phone = phone;
  user.phoneVerified = true;
  saveLocalDB(db);
  await apiPost<User>("/api/users", user, user);
  return user;
}

export async function verifyFace(userId: string): Promise<User> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({ isVerified: true })
        .eq("id", userId)
        .select()
        .single();
      if (!error && data) return data as User;
    } catch (e) {
      console.warn("Supabase verifyFace failed:", e);
    }
  }

  const db = loadLocalDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) throw new Error("Kullanıcı bulunamadı.");
  user.isVerified = true;
  saveLocalDB(db);
  await apiPost<User>("/api/users", user, user);
  return user;
}

export async function onboard(params: {
  userId: string;
  username: string;
  city: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<User> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          username: params.username,
          city: params.city,
          bio: params.bio || "",
          avatarUrl: params.avatarUrl || ""
        })
        .eq("id", params.userId)
        .select()
        .single();
      if (!error && data) return data as User;
    } catch (e) {
      console.warn("Supabase onboarding fail, fallback local:", e);
    }
  }

  const db = loadLocalDB();
  const user = db.users.find(u => u.id === params.userId);
  if (!user) throw new Error("Kullanıcı bulunamadı.");
  user.username = params.username;
  user.city = params.city;
  if (params.bio !== undefined) user.bio = params.bio;
  if (params.avatarUrl !== undefined) user.avatarUrl = params.avatarUrl;
  saveLocalDB(db);
  await apiPost<User>("/api/users", user, user);
  return user;
}

export async function getUser(id: string): Promise<User> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) return data as User;
    } catch (e) {
      console.warn("Supabase getUser failed:", e);
    }
  }

  const db = loadLocalDB();
  let user = db.users.find(u => u.id === id);
  if (!user) {
    try {
      const serverUsers = await apiGet<User[]>("/api/users", db.users);
      if (serverUsers && serverUsers.length > 0) {
        db.users = serverUsers;
        saveLocalDB(db);
      }
      user = db.users.find(u => u.id === id);
    } catch (err) {
      console.warn("Failed to sync users for getUser fallback:", err);
    }
  }
  if (!user) throw new Error("Kullanıcı bulunamadı.");
  return user;
}

export async function getAdminUsers(): Promise<User[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("createdAt", { ascending: false });
      if (!error && data) return data as User[];
    } catch (e) {
      console.warn("Supabase getAdminUsers failed:", e);
    }
  }

  const db = loadLocalDB();
  const fallback = db.users;
  const serverUsers = await apiGet<User[]>("/api/users", fallback);
  if (serverUsers !== fallback) {
    db.users = serverUsers;
    saveLocalDB(db);
  }
  return serverUsers;
}

export async function updateAdminUser(id: string, params: { isBlocked?: boolean; isVerified?: boolean }): Promise<User> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update(params)
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as User;
    } catch (e) {
      console.warn("Supabase updateAdminUser fail:", e);
    }
  }

  const db = loadLocalDB();
  const user = db.users.find(u => u.id === id);
  if (!user) throw new Error("Kullanıcı bulunamadı.");
  if (params.isBlocked !== undefined) user.isBlocked = params.isBlocked;
  if (params.isVerified !== undefined) user.isVerified = params.isVerified;
  saveLocalDB(db);
  return user;
}

export async function getItems(): Promise<Item[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("createdAt", { ascending: false });
      if (error) {
        console.error("Supabase getItems sorgu hatası:", error);
        throw new Error(`Supabase İlanlar Alınamadı: ${error.message}`);
      }
      if (data) return data as Item[];
    } catch (e: any) {
      console.error("Supabase getItems istisnası:", e);
      throw e;
    }
  }

  const db = loadLocalDB();
  const fallback = db.items.filter(i => i.isModerated !== false);
  const serverItems = await apiGet<Item[]>("/api/items", fallback);
  
  // Update local storage so that any offline or other screen logic remains fully synchronized
  if (serverItems !== fallback) {
    db.items = serverItems;
    saveLocalDB(db);
  }
  
  return serverItems.filter(i => i.isModerated !== false);
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
  let user: User | null = null;
  try {
    user = await getUser(params.userId);
  } catch (e) {
    // Ignore, construct guest
  }

  const newItem: Item = {
    id: "i_" + Math.random().toString(36).substr(2, 9),
    userId: params.userId,
    username: user ? user.username : "Takasçı",
    userAvatar: user ? user.avatarUrl : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    title: params.title,
    description: params.description,
    category: params.category,
    condition: (params.condition as any) || "Yeni",
    targetSwap: params.targetSwap,
    city: params.city,
    imageUrl: params.imageUrl || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600",
    createdAt: new Date().toISOString(),
    isModerated: true,
    reportsCount: 0,
    views: 0,
    estimatedValue: params.estimatedValue || 0,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("items")
        .insert([newItem])
        .select()
        .single();
      if (error) {
        console.error("Supabase createItem veritabanı hatası:", error);
        throw new Error(`Supabase İlan Kayıt Hatası: ${error.message} (Kod: ${error.code}, Detay: ${error.details || 'Yok'})`);
      }
      if (data) return data as Item;
    } catch (e: any) {
      console.error("Supabase createItem istisnası:", e);
      throw e;
    }
  }

  const db = loadLocalDB();
  db.items.unshift(newItem);
  saveLocalDB(db);

  // Send to our live server API for cross-device visibility
  await apiPost<Item>("/api/items", newItem, newItem);

  return newItem;
}

export async function deleteItem(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", id);
      if (!error) return true;
    } catch (e) {
      console.warn("Supabase deleteItem failed:", e);
    }
  }

  const db = loadLocalDB();
  db.items = db.items.filter(i => i.id !== id);
  saveLocalDB(db);

  try {
    await fetch(`/api/items/${id}`, { method: "DELETE" });
  } catch (err) {
    console.warn("Backend API deleteItem failed:", err);
  }

  return true;
}

export async function reportItem(id: string, reporterId: string, reason: string): Promise<boolean> {
  let item: Item | null = null;
  let reporter: User | null = null;
  
  const db = loadLocalDB();
  item = db.items.find(i => i.id === id) || null;
  reporter = db.users.find(u => u.id === reporterId) || null;

  const newReport: Report = {
    id: "r_" + Math.random().toString(36).substr(2, 9),
    itemId: id,
    itemTitle: item ? item.title : "Bilinmeyen İlan",
    itemImageUrl: item ? item.imageUrl : "",
    reporterId,
    reporterUsername: reporter ? reporter.username : "misafir",
    reason,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      // Increment reportsCount
      if (item) {
        await supabase
          .from("items")
          .update({ reportsCount: (item.reportsCount || 0) + 1 })
          .eq("id", id);
      }
      const { error } = await supabase
        .from("reports")
        .insert([newReport]);
      if (!error) return true;
    } catch (e) {
      console.warn("Supabase reportItem fail:", e);
    }
  }

  if (item) item.reportsCount = (item.reportsCount || 0) + 1;
  db.reports.unshift(newReport);
  saveLocalDB(db);

  await apiPost<Report>("/api/reports", newReport, newReport);

  return true;
}

export async function incrementView(id: string): Promise<Item> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: item } = await supabase.from("items").select("views").eq("id", id).maybeSingle();
      const currentViews = item ? (item.views || 0) : 0;
      const { data, error } = await supabase
        .from("items")
        .update({ views: currentViews + 1 })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as Item;
    } catch (e) {
      console.warn("Supabase incrementView fail:", e);
    }
  }

  const db = loadLocalDB();
  const item = db.items.find(i => i.id === id);
  if (!item) throw new Error("İlan bulunamadı.");
  item.views = (item.views || 0) + 1;
  saveLocalDB(db);

  await apiPost<Item>(`/api/items/${id}/view`, {}, item);

  return item;
}

export async function getSwaps(userId: string): Promise<SwapOffer[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("swaps")
        .select("*")
        .or(`proposerId.eq.${userId},receiverId.eq.${userId}`);
      if (!error && data) return data as SwapOffer[];
    } catch (e) {
      console.warn("Supabase getSwaps error:", e);
    }
  }

  const db = loadLocalDB();
  const fallback = db.swaps;
  const serverSwaps = await apiGet<SwapOffer[]>("/api/swaps", fallback);
  if (serverSwaps !== fallback) {
    db.swaps = serverSwaps;
    saveLocalDB(db);
  }
  return serverSwaps.filter(s => s.proposerId === userId || s.receiverId === userId);
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
  const db = loadLocalDB();
  const prop = db.users.find(u => u.id === params.proposerId);
  const rec = db.users.find(u => u.id === params.receiverId);
  const pitem = db.items.find(i => i.id === params.proposerItemId);
  const ritem = db.items.find(i => i.id === params.receiverItemId);

  const newSwap: SwapOffer = {
    id: "s_" + Math.random().toString(36).substr(2, 9),
    proposerId: params.proposerId,
    proposerUsername: prop ? prop.username : "Takasçı",
    proposerItemId: params.proposerItemId,
    proposerItemTitle: pitem ? pitem.title : "Teklif Edilen İlan",
    proposerItemImage: pitem ? pitem.imageUrl : "",
    receiverId: params.receiverId,
    receiverUsername: rec ? rec.username : "Alıcı",
    receiverItemId: params.receiverItemId,
    receiverItemTitle: ritem ? ritem.title : "Hedef İlan",
    receiverItemImage: ritem ? ritem.imageUrl : "",
    message: params.message || "",
    status: "pending",
    proposerRated: false,
    receiverRated: false,
    createdAt: new Date().toISOString(),
    monetaryType: params.monetaryType || 'none',
    monetaryAmount: params.monetaryAmount || 0
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("swaps")
        .insert([newSwap])
        .select()
        .single();
      if (!error && data) return data as SwapOffer;
    } catch (e) {
      console.warn("Supabase proposeSwap fail:", e);
    }
  }

  db.swaps.unshift(newSwap);
  saveLocalDB(db);

  await apiPost<SwapOffer>("/api/swaps", newSwap, newSwap);

  return newSwap;
}

export async function updateSwapStatus(id: string, status: string, updaterId: string): Promise<SwapOffer> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: currentSwap } = await supabase.from("swaps").select("*").eq("id", id).single();
      if (currentSwap) {
        let updateAttrs: any = { status };
        const { data, error } = await supabase
          .from("swaps")
          .update(updateAttrs)
          .eq("id", id)
          .select()
          .single();
          
        if (!error && data) {
          if (status === "completed") {
            // Also update completedSwaps counters for both users in Supabase
            const { data: pU } = await supabase.from("users").select("completedSwaps").eq("id", currentSwap.proposerId).maybeSingle();
            const { data: rU } = await supabase.from("users").select("completedSwaps").eq("id", currentSwap.receiverId).maybeSingle();
            
            await supabase.from("users").update({ completedSwaps: (pU?.completedSwaps || 0) + 1 }).eq("id", currentSwap.proposerId);
            await supabase.from("users").update({ completedSwaps: (rU?.completedSwaps || 0) + 1 }).eq("id", currentSwap.receiverId);
          }
          return data as SwapOffer;
        }
      }
    } catch (e) {
      console.warn("Supabase updateSwapStatus fail:", e);
    }
  }

  const db = loadLocalDB();
  const swap = db.swaps.find(s => s.id === id);
  if (!swap) throw new Error("Takas teklifi bulunamadı.");
  swap.status = status as any;

  if (status === "completed") {
    const propUser = db.users.find(u => u.id === swap.proposerId);
    if (propUser) propUser.completedSwaps = (propUser.completedSwaps || 0) + 1;
    const recUser = db.users.find(u => u.id === swap.receiverId);
    if (recUser) recUser.completedSwaps = (recUser.completedSwaps || 0) + 1;
  }
  
  saveLocalDB(db);

  await apiPost<any>(`/api/swaps/${id}/status`, { status, updaterId }, swap);

  return swap;
}

export async function rateSwap(id: string, raterId: string, rating: number, comment?: string): Promise<SwapOffer> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: currentSwap } = await supabase.from("swaps").select("*").eq("id", id).single();
      if (currentSwap) {
        const isProposer = currentSwap.proposerId === raterId;
        const targetUserId = isProposer ? currentSwap.receiverId : currentSwap.proposerId;

        // Check if already rated in Supabase swaps
        const { data: allSwaps } = await supabase.from("swaps").select("*");
        if (allSwaps) {
          const alreadyRatedOther = allSwaps.some(s => {
            const term1 = s.proposerId === raterId && s.receiverId === targetUserId && s.proposerRated;
            const term2 = s.receiverId === raterId && s.proposerId === targetUserId && s.receiverRated;
            return term1 || term2;
          });
          if (alreadyRatedOther) {
            throw new Error("Bu kullanıcıyı daha önce puanladınız. Her kullanıcıyı yalnızca bir kez puanlayabilirsiniz.");
          }
        }

        const updateAttrs: any = {
          proposerRated: isProposer ? true : currentSwap.proposerRated,
          receiverRated: !isProposer ? true : currentSwap.receiverRated
        };
        const { data: updatedSwap } = await supabase.from("swaps").update(updateAttrs).eq("id", id).select().single();
        
        // Find counterparty to update aggregate score
        const { data: tUser } = await supabase.from("users").select("rating, ratingCount").eq("id", targetUserId).single();
        if (tUser) {
          const oldCount = tUser.ratingCount || 0;
          const oldRating = tUser.rating || 5.0;
          const newCount = oldCount + 1;
          const newRating = parseFloat(((oldRating * oldCount + rating) / newCount).toFixed(1));
          await supabase.from("users").update({ rating: newRating, ratingCount: newCount }).eq("id", targetUserId);
        }
        if (updatedSwap) return updatedSwap as SwapOffer;
      }
    } catch (e) {
      console.warn("Supabase rateSwap fail:", e);
    }
  }

  const db = loadLocalDB();
  const swap = db.swaps.find(s => s.id === id);
  if (!swap) throw new Error("Takas bulunamadı.");

  const isProposer = swap.proposerId === raterId;
  const targetUserId = isProposer ? swap.receiverId : swap.proposerId;

  // Check if already rated in LocalDB swaps
  const alreadyRatedOther = db.swaps.some(s => {
    const term1 = s.proposerId === raterId && s.receiverId === targetUserId && s.proposerRated;
    const term2 = s.receiverId === raterId && s.proposerId === targetUserId && s.receiverRated;
    return term1 || term2;
  });

  if (alreadyRatedOther) {
    throw new Error("Bu kullanıcıyı daha önce puanladınız. Her kullanıcıyı yalnızca bir kez puanlayabilirsiniz.");
  }

  if (isProposer) {
    swap.proposerRated = true;
  } else {
    swap.receiverRated = true;
  }

  const targetUser = db.users.find(u => u.id === targetUserId);
  if (targetUser) {
    const oldCount = targetUser.ratingCount || 0;
    const oldRating = targetUser.rating || 5.0;
    const newCount = oldCount + 1;
    targetUser.ratingCount = newCount;
    targetUser.rating = parseFloat(((oldRating * oldCount + rating) / newCount).toFixed(1));
  }

  saveLocalDB(db);

  // Sync swap completion ratings across all devices instantly!
  try {
    await apiPost<SwapOffer>("/api/swaps", swap, swap);
    if (targetUser) {
      await apiPost<User>("/api/users", targetUser, targetUser);
    }
  } catch (err) {
    console.warn("Could not sync rating score to the server:", err);
  }

  return swap;
}

export async function getChatMessages(swapId: string): Promise<ChatMessage[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("swapId", swapId)
        .order("createdAt", { ascending: true });
      if (!error && data) return data as ChatMessage[];
    } catch (e) {
      console.warn("Supabase getChatMessages fail:", e);
    }
  }

  const db = loadLocalDB();
  const fallback = db.chats;
  const serverChats = await apiGet<ChatMessage[]>("/api/chats", fallback);
  if (serverChats !== fallback) {
    db.chats = serverChats;
    saveLocalDB(db);
  }
  return serverChats.filter(c => c.swapId === swapId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function sendChatMessage(swapId: string, senderId: string, text: string, imageUrl?: string): Promise<ChatMessage> {
  const newMessage: ChatMessage = {
    id: "c_" + Math.random().toString(36).substr(2, 9),
    swapId,
    senderId,
    text,
    imageUrl,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("chats")
        .insert([newMessage])
        .select()
        .single();
      if (!error && data) return data as ChatMessage;
    } catch (e) {
      console.warn("Supabase sendChatMessage fail:", e);
    }
  }

  const db = loadLocalDB();
  db.chats.push(newMessage);
  saveLocalDB(db);

  await apiPost<ChatMessage>("/api/chats", newMessage, newMessage);

  return newMessage;
}

export async function getAdminReports(): Promise<Report[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("createdAt", { ascending: false });
      if (!error && data) return data as Report[];
    } catch (e) {
      console.warn("Supabase getAdminReports failed:", e);
    }
  }

  const db = loadLocalDB();
  return db.reports;
}

export async function resolveAdminReport(id: string, action: "delete_item" | "dismiss"): Promise<Report[]> {
  const db = loadLocalDB();
  const report = db.reports.find(r => r.id === id);

  if (report) {
    report.status = "resolved";
    if (action === "delete_item") {
      db.items = db.items.filter(i => i.id !== report.itemId);
    }
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("reports").update({ status: "resolved" }).eq("id", id);
      if (action === "delete_item" && report) {
        await supabase.from("items").delete().eq("id", report.itemId);
      }
      const { data } = await supabase.from("reports").select("*").order("createdAt", { ascending: false });
      if (data) return data as Report[];
    } catch (e) {
      console.warn("Supabase resolveAdminReport failed:", e);
    }
  }

  saveLocalDB(db);
  return db.reports;
}

export async function getAdminAnalytics(): Promise<AppAnalytics> {
  let uList: User[] = [];
  let iList: Item[] = [];
  let sList: SwapOffer[] = [];

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: users } = await supabase.from("users").select("*");
      const { data: items } = await supabase.from("items").select("*");
      const { data: swaps } = await supabase.from("swaps").select("*");
      uList = (users || []) as User[];
      iList = (items || []) as Item[];
      sList = (swaps || []) as SwapOffer[];
    } catch (e) {
      console.warn("Supabase analytics failed, fallback local calculation:", e);
    }
  }

  if (uList.length === 0) {
    const db = loadLocalDB();
    uList = db.users;
    iList = db.items;
    sList = db.swaps;
  }

  const totalUsers = uList.length;
  const totalItems = iList.length;
  const totalSwaps = sList.length;
  const totalCompletedSwaps = sList.filter(s => s.status === "completed").length;
  const totalViews = iList.reduce((acc, current) => acc + (current.views || 0), 0);
  const activeUsersCount = uList.filter(u => !u.isBlocked).length;

  const categoryDistribution: { [key: string]: number } = {};
  iList.forEach(item => {
    categoryDistribution[item.category] = (categoryDistribution[item.category] || 0) + 1;
  });

  const dailyStats = [
    { date: "Bugün", registrations: 2, listings: iList.length, swaps: sList.length },
    { date: "Dün", registrations: 4, listings: 2, swaps: 1 },
    { date: "3 Gün Önce", registrations: 1, listings: 4, swaps: 3 },
  ];

  return {
    totalUsers,
    totalItems,
    totalSwaps,
    totalCompletedSwaps,
    categoryDistribution,
    totalViews,
    activeUsersCount,
    dailyStats
  };
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
  const parts = username.split(/[\s_.-]+/).filter(Boolean);
  if (parts.length === 0) return username;
  if (parts.length === 1) {
    const word = parts[0];
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const last = parts[parts.length - 1];
  const lastInitial = last.charAt(0).toUpperCase() + ".";
  return `${first} ${lastInitial}`;
}

export async function deleteAccount(userId: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("users").delete().eq("id", userId);
      await supabase.from("items").delete().eq("userId", userId);
    } catch (e) {
      console.warn("Supabase account deletion fail:", e);
    }
  }

  const db = loadLocalDB();
  db.users = db.users.filter(u => u.id !== userId);
  db.items = db.items.filter(i => i.userId !== userId);
  saveLocalDB(db);
  return true;
}
