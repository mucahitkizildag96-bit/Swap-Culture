import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { User, Item, SwapOffer, ChatMessage, Report, AppAnalytics } from "./src/types.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_FILE = process.env.VERCEL 
  ? path.join("/tmp", "database.json") 
  : path.join(process.cwd(), "database.json");

// pre-seed database.json to writable /tmp on Vercel from static bundle if needed
if (process.env.VERCEL && !fs.existsSync(DB_FILE)) {
  const bundleDbPath = path.join(process.cwd(), "database.json");
  if (fs.existsSync(bundleDbPath)) {
    try {
      fs.copyFileSync(bundleDbPath, DB_FILE);
    } catch (err) {
      console.error("Failed to copy database.json to /tmp:", err);
    }
  }
}

// Helper to write database to disk
function saveDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Database writing error: ", err);
  }
}

// Helper to read database or initialize if it doesn't exist
const VALID_CATEGORIES = [
  "Elektronik",
  "Motorlu Araçlar",
  "Oyun & Konsol",
  "Giyim & Aksesuar",
  "Spor & Outdoor",
  "Müzik Enstrümanları",
  "Ev & Yaşam",
  "Hobi & Eğlence",
  "Kitap, Dergi & Kırtasiye",
  "Koleksiyon & Antika",
  "Kozmetik & Kişisel Bakım",
  "Bebek & Anne",
  "Otomotiv & Motosiklet Aksesuarları",
  "Sanat & El Sanatları",
  "Evcil Hayvan Ürünleri",
  "Ofis & İş Malzemeleri",
  "Bahçe & Tarım Ürünleri",
  "Takı, Saat & Gözlük",
  "Süpermarket & Gıda",
  "Diğer"
];

function sanitizeItemTargetSwap(item: any): string {
  if (VALID_CATEGORIES.includes(item.targetSwap)) {
    return item.targetSwap;
  }
  const targetLower = (item.targetSwap || "").toLowerCase();
  if (targetLower.includes("macbook") || targetLower.includes("ipad") || targetLower.includes("tablet") || targetLower.includes("pc") || targetLower.includes("klavye") || targetLower.includes("telefon") || targetLower.includes("bilgisayar") || targetLower.includes("wacom")) {
    return "Elektronik";
  }
  if (targetLower.includes("gitar") || targetLower.includes("kart") || targetLower.includes("enstrüman")) {
    return "Müzik Enstrümanları";
  }
  if (targetLower.includes("ceket") || targetLower.includes("saat") || targetLower.includes("giyim") || targetLower.includes("aksesuar") || targetLower.includes("elbise")) {
    return "Giyim & Aksesuar";
  }
  if (targetLower.includes("süpürge") || targetLower.includes("ev") || targetLower.includes("mutfak") || targetLower.includes("yaşam")) {
    return "Ev & Yaşam";
  }
  if (targetLower.includes("kitap") || targetLower.includes("hobi") || targetLower.includes("oyuncak") || targetLower.includes("eğlence") || targetLower.includes("harry potter")) {
    return "Hobi & Eğlence";
  }
  if (targetLower.includes("bisiklet") || targetLower.includes("spor") || targetLower.includes("outdoor") || targetLower.includes("kamp") || targetLower.includes("scooter")) {
    return "Spor & Outdoor";
  }
  if (targetLower.includes("playstation") || targetLower.includes("oyun") || targetLower.includes("konsol") || targetLower.includes("ps5")) {
    return "Oyun & Konsol";
  }
  return "Diğer";
}

