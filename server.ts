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

function loadDB(): LocalDB {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading database.json, using fallback draft:", err);
  }
  return { users: [], items: [], swaps: [], chats: [], reports: [] };
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
