import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "database.json");

// Middleware to parse large JSON (since base64 images are sent during listing uploads)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper to load/save database.json
interface LocalDB {
  users: any[];
  items: any[];
  swaps: any[];
  chats: any[];
  reports: any[];
}

const INITIAL_USERS = [
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
    createdAt: "2026-01-10T00:00:00.000Z"
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
    createdAt: "2026-02-15T00:00:00.000Z"
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
    createdAt: "2026-03-01T00:00:00.000Z"
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
    createdAt: "2026-03-12T00:00:00.000Z"
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
    createdAt: "2026-04-02T00:00:00.000Z"
  }
];

const INITIAL_ITEMS = [
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
    views: 142
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
    views: 298
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
    views: 78
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
    views: 95
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
    views: 121
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
    views: 64
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
    views: 104
  }
];

const INITIAL_SWAPS = [
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
    createdAt: "2026-06-09T12:00:00Z"
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
    createdAt: "2026-06-10T15:40:00Z"
  }
];

const INITIAL_CHATS = [
  {
    id: "c1",
    swapId: "s1",
    senderId: "u2_elif",
    text: "Merhaba! Kahve makinesi neredeyse sıfır durumda, kutusuyla gönderebilirim.",
    createdAt: "2026-06-09T12:05:00Z"
  },
  {
    id: "c2",
    swapId: "s1",
    senderId: "u1_mucahit",
    text: "Harika bir teklif! Harry Potter seti de kitaplıkta çok iyi korundu. PTT kargo ile karşılıklı takaslaşalım mı?",
    createdAt: "2026-06-10T10:15:00Z"
  },
  {
    id: "c3",
    swapId: "s1",
    senderId: "u2_elif",
    text: "Çok sevinirim. Ben Eskişehir'den kargoya veririm yarın.",
    createdAt: "2026-06-10T12:00:00Z"
  }
];

const INITIAL_REPORTS = [
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

function loadDB(): LocalDB {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.items && parsed.items.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading database.json, using fallback draft:", err);
  }
  
  // Seed the database with our default items and users so it is synchronized from day one!
  const defaultDB: LocalDB = {
    users: INITIAL_USERS,
    items: INITIAL_ITEMS,
    swaps: INITIAL_SWAPS,
    chats: INITIAL_CHATS,
    reports: INITIAL_REPORTS
  };
  saveDB(defaultDB);
  return defaultDB;
}

function saveDB(db: LocalDB) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to database.json:", err);
  }
}

// Ensure database file exits on load
loadDB();

// -----------------------------------------------------------------------------
// REST API ENDPOINTS
// -----------------------------------------------------------------------------

// 1. Items API
app.get("/api/items", (req, res) => {
  const db = loadDB();
  res.json(db.items || []);
});

app.post("/api/items", (req, res) => {
  const db = loadDB();
  const newItem = req.body;
  if (!newItem.id) {
    newItem.id = "i_" + Math.random().toString(36).substring(2, 11);
  }
  if (!db.items) db.items = [];
  
  // Unshift so it appears first in listings
  db.items.unshift(newItem);
  saveDB(db);
  res.json(newItem);
});

app.delete("/api/items/:id", (req, res) => {
  const db = loadDB();
  const itemId = req.params.id;
  if (db.items) {
    db.items = db.items.filter((item) => item.id !== itemId);
  }
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/items/:id/view", (req, res) => {
  const db = loadDB();
  const itemId = req.params.id;
  const item = db.items?.find((i) => i.id === itemId);
  if (item) {
    item.views = (item.views || 0) + 1;
    saveDB(db);
    res.json(item);
  } else {
    res.status(404).json({ error: "Item not found" });
  }
});

// 2. Users API
app.get("/api/users", (req, res) => {
  const db = loadDB();
  res.json(db.users || []);
});

app.post("/api/users", (req, res) => {
  const db = loadDB();
  const user = req.body;
  if (!user.id) {
    user.id = "u_" + Math.random().toString(36).substring(2, 11);
  }
  if (!db.users) db.users = [];

  const index = db.users.findIndex((u) => u.id === user.id || u.email?.toLowerCase() === user.email?.toLowerCase());
  if (index !== -1) {
    // Update existing user
    db.users[index] = { ...db.users[index], ...user };
    saveDB(db);
    res.json(db.users[index]);
  } else {
    // Add new user
    db.users.push(user);
    saveDB(db);
    res.json(user);
  }
});

// 3. Swaps API
app.get("/api/swaps", (req, res) => {
  const db = loadDB();
  res.json(db.swaps || []);
});

app.post("/api/swaps", (req, res) => {
  const db = loadDB();
  const swap = req.body;
  if (!swap.id) {
    swap.id = "s_" + Math.random().toString(36).substring(2, 11);
  }
  if (!db.swaps) db.swaps = [];

  const index = db.swaps.findIndex((s) => s.id === swap.id);
  if (index !== -1) {
    db.swaps[index] = { ...db.swaps[index], ...swap };
    saveDB(db);
    res.json(db.swaps[index]);
  } else {
    db.swaps.unshift(swap);
    saveDB(db);
    res.json(swap);
  }
});

app.post("/api/swaps/:id/status", (req, res) => {
  const db = loadDB();
  const { status, updaterId } = req.body;
  const swapId = req.params.id;
  const swap = db.swaps?.find((s) => s.id === swapId);
  if (swap) {
    swap.status = status;
    if (status === "completed") {
      const propU = db.users?.find((u) => u.id === swap.proposerId);
      const recU = db.users?.find((u) => u.id === swap.receiverId);
      if (propU) propU.completedSwaps = (propU.completedSwaps || 0) + 1;
      if (recU) recU.completedSwaps = (recU.completedSwaps || 0) + 1;
    }
    saveDB(db);
    res.json(swap);
  } else {
    res.status(404).json({ error: "Swap offer not found" });
  }
});

// 4. Chats API
app.get("/api/chats", (req, res) => {
  const db = loadDB();
  res.json(db.chats || []);
});

app.post("/api/chats", (req, res) => {
  const db = loadDB();
  const chat = req.body;
  if (!chat.id) {
    chat.id = "c_" + Math.random().toString(36).substring(2, 11);
  }
  if (!db.chats) db.chats = [];
  db.chats.push(chat);
  saveDB(db);
  res.json(chat);
});

// 5. Reports API
app.get("/api/reports", (req, res) => {
  const db = loadDB();
  res.json(db.reports || []);
});

app.post("/api/reports", (req, res) => {
  const db = loadDB();
  const report = req.body;
  if (!report.id) {
    report.id = "r_" + Math.random().toString(36).substring(2, 11);
  }
  if (!db.reports) db.reports = [];
  db.reports.unshift(report);
  
  // also increment reportsCount of the item
  const item = db.items?.find((i) => i.id === report.itemId);
  if (item) {
    item.reportsCount = (item.reportsCount || 0) + 1;
  }
  saveDB(db);
  res.json(report);
});


// -----------------------------------------------------------------------------
// VITE OR STATIC SERVING MIDDLEWARE
// -----------------------------------------------------------------------------
async function startServer() {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