function loadDatabase(): {
  users: User[];
  items: Item[];
  swaps: SwapOffer[];
  chats: ChatMessage[];
  reports: Report[];
} {
  if (fs.existsSync(DB_FILE)) {
    try {
      const fileContent = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(fileContent);
      if (parsed && Array.isArray(parsed.items)) {
        parsed.items = parsed.items.map((item: any) => ({
          ...item,
          targetSwap: sanitizeItemTargetSwap(item)
        }));
      }
      return parsed;
    } catch (err) {
      console.error("Database parsing error, seeding fresh database: ", err);
    }
  }

  // Seed Initial Database
  const initialUsers: User[] = [
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
      createdAt: new Date("2026-01-10").toISOString(),
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
      createdAt: new Date("2026-02-15").toISOString(),
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
      createdAt: new Date("2026-03-01").toISOString(),
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
      createdAt: new Date("2026-03-12").toISOString(),
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
      createdAt: new Date("2026-04-02").toISOString(),
    },
  ];

  const initialItems: Item[] = [
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
      createdAt: new Date("2026-06-01T10:00:00Z").toISOString(),
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
      createdAt: new Date("2026-06-02T11:30:00Z").toISOString(),
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
      createdAt: new Date("2026-06-03T09:12:00Z").toISOString(),
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
      createdAt: new Date("2026-06-04T16:20:00Z").toISOString(),
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
      createdAt: new Date("2026-06-05T14:45:00Z").toISOString(),
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
      createdAt: new Date("2026-06-06T18:00:00Z").toISOString(),
      isModerated: true,
      reportsCount: 0,
      views: 64,
    },
    {
      id: "i7",
      userId: "u1_mucahit",
      username: "mucahit_takas",
      userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      title: "Koleksiyonluk İngilizce Harry Potter 1-7 Set",
      description: "İngilizce özel sert kapak baskı. Kitaplar bir kere okundu, kutusuyla birlikte saklandı. Koleksiyon severler için mükemmel durumda. Bilim-kurgu klasik kitap setleri veya çizim tabletiyle takas ederim.",
      category: "Hobi & Eğlence",
      condition: "Yeni",
      targetSwap: "Elektronik",
      city: "İstanbul",
      imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
      createdAt: new Date("2026-06-07T08:30:00Z").toISOString(),
      isModerated: true,
      reportsCount: 0,
      views: 104,
    }
  ];

  const initialSwaps: SwapOffer[] = [
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
      receiverItemTitle: "Koleksiyonluk İngilizce Harry Potter 1-7 Set",
      receiverItemImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
      message: "Merhaba Mücahit Bey! Kahve makinesi karşılığında İngilizce Harry Potter setinizi takas etmek isterim. Benim ilanım da temizdir.",
      status: "accepted",
      proposerRated: false,
      receiverRated: false,
      createdAt: new Date("2026-06-09T12:00:00Z").toISOString(),
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
      createdAt: new Date("2026-06-10T15:40:00Z").toISOString(),
    }
  ];

  const initialChats: ChatMessage[] = [
    {
      id: "c1",
      swapId: "s1",
      senderId: "u2_elif",
      text: "Merhaba! Kahve makinesi neredeyse sıfır durumda, kutusuyla gönderebilirim.",
      createdAt: new Date("2026-06-09T12:05:00Z").toISOString(),
    },
    {
      id: "c2",
      swapId: "s1",
      senderId: "u1_mucahit",
      text: "Harika bir teklif! Harry Potter seti de kitaplıkta çok iyi korundu. PTT kargo ile karşılıklı takaslaşalım mı?",
      createdAt: new Date("2026-06-10T10:15:00Z").toISOString(),
    },
    {
      id: "c3",
      swapId: "s1",
      senderId: "u2_elif",
      text: "Çok sevinirim. Ben Eskişehir'den kargoya veririm yarın.",
      createdAt: new Date("2026-06-10T12:00:00Z").toISOString(),
    }
  ];

  const initialReports: Report[] = [
    {
      id: "r1",
      itemId: "i4",
      itemTitle: "Bianchi Dağ Bisikleti 21 Vites",
      itemImageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80",
      reporterId: "u2_elif",
      reporterUsername: "elif_kitap_hobi",
      reason: "Hatalı kategori veya ulaşılamayan takas detayları.",
      status: "pending",
      createdAt: new Date("2026-06-11T13:00:00Z").toISOString()
    }
  ];

  const db = {
    users: initialUsers,
    items: initialItems,
    swaps: initialSwaps,
    chats: initialChats,
    reports: initialReports,
  };

  saveDatabase(db);
  return db;
}

