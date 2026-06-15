import React, { useState, useEffect } from "react";
import { User, Item, SwapOffer } from "./types";
import { getItems, getAdminUsers, formatDisplayName } from "./utils";
import { getTranslation } from "./utils/i18n";
import Onboarding from "./components/Onboarding";
import DiscoveryFeed from "./components/DiscoveryFeed";
import ListingForm from "./components/ListingForm";
import MySwaps from "./components/MySwaps";
import Chats from "./components/Chats";
import UserProfile from "./components/UserProfile";
import AdminPanel from "./components/AdminPanel";
import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, 
  PlusSquare, 
  ArrowLeftRight, 
  ArrowUpDown,
  User as UserIcon, 
  ShieldCheck, 
  RefreshCw,
  MapPin,
  Sparkles,
  Search,
  MessageCircle,
  CheckCircle2
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"keşfet" | "ekle" | "teklifler" | "profil" | "admin">("keşfet");
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [avatarLightboxUrl, setAvatarLightboxUrl] = useState<string | null>(null);
  const appLanguage = "tr";
  
  const t = (key: string) => getTranslation(key, "tr");
  
  // Chat viewport focus
  const [activeChatSwap, setActiveChatSwap] = useState<SwapOffer | null>(null);

  // Floating feedback popups
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Load items on mount
  const refreshItemsData = async () => {
    try {
      const items = await getItems();
      setAllItems(items);
    } catch (err) {
      console.error("Error refreshing items: ", err);
    }
  };

  const refreshAllUsersData = async () => {
    try {
      const usersData = await getAdminUsers();
      setAllUsers(usersData);
    } catch (err) {
      console.error(err);
    }
  };

  // Recover user session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("swap_culture_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
      } catch (err) {
        console.error("Error loading session:", err);
      }
    }
    refreshItemsData();
    refreshAllUsersData();
  }, []);

  // Update localStorage session when user state changes
  const handleUserSession = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      try {
        localStorage.setItem("swap_culture_user", JSON.stringify(user));
      } catch (err) {
        console.warn("Failed to persist user session to localStorage:", err);
      }
      // Refresh user details list and item listings
      refreshAllUsersData();
      refreshItemsData();
    } else {
      try {
        localStorage.removeItem("swap_culture_user");
      } catch (err) {
        console.warn("Failed to remove user session from localStorage:", err);
      }
      refreshItemsData();
      refreshAllUsersData();
    }
  };

  // Switch active user testing helper
  const handleSwitchTestingUser = (newUser: User) => {
    setCurrentUser(newUser);
    try {
      localStorage.setItem("swap_culture_user", JSON.stringify(newUser));
    } catch (err) {
      console.warn("Failed to persist user session after user switch to localStorage:", err);
    }
    refreshItemsData();
    refreshAllUsersData();
  };

  // Actions callbacks
  const handleListingCreated = (newItem: Item) => {
    // Add to cache
    setAllItems(prev => [newItem, ...prev]);
    // Redirect to discover feed
    setActiveTab("keşfet");
    showToast("Tebrikler! İlanınız başarıyla yayına alındı. Onu 'Profil > Aktif İlanlarım' sekmesinden görebilirsiniz.");
  };

  const handleItemDeleted = async (itemId: string, skipConfirm = false) => {
    if (skipConfirm || window.confirm("Bu ilanı kaldırmak istediğinize emin misiniz?")) {
      try {
        const { deleteItem } = await import("./utils");
        await deleteItem(itemId);
        refreshItemsData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Compute stats of registered user
  const userItems = currentUser 
    ? allItems.filter(item => item.userId === currentUser.id)
    : [];

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col justify-center items-center py-0 sm:py-6 selection:bg-neon/30 select-none">
      {/* Centered Mobile Sandbox for high fidelity preview */}
      <div 
        className="w-full max-w-md h-screen sm:h-[840px] bg-[#000000] text-zinc-100 flex flex-col relative sm:rounded-[40px] sm:border-8 sm:border-dark-outer shadow-2xl shadow-black overflow-hidden"
        id="applet-viewport"
      >
        {/* Floating Toast notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 16 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-4 right-4 z-50 p-4 bg-zinc-900/95 border border-emerald-500/30 text-emerald-400 rounded-2xl shadow-2xl flex items-start gap-3 backdrop-blur-md"
            >
              <div className="p-1 rounded-full bg-emerald-500/15 text-emerald-400 mt-0.5 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs font-sans leading-relaxed font-semibold">
                {toast.message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Mobile Camera notch and status indicators inside top bezel */}
        <div className="hidden sm:flex h-6 bg-dark-bg items-center justify-between px-6 text-[10px] text-zinc-500 font-mono select-none">
          <span>{new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
          <div className="w-16 h-4 bg-dark-panel rounded-full mx-auto" />
          <div className="flex items-center gap-1.5 align-middle">
            <span>LTE</span>
            <div className="w-4 h-2 bg-dark-card rounded-sm" />
          </div>
        </div>

        {currentUser ? (
          <>
            {/* Elegant Header with Logo and Title */}
            <header className="bg-dark-panel/95 border-b border-dark-border p-4 pb-3.5 backdrop-blur-md z-40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neon/15 flex items-center justify-center text-neon font-black rotate-3">
                  <ArrowUpDown className="w-4 h-4" />
                </div>
                <div className="select-none">
                  <h1 className="text-sm sm:text-md font-display font-black tracking-tight leading-none">
                    <span className="text-white">SWAP</span>{" "}
                    <span className="text-neon filter drop-shadow-[0_0_6px_rgba(234,179,8,0.25)] tracking-wide">CULTURE</span>
                  </h1>
                  {/* Brand Tagline MANDATE */}
                  <span className="text-[7px] font-mono font-bold text-neon uppercase tracking-wider block mt-1">
                    {t("tagline")}
                  </span>
                </div>
              </div>

              {/* Status active account indicators */}
              <div className="flex items-center gap-2">
                {currentUser?.isVerified && (
                  <span className="text-[8px] bg-neon/10 border border-neon/30 text-neon px-1.5 py-0.5 rounded-full uppercase font-mono font-bold">
                    {t("verified_user")}
                  </span>
                )}
                <div className="flex items-center gap-1 bg-dark-card border border-dark-border p-1 pr-2 rounded-full">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentUser?.avatarUrl) {
                        setAvatarLightboxUrl(currentUser.avatarUrl);
                      }
                    }}
                    className="w-5 h-5 rounded-full overflow-hidden shrink-0 cursor-zoom-in active:scale-[0.85] transition-all hover:brightness-110 focus:outline-none"
                    title="Profil fotoğrafını büyüt"
                  >
                    <img 
                      src={currentUser.avatarUrl} 
                      alt={currentUser.username} 
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <span className="text-[10px] text-zinc-300 font-mono font-medium truncate max-w-[70px]">
                    {formatDisplayName(currentUser.username)}
                  </span>
                </div>
              </div>
            </header>

            {/* MAIN ROUTER PORT CLAMPED BY TABS VIEW */}
            <main className="flex-1 overflow-y-auto bg-dark-bg relative">
              <AnimatePresence mode="wait">
                {activeChatSwap ? (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <Chats 
                      activeSwap={activeChatSwap}
                      currentUser={currentUser}
                      onGoBack={() => setActiveChatSwap(null)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="h-full"
                  >
                    {activeTab === "keşfet" && (
                      <DiscoveryFeed 
                        currentUser={currentUser}
                        userItems={userItems}
                        allUsers={allUsers}
                        onAddFirstItem={() => setActiveTab("ekle")}
                        onNavigateToSwaps={() => setActiveTab("teklifler")}
                      />
                    )}

                    {activeTab === "ekle" && (
                      <div className="p-4 pt-6 pb-20">
                        <ListingForm 
                          currentUser={currentUser}
                          onSuccess={handleListingCreated}
                        />
                      </div>
                    )}

                    {activeTab === "teklifler" && (
                      <div className="p-4 pt-6 pb-20">
                        <MySwaps 
                          currentUser={currentUser}
                          onRefreshUser={() => {
                            // retrieve user stats updates
                            if (currentUser) {
                              import("./utils").then(u => u.getUser(currentUser.id)).then(handleUserSession).catch(err => console.log(err));
                            }
                          }}
                          onOpenChat={(swap) => setActiveChatSwap(swap)}
                        />
                      </div>
                    )}

                    {activeTab === "profil" && (
                      <div className="p-4 pt-6 pb-20">
                        <UserProfile 
                          currentUser={currentUser}
                          userItems={userItems}
                          allUsers={allUsers}
                          onProfileUpdated={handleUserSession}
                          onLogout={() => {
                            handleUserSession(null);
                            setActiveChatSwap(null);
                          }}
                          onSwitchUser={handleSwitchTestingUser}
                          onDeleteItem={handleItemDeleted}
                        />
                      </div>
                    )}

                    {activeTab === "admin" && (
                      <div className="p-4 pt-6 pb-20">
                        <AdminPanel 
                          currentUser={currentUser}
                          onRefreshItems={refreshItemsData}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Bottom persistent Apple-style Navigation Bar */}
            {!activeChatSwap && (
              <nav className="absolute bottom-0 inset-x-0 bg-dark-panel/95 border-t border-dark-border p-2.5 px-4 flex justify-between items-center z-45 backdrop-blur-md">
                <button
                  onClick={() => {
                    setActiveTab("keşfet");
                    refreshItemsData();
                  }}
                  className={`flex flex-col items-center gap-1 cursor-pointer select-none transition-colors ${
                    activeTab === "keşfet" ? "text-neon" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Compass className="w-5 h-5" />
                  <span className="text-[10px] font-sans font-semibold">{t("nav_discover")}</span>
                </button>

                <button
                  onClick={() => setActiveTab("ekle")}
                  className={`flex flex-col items-center gap-1 cursor-pointer select-none transition-colors ${
                    activeTab === "ekle" ? "text-neon" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <PlusSquare className="w-5 h-5" />
                  <span className="text-[10px] font-sans font-semibold">{t("nav_add")}</span>
                </button>

                <button
                  onClick={() => setActiveTab("teklifler")}
                  className={`flex flex-col items-center gap-1 cursor-pointer select-none transition-colors ${
                    activeTab === "teklifler" ? "text-neon" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <div className="relative">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-sans font-semibold">{t("nav_offers")}</span>
                </button>

                <button
                  onClick={() => setActiveTab("profil")}
                  className={`flex flex-col items-center gap-1 cursor-pointer select-none transition-colors ${
                    activeTab === "profil" ? "text-neon" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                  <span className="text-[10px] font-sans font-semibold">{t("nav_profile")}</span>
                </button>

                {/* Conditional Admin Hub */}
                {currentUser.isAdmin && (
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`flex flex-col items-center gap-1 cursor-pointer select-none transition-colors ${
                      activeTab === "admin" ? "text-neon" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-sans font-semibold">{t("nav_admin")}</span>
                  </button>
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="flex-1 overflow-y-auto no-scrollbar flex items-center justify-center p-6 bg-dark-bg">
            <Onboarding onLoginSuccess={(user) => handleUserSession(user)} />
          </div>
        )}
      </div>
      
      {/* PORTRAIT/AVATAR LIGHTBOX VIEWER */}
      <AnimatePresence>
        {avatarLightboxUrl && (
          <div 
            className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 select-none"
            onClick={() => setAvatarLightboxUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 210 }}
              className="relative max-w-full max-h-[70vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 flex items-center justify-center aspect-square max-w-[320px] max-h-[320px] sm:max-w-[380px] sm:max-h-[380px]">
                <img 
                  src={avatarLightboxUrl} 
                  alt="Büyük Boy Profil Fotoğrafı" 
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                type="button"
                onClick={() => setAvatarLightboxUrl(null)}
                className="mt-5 px-5 py-2.5 bg-zinc-90 w bg-dark-card border border-dark-border hover:border-zinc-700 hover:text-white rounded-2xl text-xs font-sans font-medium text-zinc-450 text-zinc-300 cursor-pointer transition-colors active:scale-95"
              >
                Kapat ✕
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