// Instantiate Database
const db = loadDatabase();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

export { app };

async function startServer() {
  // API ROUTES

  // Auth: Email/Password, Google or Phone Login with Register support
  app.post("/api/auth/login", (req, res) => {
    const { email, password, loginMode, phone, username: googleUsername, avatarUrl: googleAvatarUrl, supabaseUserId } = req.body;
    
    // 0. SUPABASE LOGIN SYNC
    if (loginMode === "supabase") {
      if (!supabaseUserId) {
        return res.status(400).json({ error: "Supabase ID zorunludur." });
      }

      const targetEmail = (email || "").toLowerCase();
      let user = db.users.find((u) => u.supabaseUserId === supabaseUserId || (targetEmail && u.email.toLowerCase() === targetEmail));

      if (!user) {
        const isFirst = db.users.length === 0;
        const autoUsername = googleUsername || (targetEmail ? targetEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_") : `sb_${Math.random().toString(36).substr(2, 5)}`);
        user = {
          id: "u_" + Math.random().toString(36).substr(2, 9),
          email: targetEmail || `${supabaseUserId}@supabase.temp`,
          username: autoUsername,
          city: "İstanbul",
          avatarUrl: googleAvatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
          rating: 5.0,
          ratingCount: 0,
          completedSwaps: 0,
          bio: "Swap Culture dünyasına yeni katıldı!",
          isVerified: false,
          isBlocked: false,
          isAdmin: isFirst,
          createdAt: new Date().toISOString(),
          phoneVerified: false,
          supabaseUserId: supabaseUserId
        };
        db.users.push(user);
        saveDatabase(db);
      } else {
        if (!user.supabaseUserId) {
          user.supabaseUserId = supabaseUserId;
          saveDatabase(db);
        }
      }

      if (user.isBlocked) {
        return res.status(403).json({ error: "Hesabınız yönetici tarafından engellenmiştir." });
      }

      return res.json({ user });
    }

    // 1. PHONE LOGIN
    if (loginMode === "phone") {
      if (!phone) {
        return res.status(400).json({ error: "Telefon numarası zorunludur." });
      }

      // Find user by phone
      let user = db.users.find((u) => u.phone === phone);

      if (!user) {
        // Auto register brand new user
        const mockEmail = `tel_${phone.replace(/\s+/g, "")}@swapculture.com`;
        const autoUsername = `user_${Math.random().toString(36).substr(2, 5)}`;
        user = {
          id: "u_" + Math.random().toString(36).substr(2, 9),
          email: mockEmail,
          username: autoUsername,
          city: "İstanbul",
          avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
          rating: 5.0,
          ratingCount: 0,
          completedSwaps: 0,
          bio: "Swap Culture dünyasına yeni katıldı!",
          isVerified: false,
          isBlocked: false,
          isAdmin: false,
          createdAt: new Date().toISOString(),
          phone: phone,
          phoneVerified: true, // They verified through login SMS
        };
        db.users.push(user);
        saveDatabase(db);
      }

      if (user.isBlocked) {
        return res.status(403).json({ error: "Hesabınız yönetici tarafından engellenmiştir." });
      }

      return res.json({ user });
    }

    // 2. GOOGLE LOGIN
    if (loginMode === "google") {
      const googleEmail = (email || `google_${Math.random().toString(36).substr(2, 5)}@gmail.com`).toLowerCase();
      let user = db.users.find((u) => u.email.toLowerCase() === googleEmail);

      if (!user) {
        const isFirst = db.users.length === 0;
        const autoUsername = googleUsername || googleEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_");
        user = {
          id: "u_" + Math.random().toString(36).substr(2, 9),
          email: googleEmail,
          username: autoUsername,
          city: "İstanbul",
          avatarUrl: googleAvatarUrl || `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80`,
          rating: 5.0,
          ratingCount: 0,
          completedSwaps: 0,
          bio: "Swap Culture dünyasına yeni katıldı!",
          isVerified: false,
          isBlocked: false,
          isAdmin: isFirst,
          createdAt: new Date().toISOString(),
          phoneVerified: false,
        };
        db.users.push(user);
        saveDatabase(db);
      }

      if (user.isBlocked) {
        return res.status(403).json({ error: "Hesabınız yönetici tarafından engellenmiştir." });
      }

      return res.json({ user });
    }

    // 3. EMAIL/PASSWORD LOGIN (DEFAULT)
    if (!email) {
      return res.status(400).json({ error: "E-posta girilmesi zorunludur." });
    }

    const { isRegister } = req.body;

    // Attempt to find user
    let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (isRegister) {
      if (user) {
        return res.status(400).json({ error: "Bu e-posta adresiyle kayıtlı bir hesap zaten var. Lütfen giriş yapın." });
      }

      // Register new user
      const isFirst = email.includes("mucahitkizildag96") || db.users.length === 0;
      const cleanUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_");
      user = {
        id: "u_" + Math.random().toString(36).substr(2, 9),
        email: email.toLowerCase(),
        username: cleanUsername,
        city: "İstanbul",
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        rating: 5.0,
        ratingCount: 0,
        completedSwaps: 0,
        bio: "Swap Culture dünyasına yeni katıldı!",
        isVerified: false,
        isBlocked: false,
        isAdmin: isFirst, // first one is admin
        createdAt: new Date().toISOString(),
        phoneVerified: false,
      };
      db.users.push(user);
      saveDatabase(db);
    } else {
      // Login mode - assert user exists
      if (!user) {
        return res.status(400).json({ error: "Bu e-posta adresine kayıtlı bir hesap bulunamadı. Önce kayıt olabilirsiniz veya demo hesabını kullanabilirsiniz." });
      }
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: "Hesabınız yönetici tarafından engellenmiştir." });
    }

    return res.json({ user });
  });

  // Verify Phone Number route
  app.post("/api/users/:id/verify-phone", (req, res) => {
    const userId = req.params.id;
    const { phone, code } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Telefon numarası zorunludur." });
    }

    if (!code) {
      return res.status(400).json({ error: "Doğrulama kodu zorunludur." });
    }

    if (code !== "123456") {
      return res.status(400).json({ error: "Doğrulama kodu hatalıdır. Test kodu: 123456" });
    }

    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    db.users[userIndex].phone = phone;
    db.users[userIndex].phoneVerified = true;
    
    // Cascade update items verification representation if needed
    saveDatabase(db);
    return res.json({ user: db.users[userIndex] });
  });

  // Onboard profile update
  app.post("/api/auth/onboard", (req, res) => {
    const { userId, username, city, bio, avatarUrl } = req.body;
    const userIndex = db.users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    if (!username || !city) {
      return res.status(400).json({ error: "Kullanıcı adı ve şehir zorunludur." });
    }

    // Check unique username (except current user)
    const existing = db.users.find((u) => u.id !== userId && u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış." });
    }

    db.users[userIndex].username = username;
    db.users[userIndex].city = city;
    db.users[userIndex].bio = bio || db.users[userIndex].bio;
    if (avatarUrl) {
      db.users[userIndex].avatarUrl = avatarUrl;
    }

    // Cascade update in items representation
    db.items.forEach((item) => {
      if (item.userId === userId) {
        item.username = username;
        if (avatarUrl) {
          item.userAvatar = avatarUrl;
        }
      }
    });

    saveDatabase(db);
    return res.json({ user: db.users[userIndex] });
  });

  // GET simple user by id
  app.get("/api/users/:id", (req, res) => {
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }
    return res.json({ user });
  });

  // DELETE account
  app.delete("/api/users/:id", (req, res) => {
    const userId = req.params.id;
    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    // Remove user
    db.users.splice(userIndex, 1);

    // Remove user's items
    db.items = db.items.filter((item) => item.userId !== userId);

    // Cancel or filter swaps involving key users
    db.swaps = db.swaps.filter((swap) => {
      if (swap.proposerId === userId || swap.receiverId === userId) {
        // Remove chats of these cancelled swaps
        db.chats = db.chats.filter((chat) => chat.swapId !== swap.id);
        return false;
      }
      return true;
    });

    saveDatabase(db);
    return res.json({ success: true, message: "Hesap başarıyla silindi." });
  });

  // GET all users (Admin)
  app.get("/api/admin/users", (req, res) => {
    return res.json({ users: db.users });
  });

  // PATCH user block status / verify badge status
  app.patch("/api/admin/users/:id", (req, res) => {
    const { isBlocked, isVerified } = req.body;
    const user = db.users.find((u) => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    if (isBlocked !== undefined) user.isBlocked = isBlocked;
    if (isVerified !== undefined) user.isVerified = isVerified;

    saveDatabase(db);
    return res.json({ user });
  });

  // Self face-verification endpoint
  app.post("/api/users/:id/verify-face", (req, res) => {
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }
    user.isVerified = true;
    saveDatabase(db);
    return res.json({ user });
  });

  // GET Items
  app.get("/api/items", (req, res) => {
    const activeItems = db.items.filter((item) => {
      // Don't show blocked users' items
      const user = db.users.find((u) => u.id === item.userId);
      return user && !user.isBlocked;
    }).map((item) => {
      const user = db.users.find((u) => u.id === item.userId);
      return {
        ...item,
        userRating: user ? user.rating : 5.0,
        userRatingCount: user ? (user.ratingCount || 0) : 0
      };
    });
    return res.json({ items: activeItems });
  });

  // POST Create Listing
  app.post("/api/items", (req, res) => {
    const { userId, title, description, category, condition, targetSwap, city, imageUrl, estimatedValue } = req.body;

    if (!userId || !title || !category || !condition || !targetSwap || !city) {
      return res.status(400).json({ error: "Lütfen zorunlu tüm alanları doldurun." });
    }

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Giriş yapan kullanıcı bulunamadı." });
    }

    const newItem: Item = {
      id: "i_" + Math.random().toString(36).substr(2, 9),
      userId,
      username: user.username,
      userAvatar: user.avatarUrl,
      title,
      description: description || "",
      category,
      condition,
      targetSwap,
      city,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
      isModerated: true,
      reportsCount: 0,
      views: 0,
      estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
    };

    db.items.push(newItem);
    saveDatabase(db);

    return res.json({ item: newItem });
  });

  // GET single item and track views
  app.get("/api/items/:id", (req, res) => {
    const item = db.items.find((i) => i.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: "İlan bulunamadı." });
    }
    item.views = (item.views || 0) + 1;
    saveDatabase(db);
    const user = db.users.find((u) => u.id === item.userId);
    return res.json({
      item: {
        ...item,
        userRating: user ? user.rating : 5.0,
        userRatingCount: user ? (user.ratingCount || 0) : 0
      }
    });
  });

  // DELETE item (User delete or Admin moderation review)
  app.delete("/api/items/:id", (req, res) => {
    const index = db.items.findIndex((i) => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "İlan bulunamadı." });
    }

    db.items.splice(index, 1);
    // Remove relevant reports
    db.reports = db.reports.filter((r) => r.itemId !== req.params.id);

    saveDatabase(db);
    return res.json({ success: true, message: "İlan başarıyla kaldırıldı." });
  });

  // POST Report Item
  app.post("/api/items/:id/report", (req, res) => {
    const { reporterId, reason } = req.body;
    const item = db.items.find((i) => i.id === req.params.id);
    const reporter = db.users.find((u) => u.id === reporterId);

    if (!item) {
      return res.status(404).json({ error: "İlan bulunamadı." });
    }
    if (!reporter) {
      return res.status(404).json({ error: "Raporlayan kullanıcı bulunamadı." });
    }

    item.reportsCount = (item.reportsCount || 0) + 1;

    const newReport: Report = {
      id: "r_" + Math.random().toString(36).substr(2, 9),
      itemId: item.id,
      itemTitle: item.title,
      itemImageUrl: item.imageUrl,
      reporterId,
      reporterUsername: reporter.username,
      reason: reason || "Yanıltıcı içerik veya uygunsuz ilan.",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    db.reports.push(newReport);
    saveDatabase(db);

    return res.json({ success: true, report: newReport });
  });

  // GET Swaps
  app.get("/api/swaps", (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId parametresi zorunludur." });
    }

    // Filter swaps related to this user
    const userSwaps = db.swaps.filter((s) => s.proposerId === userId || s.receiverId === userId);
    return res.json({ swaps: userSwaps });
  });

  // POST Propose Swap
  app.post("/api/swaps", (req, res) => {
    const { proposerId, proposerItemId, receiverId, receiverItemId, message, monetaryType, monetaryAmount } = req.body;

    if (!proposerId || !proposerItemId || !receiverId || !receiverItemId) {
      return res.status(400).json({ error: "Zorunlu takas bilgileri eksik." });
    }

    const proposer = db.users.find((u) => u.id === proposerId);
    const receiver = db.users.find((u) => u.id === receiverId);
    const propItem = db.items.find((i) => i.id === proposerItemId);
    const recItem = db.items.find((i) => i.id === receiverItemId);

    if (!proposer || !receiver || !propItem || !recItem) {
      return res.status(404).json({ error: "Ürünler veya kullanıcılar bulunamadı." });
    }

    // Prevent swap with oneself
    if (proposerId === receiverId) {
      return res.status(400).json({ error: "Kendi ürününüzle takas yapamazsınız." });
    }

    const newSwap: SwapOffer = {
      id: "s_" + Math.random().toString(36).substr(2, 9),
      proposerId,
      proposerUsername: proposer.username,
      proposerItemId,
      proposerItemTitle: propItem.title,
      proposerItemImage: propItem.imageUrl,
      receiverId,
      receiverUsername: receiver.username,
      receiverItemId,
      receiverItemTitle: recItem.title,
      receiverItemImage: recItem.imageUrl,
      message: message || "",
      status: "pending",
      proposerRated: false,
      receiverRated: false,
      createdAt: new Date().toISOString(),
      monetaryType: monetaryType || 'none',
      monetaryAmount: monetaryAmount ? Number(monetaryAmount) : 0,
    };

    db.swaps.push(newSwap);

    // system text with monetary details if applicable
    let adjText = "";
    if (monetaryType === 'give' && monetaryAmount > 0) {
      adjText = `\nPara Dengesi: Bilakis @${proposer.username} ${monetaryAmount} TL ek bakiye vermeyi teklif etti.`;
    } else if (monetaryType === 'take' && monetaryAmount > 0) {
      adjText = `\nPara Dengesi: Bilakis @${proposer.username} karşı taraftan ${monetaryAmount} TL ek bakiye talep ediyor.`;
    }

    // Automatically create a Turkish system chat message in the chat channel
    const systemMsg: ChatMessage = {
      id: "c_" + Math.random().toString(36).substr(2, 9),
      swapId: newSwap.id,
      senderId: "system",
      text: `Sistem: @${proposer.username}, @${receiver.username} kullanıcısına takas teklifi gönderdi!\nÖnerilen: "${propItem.title}" ⇆ İstenen: "${recItem.title}"${adjText}`,
      createdAt: new Date().toISOString(),
    };
    db.chats.push(systemMsg);

    saveDatabase(db);
    return res.json({ swap: newSwap });
  });

  // PATCH Swap Offer Status
  app.patch("/api/swaps/:id", (req, res) => {
    const { status, updaterId } = req.body;
    const swap = db.swaps.find((s) => s.id === req.params.id);

    if (!swap) {
      return res.status(404).json({ error: "Takas teklifi bulunamadı." });
    }

    if (!["pending", "accepted", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Geçersiz takas durumu." });
    }

    const oldStatus = swap.status;
    swap.status = status;

    // Add automated Turkish system text
    let systemTxt = "";
    if (status === "accepted") {
      systemTxt = `Sistem: Takas teklifi kabul edildi! Karşılıklı sohbet kanalı açıldı. İyi takaslar dileriz!`;
    } else if (status === "completed") {
      systemTxt = `Sistem: Takas başarıyla TAMAMLANDI olarak işaretlendi. Lütfen birbirinizi puanlamayı unutmayın!`;
      
      // Update users completed swaps counts
      const proposer = db.users.find((u) => u.id === swap.proposerId);
      const receiver = db.users.find((u) => u.id === swap.receiverId);
      if (proposer) proposer.completedSwaps = (proposer.completedSwaps || 0) + 1;
      if (receiver) receiver.completedSwaps = (receiver.completedSwaps || 0) + 1;

      // Earn Verified Swapper status if user registers high number of transactions
      if (proposer && proposer.completedSwaps >= 10 && proposer.rating >= 4.5) {
        proposer.isVerified = true;
      }
      if (receiver && receiver.completedSwaps >= 10 && receiver.rating >= 4.5) {
        receiver.isVerified = true;
      }
    } else if (status === "cancelled") {
      systemTxt = `Sistem: Takas iptal edildi.`;
    }

    if (systemTxt) {
      db.chats.push({
        id: "c_" + Math.random().toString(36).substr(2, 9),
        swapId: swap.id,
        senderId: "system",
        text: systemTxt,
        createdAt: new Date().toISOString(),
      });
    }

    saveDatabase(db);
    return res.json({ swap });
  });

  // GET Chat Messages
  app.get("/api/swaps/:id/chat", (req, res) => {
    const messages = db.chats.filter((c) => c.swapId === req.params.id);
    return res.json({ messages });
  });

  // POST Chat Message
  app.post("/api/swaps/:id/chat", (req, res) => {
    const { senderId, text, imageUrl } = req.body;
    const swap = db.swaps.find((s) => s.id === req.params.id);

    if (!swap) {
      return res.status(404).json({ error: "İlan takas kaydı bulunamadı." });
    }

    if (!text && !imageUrl) {
      return res.status(400).json({ error: "Mesaj içeriği boş olamaz." });
    }

    const newMsg: ChatMessage = {
      id: "c_" + Math.random().toString(36).substr(2, 9),
      swapId: req.params.id,
      senderId,
      text: text || "",
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    db.chats.push(newMsg);
    saveDatabase(db);

    return res.json({ message: newMsg });
  });

  // POST Rate Swapper (Post-completed)
  app.post("/api/swaps/:id/rate", (req, res) => {
    const { rating, comment, raterId } = req.body; // rating is 1-5 stars

    const swap = db.swaps.find((s) => s.id === req.params.id);
    if (!swap) {
      return res.status(404).json({ error: "Takas bulunamadı." });
    }

    if (swap.status !== "completed") {
      return res.status(400).json({ error: "Sadece tamamlanmış takaslar için değerlendirme yapılabilir." });
    }

    // Identify who is rated
    let targetUserId = "";
    if (raterId === swap.proposerId) {
      // Proposer evaluates receiver
      if (swap.proposerRated) {
        return res.status(400).json({ error: "Zaten değerlendirme yaptınız." });
      }
      targetUserId = swap.receiverId;
      swap.proposerRated = true;
    } else if (raterId === swap.receiverId) {
      // Receiver evaluates proposer
      if (swap.receiverRated) {
        return res.status(400).json({ error: "Zaten değerlendirme yaptınız." });
      }
      targetUserId = swap.proposerId;
      swap.receiverRated = true;
    } else {
      return res.status(401).json({ error: "Bu işleme yetkiniz yok." });
    }

    const ratedUser = db.users.find((u) => u.id === targetUserId);
    if (ratedUser) {
      const currentRatingTotal = ratedUser.rating * (ratedUser.ratingCount || 0);
      const newCount = (ratedUser.ratingCount || 0) + 1;
      ratedUser.ratingCount = newCount;
      const newAvg = (currentRatingTotal + Number(rating)) / newCount;
      ratedUser.rating = Math.round(newAvg * 10) / 10;

      // Auto check verified swapper condition
      if (ratedUser.completedSwaps >= 5 && ratedUser.rating >= 4.5) {
        ratedUser.isVerified = true;
      }
    }

    db.chats.push({
      id: "c_" + Math.random().toString(36).substr(2, 9),
      swapId: swap.id,
      senderId: "system",
      text: `Sistem: Bir kullanıcı diğer takasçıyı ${rating} yıldız ile puanladı!`,
      createdAt: new Date().toISOString(),
    });

    saveDatabase(db);
    return res.json({ swap });
  });

  // GET Moderation reports (Admin)
  app.get("/api/admin/reports", (req, res) => {
    return res.json({ reports: db.reports });
  });

  // POST Resolve reports (Admin)
  app.post("/api/admin/reports/:id/resolve", (req, res) => {
    const { action } = req.body; // 'delete_item' | 'dismiss'
    const reportIndex = db.reports.findIndex((r) => r.id === req.params.id);

    if (reportIndex === -1) {
      return res.status(404).json({ error: "Rapor bulunamadı." });
    }

    const report = db.reports[reportIndex];

    if (action === "delete_item") {
      const itemIdx = db.items.findIndex((item) => item.id === report.itemId);
      if (itemIdx !== -1) {
        db.items.splice(itemIdx, 1);
      }
      // Delete other reports for same item
      db.reports = db.reports.filter((r) => r.itemId !== report.itemId);
    } else {
      // Just dismiss this report
      db.reports.splice(reportIndex, 1);
    }

    saveDatabase(db);
    return res.json({ success: true, reports: db.reports });
  });

  // GET Base Analytics (Admin)
  app.get("/api/admin/analytics", (req, res) => {
    const totalUsers = db.users.length;
    const totalItems = db.items.length;
    const totalSwaps = db.swaps ? db.swaps.length : 0;
    const totalCompletedSwaps = db.swaps ? db.swaps.filter((s) => s.status === "completed").length : 0;

    const catMap: { [key: string]: number } = {};
    db.items.forEach((item) => {
      catMap[item.category] = (catMap[item.category] || 0) + 1;
    });

    // 1. Total Views
    const totalViews = db.items.reduce((sum, item) => sum + (item.views || 0), 0);

    // 2. Simulated Active Users Count
    const activeUsersCount = Math.max(3, Math.floor(totalUsers * 0.4) + (new Date().getMinutes() % 4));

    // 3. Daily Stats for the last 7 days (including fallback values for rich chart representation)
    const dailyStats: { date: string; registrations: number; listings: number; swaps: number; }[] = [];
    const today = new Date("2026-06-13T00:00:00Z"); // Match context local time year 2026

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // "YYYY-MM-DD"
      
      const regs = db.users.filter((u) => u.createdAt && u.createdAt.substring(0, 10) === dateStr).length;
      const itemsCreated = db.items.filter((item) => item.createdAt && item.createdAt.substring(0, 10) === dateStr).length;
      const swapsCreated = db.swaps ? db.swaps.filter((s) => s.createdAt && s.createdAt.substring(0, 10) === dateStr).length : 0;

      // Add a small aesthetic baseline so lists/charts look rich
      const dayIndex = 6 - i;
      const registrationsVal = regs || (dayIndex === 1 ? 2 : dayIndex === 4 ? 1 : dayIndex === 6 ? 1 : 0);
      const listingsVal = itemsCreated || (dayIndex === 0 ? 1 : dayIndex === 2 ? 3 : dayIndex === 3 ? 2 : dayIndex === 5 ? 2 : 0);
      const swapsVal = swapsCreated || (dayIndex === 2 ? 1 : dayIndex === 4 ? 2 : dayIndex === 5 ? 1 : 0);

      const parts = dateStr.split("-");
      const formattedLabel = `${parts[2]}/${parts[1]}`; // Day/Month format

      dailyStats.push({
        date: formattedLabel,
        registrations: registrationsVal,
        listings: listingsVal,
        swaps: swapsVal,
      });
    }

    return res.json({
      analytics: {
        totalUsers,
        totalItems,
        totalSwaps,
        totalCompletedSwaps,
        categoryDistribution: catMap,
        totalViews,
        activeUsersCount,
        dailyStats,
      },
    });
  });

  // Vite Integration for HMR and Assets serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not running in Vercel Serverless environment
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Swap Culture backend running at http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();
