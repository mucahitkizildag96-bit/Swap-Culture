import React, { useState, useEffect, useRef } from "react";
import { Item, User, SwapOffer } from "../types";
import { proposeSwap, getItems, reportItem, formatDisplayName, deleteItem, incrementView } from "../utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, 
  MessageSquare, 
  MapPin, 
  RefreshCw, 
  AlertTriangle, 
  ChevronUp, 
  ChevronDown, 
  Check, 
  User as UserIcon, 
  Plus, 
  Eye, 
  Share2,
  X,
  Info,
  ArrowUpDown,
  Trash2,
  CheckCircle2
} from "lucide-react";

interface DiscoveryFeedProps {
  currentUser: User;
  userItems: Item[];
  allUsers?: User[];
  onAddFirstItem: () => void;
  onNavigateToSwaps: () => void;
}

export default function DiscoveryFeed({ 
  currentUser, 
  userItems, 
  allUsers = [],
  onAddFirstItem,
  onNavigateToSwaps 
}: DiscoveryFeedProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Public Profile Modal State
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);
  
  // Swap Proposal Modal State
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [selectedOfferItemId, setSelectedOfferItemId] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [proposalStatus, setProposalStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [proposalError, setProposalError] = useState("");
  const [monetaryType, setMonetaryType] = useState<'none' | 'give' | 'take'>("none");
  const [monetaryAmount, setMonetaryAmount] = useState<number>(0);

  // Report Modal State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "success">("idle");

  // Details Modal State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Admin delete states
  const [isAdminConfirmingDelete, setIsAdminConfirmingDelete] = useState(false);
  
  // Lightbox view state
  const [avatarLightboxUrl, setAvatarLightboxUrl] = useState<string | null>(null);
  const [feedNotification, setFeedNotification] = useState<string | null>(null);

  // Load Feed Items
  const loadFeed = async () => {
    try {
      setIsLoading(true);
      const allItems = await getItems();
      // Filter out items belonging to current user
      const feedItems = allItems.filter(item => item.userId !== currentUser.id);
      setItems(feedItems);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error loading feed: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminDelete = async () => {
    if (!currentUser.isAdmin) return;
    setIsAdminConfirmingDelete(true);
  };

  const executeAdminDelete = async () => {
    setIsAdminConfirmingDelete(false);
    const activeItem = items[currentIndex];
    if (!activeItem) return;
    
    try {
      const success = await deleteItem(activeItem.id);
      if (success) {
        setFeedNotification("İlan başarıyla kaldırıldı (Yönetici).");
        setTimeout(() => setFeedNotification(null), 3000);
        // Refresh item list
        const allItems = await getItems();
        const feedItems = allItems.filter(item => item.userId !== currentUser.id);
        setItems(feedItems);
        if (currentIndex >= feedItems.length) {
          setCurrentIndex(Math.max(0, feedItems.length - 1));
        }
      } else {
        setFeedNotification("İlan silinirken hata oluştu.");
        setTimeout(() => setFeedNotification(null), 3000);
      }
    } catch (err) {
      console.error("Yönetici silme hatası: ", err);
      setFeedNotification("Hata: Ürün veritabanından silinemedi.");
      setTimeout(() => setFeedNotification(null), 3000);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [currentUser.id]);

  // Real-time View Tracking & Count Synchronization
  useEffect(() => {
    const activeItem = items[currentIndex];
    if (!activeItem) return;

    let isMounted = true;
    const incrementViewFunc = async () => {
      try {
        const updatedItem = await incrementView(activeItem.id);
        if (isMounted && updatedItem) {
          setItems(prevItems => prevItems.map(item => {
            if (item.id === activeItem.id) {
              return { ...item, views: updatedItem.views };
            }
            return item;
          }));
        }
      } catch (err) {
        console.error("Görüntüleme sayısı güncellenemedi: ", err);
      }
    };

    // Trigger increments
    incrementViewFunc();

    return () => {
      isMounted = false;
    };
  }, [currentIndex, items.length]);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsDetailsOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsDetailsOpen(false);
    }
  };

  const activeItem = items[currentIndex];

  const handleSendOffer = async () => {
    if (!activeItem || !selectedOfferItemId) return;

    try {
      setProposalStatus("loading");
      await proposeSwap({
        proposerId: currentUser.id,
        proposerItemId: selectedOfferItemId,
        receiverId: activeItem.userId,
        receiverItemId: activeItem.id,
        message: offerMessage,
        monetaryType,
        monetaryAmount: monetaryType !== 'none' ? Number(monetaryAmount) : 0,
      });
      setProposalStatus("success");
      setTimeout(() => {
        setIsOfferOpen(false);
        setProposalStatus("idle");
        setOfferMessage("");
        setSelectedOfferItemId("");
        setMonetaryType("none");
        setMonetaryAmount(0);
      }, 1800);
    } catch (error: any) {
      setProposalStatus("error");
      setProposalError(error.message || "Teklif gönderilemedi.");
    }
  };

  const handleReportSubmit = async () => {
    if (!activeItem) return;
    try {
      await reportItem(activeItem.id, currentUser.id, reportReason);
      setReportStatus("success");
      setTimeout(() => {
        setIsReportOpen(false);
        setReportStatus("idle");
        setReportReason("");
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  // Viral growth mechanism trigger
  const handleShare = () => {
    const text = `Swap Culture - "${activeItem.title}" ilanı ile harika bir takas fırsatı! Hemen esnek takas dünyasına katıl. "Yeni nesil takas platformu"`;
    if (navigator.share) {
      navigator.share({
        title: "Swap Culture",
        text: text,
        url: window.location.href,
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      alert("Takas ve paylaşım linki kopyalandı!");
    }
  };

  // Listen to keyboard arrow keys for swiping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") handleNext();
      if (e.key === "ArrowUp") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, items]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] text-zinc-400">
        <RefreshCw className="w-10 h-10 animate-spin text-neon mb-4" />
        <p className="text-sm font-sans">İlanlar yükleniyor...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] px-6 text-center">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full mb-4">
          <RefreshCw className="w-10 h-10 text-neon animate-pulse" />
        </div>
        <h3 className="text-white text-xl font-display font-bold mb-2">Henüz ilan bulunmuyor</h3>
        <p className="text-zinc-400 text-sm max-w-sm mb-6">
          Kendi ürünleriniz dışındaki takas edilebilir ilanlar burada sergilenir. İlk ilanı ekleyen siz olun veya sayfayı yenileyin!
        </p>
        <button 
          onClick={loadFeed}
          className="px-5 py-2.5 bg-zinc-900 border border-neon/30 text-neon font-sans rounded-xl hover:bg-neon/10 transition-colors flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Yenile
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-130px)] w-full flex items-center justify-center overflow-hidden bg-dark-bg rounded-3xl" id="discovery-panel">

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeItem.id}
          initial={{ opacity: 0, y: 150 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -150 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full flex flex-col justify-end bg-dark-bg"
        >
          {/* Main Item Cover Image */}
          <div className="absolute inset-x-0 top-0 h-full w-full">
            <img 
              referrerPolicy="no-referrer"
              src={activeItem.imageUrl} 
              alt={activeItem.title} 
              className="w-full h-full object-cover brightness-75 select-none"
            />
            {/* Dark vignette overlay for visibility of text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50 z-10" />
          </div>

          {/* Top-Right Vertical Actions (Views, Share, Report) stacked from top to bottom */}
          <div className="absolute right-3 top-4 flex flex-col gap-3 z-30 select-none">
            {/* Views count */}
            <div className="flex flex-col items-center justify-center w-11 h-11 bg-black/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl text-white select-none animate-fade-in" title="Görüntüleme Sayısı">
              <Eye className="w-4 h-4 text-neon" />
              <span className="text-[9px] font-mono font-bold text-zinc-300 mt-0.5">{activeItem.views || 0}</span>
            </div>

            {/* Share action */}
            <button 
              onClick={handleShare}
              className="flex flex-col items-center justify-center w-11 h-11 bg-black/60 backdrop-blur-md rounded-2xl border border-white/5 hover:bg-zinc-800/60 text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-90 shadow-xl"
              title="Paylaş"
            >
              <Share2 className="w-4 h-4 text-zinc-300" />
              <span className="text-[8px] font-sans font-extrabold mt-0.5">Paylaş</span>
            </button>

            {/* Report action */}
            <button 
              onClick={() => setIsReportOpen(true)}
              className="flex flex-col items-center justify-center w-11 h-11 bg-black/60 backdrop-blur-md rounded-2xl border border-white/5 hover:bg-red-950/40 text-red-400 hover:text-red-350 transition-all cursor-pointer active:scale-90 shadow-xl"
              title="Bildir"
            >
              <AlertTriangle className="w-4 h-4 text-red-500/80" />
              <span className="text-[8px] font-sans font-extrabold mt-0.5">Bildir</span>
            </button>

            {/* Admin Delete Action */}
            {currentUser.isAdmin && (
              <button 
                onClick={handleAdminDelete}
                className="flex flex-col items-center justify-center w-11 h-11 bg-red-950/80 backdrop-blur-md rounded-2xl border border-red-500/30 hover:bg-red-900 text-red-105 hover:text-white transition-all cursor-pointer active:scale-90 shadow-xl animate-pulse"
                title="Yönetici Olarak İlanı Sil"
              >
                <Trash2 className="w-4 h-4 text-red-450 text-red-400" />
                <span className="text-[8px] font-sans font-black mt-0.5 uppercase tracking-tight text-red-350">Sil</span>
              </button>
            )}
          </div>

          {/* Vertical Controls on Sidebar (Right Side) */}
          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 z-30">
            {/* Owner avatar with verified swapper badge */}
            <div 
              onClick={() => {
                const foundUser = allUsers.find(u => u.id === activeItem.userId);
                if (foundUser) {
                  setSelectedProfileUser(foundUser);
                } else {
                  // Fallback user if not found in cache
                  setSelectedProfileUser({
                    id: activeItem.userId,
                    username: activeItem.username,
                    email: `${activeItem.username}@takasgo.com`,
                    avatarUrl: activeItem.userAvatar,
                    city: activeItem.city || "Bursa",
                    rating: activeItem.userRating || 4.9,
                    ratingCount: activeItem.userRatingCount || 12,
                    completedSwaps: 5,
                    bio: "Aktif ve güler yüzlü takasçı! Temiz kullanılmış her türlü teklife açığım.",
                    isVerified: true,
                    isBlocked: false,
                    isAdmin: false,
                    createdAt: new Date().toISOString()
                  });
                }
              }}
              className="flex flex-col items-center bg-black/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md shadow-2xl cursor-pointer hover:border-neon hover:scale-105 active:scale-95 transition-all group"
              title="Kullanıcı Profilini Görüntüle"
            >
              <div className="relative p-0.5 bg-dark-bg rounded-xl border border-dark-border group-hover:border-neon">
                <img 
                  src={activeItem.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                  alt={activeItem.username} 
                  className="w-10 h-10 rounded-xl object-cover border border-dark-border"
                />
                
                {/* Onaylı Profil Mavi Tik Olanağı */}
                <div className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white rounded-full p-0.5 border border-dark-bg flex items-center justify-center scale-95 shadow-md select-none" title="Onaylı Profil">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Micro rating tag & score */}
                <div className="absolute -bottom-1 -right-2 bg-dark-bg rounded-full px-1.5 py-0.5 border border-dark-border flex items-center gap-0.5 scale-75 shadow-lg select-none">
                  <span className="text-[9px] text-amber-500 font-bold leading-none">★</span>
                  <span className="text-[8.5px] font-mono font-bold text-white leading-none">
                    {activeItem.userRating !== undefined ? activeItem.userRating.toFixed(1) : "4.9"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 mt-1 max-w-[56px] justify-center text-center select-none">
                <span className="text-[9px] text-zinc-350 font-mono truncate group-hover:text-neon">
                  {formatDisplayName(activeItem.username)}
                </span>
                <span className="text-[8.5px] text-sky-400 font-black">✓</span>
              </div>
            </div>
          </div>

          {/* Beautiful transparent capsule for navigations arrows - placed neatly on right side, highly accessible */}
          <div className="absolute right-3 top-[38%] -translate-y-[38%] flex flex-col gap-1.5 p-1 px-1.5 bg-black/60 backdrop-blur-md rounded-2xl border border-zinc-800/80 z-30 shadow-2xl">
            <button 
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`p-2 rounded-xl text-white transition-all ${currentIndex === 0 ? "opacity-15 cursor-not-allowed" : "hover:bg-zinc-855 hover:bg-zinc-800/60 hover:text-neon text-zinc-300 active:scale-90"}`}
              title="Önceki İlan"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="h-[1px] bg-zinc-800/40 w-4 mx-auto" />
            <button 
              onClick={handleNext}
              disabled={currentIndex === items.length - 1}
              className={`p-2 rounded-xl text-white transition-all ${currentIndex === items.length - 1 ? "opacity-15 cursor-not-allowed" : "hover:bg-zinc-855 hover:bg-zinc-800/60 hover:text-neon text-zinc-300 active:scale-90"}`}
              title="Sonraki İlan"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Card Details (Fully descriptive) */}
          <div className="p-5 pb-5 w-11/12 z-20 pointer-events-auto">
            {/* Condition Banner */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-zinc-900/90 text-zinc-300 border border-zinc-800 uppercase tracking-widest">
                {activeItem.category}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-sans font-semibold border ${
                activeItem.condition === "Yeni" 
                  ? "bg-neon/10 text-neon border-neon/30" 
                  : activeItem.condition === "Az Kullanılmış" 
                  ? "bg-orange-500/15 text-orange-400 border-orange-500/30" 
                  : "bg-zinc-650 text-zinc-400 border-zinc-800"
              }`}>
                {activeItem.condition}
              </span>
              {activeItem.estimatedValue && (
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-sans font-bold bg-emerald-500/20 text-emerald-405 border border-emerald-500/30 flex items-center gap-1">
                  <span>Değer:</span>
                  <span className="text-white">{activeItem.estimatedValue.toLocaleString('tr-TR')} TL</span>
                </span>
              )}
              {/* Dynamic Live Views Badge */}
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-sans font-bold bg-black/40 text-neon border border-neon/30 flex items-center gap-1 shadow-sm select-none">
                <Eye className="w-3.5 h-3.5" />
                <span>{activeItem.views || 0} kişi gördü</span>
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-display font-medium text-white tracking-tight mb-2">
              {activeItem.title}
            </h2>

            <div 
              onClick={() => setIsDetailsOpen(true)}
              className="group cursor-pointer select-none mb-3 text-left"
            >
              <p className="text-zinc-300 text-sm line-clamp-2 pr-4 mb-1 font-sans leading-relaxed group-hover:text-white transition-colors">
                {activeItem.description}
              </p>
              <span className="text-[11px] font-semibold text-neon uppercase tracking-wider flex items-center gap-1 select-none group-hover:underline">
                <Info className="w-3.5 h-3.5" /> İlan Detaylarını Gör
              </span>
            </div>

            {/* swap core condition */}
            <div className="p-3.5 bg-black/70 border border-zinc-900/70 rounded-2xl mb-3 flex items-center justify-between gap-3 backdrop-blur-md select-none">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neon/15 flex items-center justify-center">
                  <ArrowUpDown className="w-3.5 h-3.5 text-neon" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">İstenen Takas Kategorileri</div>
                  <div className="text-sm font-display font-bold text-white leading-tight">
                    {activeItem.targetSwap}
                  </div>
                </div>
              </div>
            </div>

            {/* Real bottom primary CTA button using the brand logo ArrowUpDown as requested */}
            <button
              onClick={() => setIsOfferOpen(true)}
              className="w-full py-4 mb-3 bg-neon hover:bg-neon/90 text-black font-sans font-black uppercase text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.985] select-none"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Takas Teklifi Et</span>
            </button>

            {/* Compact action buttons row at bottom of item panel instead of sidebar - nested close to divider line */}
            <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2.5 mt-2 select-none text-left">
              {/* City location */}
              <div className="flex items-center gap-1.5 text-neon select-none" id="city-badge">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">{activeItem.city}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* SWAP OFFER TRIGGER MODAL PANEL */}
      <AnimatePresence>
        {isOfferOpen && (
          <div className="absolute inset-0 bg-[#000000]/85 backdrop-blur-md z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="bg-dark-bg border-t border-dark-border px-6 py-6 pb-8 rounded-t-[32px] w-full max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5 select-none">
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-neon" /> Takas Teklifi Gönder
                </h3>
                <button 
                  onClick={() => setIsOfferOpen(false)}
                  className="p-1 rounded-full bg-dark-card text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
 
              {proposalStatus === "success" ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-neon/20 ring-4 ring-neon/10 rounded-full flex items-center justify-center text-neon mb-4">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-white font-display font-bold text-lg mb-2">Başarılı!</h4>
                  <p className="text-zinc-400 text-sm font-sans max-w-xs">
                    Takas teklifiniz iletildi. Karşı taraf kabul ettiğinde sohbet üzerinden görüşebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-3 bg-dark-card rounded-2xl border border-dark-border flex gap-3 text-left">
                    <img 
                      src={activeItem.imageUrl} 
                      alt="" 
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div>
                      <div className="text-[10px] text-zinc-500 font-mono">Alıcı Ürün</div>
                      <div className="text-sm font-medium text-white">{activeItem.title}</div>
                      <div className="text-xs text-neon mt-0.5">{activeItem.city}</div>
                    </div>
                  </div>
 
                  <div>
                    <label className="block text-zinc-400 text-xs font-medium uppercase font-mono tracking-wider mb-2">
                      Takas Edeceğiniz Kendi Ürününüz
                    </label>
 
                    {userItems.length === 0 ? (
                      <div className="p-5 border border-dashed border-dark-border rounded-2xl text-center">
                        <p className="text-xs text-zinc-400 font-sans mb-3">
                          Teklif verebilmek için sistemde kayıtlı en az bir ilanınız olmalıdır.
                        </p>
                        <button 
                          onClick={() => {
                            setIsOfferOpen(false);
                            onAddFirstItem();
                          }}
                          className="px-4 py-2 bg-neon text-black font-sans font-bold text-xs rounded-xl hover:opacity-90 inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Ürün Ekle
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5 max-h-[200px] overflow-y-auto no-scrollbar pr-1">
                        {userItems.map(item => (
                          <div 
                            key={item.id}
                            onClick={() => setSelectedOfferItemId(item.id)}
                            className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                              selectedOfferItemId === item.id 
                                ? "bg-neon/10 border-neon" 
                                : "bg-dark-card/60 border-dark-border hover:bg-dark-card hover:border-zinc-700"
                            }`}
                          >
                            <img 
                              src={item.imageUrl} 
                              alt="" 
                              className="w-10 h-10 object-cover rounded-lg border border-dark-border"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-white truncate">{item.title}</div>
                              <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
                                İstenen: {item.targetSwap}
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              selectedOfferItemId === item.id 
                                ? "border-neon bg-neon text-black" 
                                : "border-dark-border"
                            }`}>
                              {selectedOfferItemId === item.id && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
 
                  {/* Değer Dengeleme ve Finansal Ayar */}
                  <div className="p-3.5 bg-dark-card rounded-2xl border border-dark-border space-y-3.5 text-left">
                    <label className="block text-zinc-400 text-xs font-medium uppercase font-mono tracking-wider">
                      Değer Dengeleme (TL)
                    </label>
                    
                    {/* Segmented control for option selection */}
                    <div className="grid grid-cols-3 gap-1 bg-dark-panel p-1 rounded-xl border border-dark-border">
                      <button
                        type="button"
                        onClick={() => { setMonetaryType('none'); setMonetaryAmount(0); }}
                        className={`py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                          monetaryType === 'none' 
                            ? "bg-zinc-800 text-white font-semibold" 
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Kafa Kafaya
                      </button>
                      <button
                        type="button"
                        onClick={() => setMonetaryType('give')}
                        className={`py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                          monetaryType === 'give' 
                            ? "bg-neon text-black font-semibold" 
                            : "text-zinc-500 hover:text-zinc-400"
                        }`}
                      >
                        Para Veriyorum
                      </button>
                      <button
                        type="button"
                        onClick={() => setMonetaryType('take')}
                        className={`py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                          monetaryType === 'take' 
                            ? "bg-cyan-500 text-black font-semibold" 
                            : "text-zinc-500 hover:text-zinc-400"
                        }`}
                      >
                        Para İstiyorum
                      </button>
                    </div>

                    {monetaryType !== 'none' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between items-center text-xs font-sans">
                          <span className="text-zinc-400">Teklif Edilen Ek Tutar:</span>
                          <span className={`font-mono font-bold text-sm ${monetaryType === 'give' ? 'text-neon' : 'text-cyan-400'}`}>
                            {monetaryType === 'give' ? '+' : '-'}{monetaryAmount.toLocaleString('tr-TR')} TL
                          </span>
                        </div>
                        
                        <input
                          type="range"
                          min="0"
                          max="25000"
                          step="100"
                          value={monetaryAmount}
                          onChange={(e) => setMonetaryAmount(Number(e.target.value))}
                          className="w-full accent-neon bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-ew-resize focus:outline-none"
                        />
                        
                        <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                          <span>0 TL</span>
                          <span>12.500 TL</span>
                          <span>25.000 TL</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-medium uppercase font-mono tracking-wider mb-2">
                      Teklif Mesajı (İsteğe Bağlı)
                    </label>
                    <textarea 
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      placeholder="Kartvizit veya selam bırakın. (Örn: İstanbul Bahçelievler'deyim, elden takas yapabilirim...)"
                      rows={3}
                      className="w-full bg-dark-card border border-dark-border text-zinc-200 p-3 rounded-2xl text-xs placeholder:text-zinc-650 focus:outline-none focus:border-neon font-sans"
                    />
                  </div>

                  {proposalStatus === "error" && (
                    <p className="text-red-500 text-xs text-center font-sans">
                      {proposalError}
                    </p>
                  )}

                  <div className="pt-2">
                    <button 
                      onClick={handleSendOffer}
                      disabled={!selectedOfferItemId || proposalStatus === "loading"}
                      className={`w-full py-3.5 bg-neon text-black text-sm font-sans font-black uppercase rounded-2xl hover:opacity-95 transition-opacity flex items-center justify-center gap-2 ${
                        (!selectedOfferItemId || proposalStatus === "loading") ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {proposalStatus === "loading" ? "Gönderiliyor..." : "Teklifi İlet"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REPORT MODAL PANEL */}
      <AnimatePresence>
        {isReportOpen && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col justify-center px-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-bg border border-dark-border px-6 py-6 rounded-3xl w-full max-w-sm mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-display font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" /> İlanı Rapor Et
                </h3>
                <button 
                  onClick={() => setIsReportOpen(false)}
                  className="p-1 rounded-full bg-dark-card text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reportStatus === "success" ? (
                <div className="py-6 text-center">
                  <Check className="w-12 h-12 text-neon mx-auto mb-3" />
                  <p className="text-white text-sm">Geri bildiriminiz alındı. Teşekkür ederiz.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-zinc-400 text-xs font-sans">
                    Bu ilanla ilgili bir problem mi mevcut? Lütfen gerekçenizi seçin veya yazın:
                  </p>

                  <div className="space-y-2">
                    {[
                      "Yorucu veya sahte ilan, takas niyeti yok",
                      "Uyuşturucu, silah veya yasa dışı içerik",
                      "Müstehcen veya kaba görseller",
                      "İletişim bilgilerini kötüye kullanma"
                    ].map(reason => (
                      <button
                        key={reason}
                        onClick={() => setReportReason(reason)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs border transition-colors ${
                          reportReason === reason 
                            ? "bg-red-500/10 border-red-500 text-white font-medium" 
                            : "bg-dark-card border border-dark-border text-zinc-400 hover:bg-dark-panel hover:text-white"
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Diğer gerekçeler..."
                    rows={2}
                    className="w-full bg-dark-card border border-dark-border text-zinc-200 p-3 rounded-xl text-xs focus:outline-none focus:border-red-500 font-sans"
                  />

                  <button
                    onClick={handleReportSubmit}
                    disabled={!reportReason}
                    className="w-full py-2.5 bg-red-650 hover:bg-red-700 text-white text-xs font-sans font-bold uppercase rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Raporu Gönder (Admin Tarafına)
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRODUCT DETAILS MODAL PANEL */}
      <AnimatePresence>
        {isDetailsOpen && (
          <div className="absolute inset-0 bg-[#000000]/90 backdrop-blur-md z-50 flex flex-col justify-end text-left">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="bg-dark-bg border-t border-dark-border px-6 py-6 pb-8 rounded-t-[32px] w-full max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5 select-none">
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-neon" /> İlan Detayları
                </h3>
                <button 
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-1 rounded-full bg-dark-card text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Image & Title Header */}
                <div className="relative h-48 rounded-2xl overflow-hidden border border-dark-border">
                  <img 
                    referrerPolicy="no-referrer"
                    src={activeItem.imageUrl} 
                    alt={activeItem.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
                  <div className="absolute bottom-4 left-4 right-4 text-left">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-sans font-bold bg-black/75 border border-dark-border text-neon uppercase tracking-widest mr-2 inline-block">
                      {activeItem.category}
                    </span>
                    <h4 className="text-white font-display font-bold text-base mt-1.5 md:text-lg leading-tight">
                      {activeItem.title}
                    </h4>
                  </div>
                </div>

                {/* Info Pills */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-dark-card rounded-2xl border border-dark-border text-left">
                    <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Ürün Durumu</div>
                    <div className={`text-xs font-semibold ${
                      activeItem.condition === "Yeni" 
                        ? "text-neon" 
                        : activeItem.condition === "Az Kullanılmış" 
                        ? "text-orange-400" 
                        : "text-zinc-400"
                    }`}>
                      {activeItem.condition}
                    </div>
                  </div>
                  <div className="p-3 bg-dark-card rounded-2xl border border-dark-border text-left">
                    <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Konum / Şehir</div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neon" /> {activeItem.city}
                    </div>
                  </div>

                  {activeItem.estimatedValue && (
                    <div className="col-span-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-left flex justify-between items-center select-none">
                      <div>
                        <div className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider mb-0.5">Yaklaşık Değeri</div>
                        <div className="text-sm font-bold text-emerald-400">{activeItem.estimatedValue.toLocaleString('tr-TR')} TL</div>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-sans italic">Değer dengesi sağlar</span>
                    </div>
                  )}
                </div>

                {/* Full Description */}
                <div className="p-4 bg-dark-card rounded-2xl border border-dark-border text-left space-y-1.5">
                  <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Açıklama</div>
                  <p className="text-zinc-350 text-xs font-sans leading-relaxed whitespace-pre-wrap">
                    {activeItem.description}
                  </p>
                </div>

                {/* Target Swap Conditions */}
                <div className="p-4 bg-neon/5 border border-neon/30 rounded-2xl text-left space-y-1.5 font-sans">
                  <div className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-neon" /> İstenen Takas Kategorileri
                  </div>
                  <div className="text-sm font-display font-extrabold text-white">
                    {activeItem.targetSwap}
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    İlan sahibi bu ürünü yukarıda belirtilen takas kategorisindeki ürünlerle değiştirmek istiyor.
                  </p>
                </div>

                {/* User/Owner Detail Row */}
                <div className="p-4 bg-dark-panel rounded-2xl border border-dark-border flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAvatarLightboxUrl(activeItem.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150");
                      }}
                      className="relative cursor-zoom-in active:scale-95 transition-all hover:scale-105 shrink-0 select-none focus:outline-none"
                      title="Profil fotoğrafını büyüt"
                    >
                      <img 
                        src={activeItem.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                        alt={activeItem.username} 
                        className="w-10 h-10 rounded-full object-cover border border-dark-border"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-sky-500 rounded-full p-0.5 text-[8px] text-white font-bold leading-none border border-dark-panel flex items-center justify-center w-3.5 h-3.5" title="Onaylı Profil">
                        ✓
                      </div>
                    </button>
                    <div>
                      <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">İlan Sahibi</div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1">
                        <span>@{formatDisplayName(activeItem.username)}</span>
                        <span className="text-sky-400 font-bold" title="Onaylı Profil">✓</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider font-medium">İzlenme</div>
                    <div className="text-xs font-semibold text-zinc-350">{activeItem.views || 0} görüntüleme</div>
                  </div>
                </div>

                {/* Dual Action Drawer Footer Buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button 
                    onClick={() => setIsDetailsOpen(false)}
                    className="flex-1 py-3 bg-dark-card border border-dark-border text-zinc-300 text-xs font-sans font-bold uppercase rounded-2xl hover:text-white hover:bg-dark-panel transition-all cursor-pointer"
                  >
                    Geri Dön
                  </button>
                  <button 
                    onClick={() => {
                      setIsDetailsOpen(false);
                      setIsOfferOpen(true);
                    }}
                    className="flex-1 py-3 bg-neon text-black text-xs font-sans font-black uppercase rounded-2xl hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" /> Takas Teklifi
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PUBLIC PROFILE OVERLAY MODAL */}
      <AnimatePresence>
        {selectedProfileUser && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-lg z-50 flex flex-col justify-end font-sans">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="bg-dark-bg border-t border-dark-border px-5 py-6 rounded-t-[32px] w-full max-h-[85vh] overflow-y-auto flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Kullanıcı Profili</h3>
                <button
                  onClick={() => setSelectedProfileUser(null)}
                  className="p-1 px-3 py-1 text-xs text-zinc-450 text-zinc-300 bg-zinc-900 hover:text-white hover:bg-zinc-800 rounded-xl font-mono cursor-pointer transition-colors"
                >
                  Kapat ✕
                </button>
              </div>

              {/* Profile Card Summary */}
              <div className="flex items-start gap-4 mb-5">
                <button
                  type="button"
                  onClick={() => setAvatarLightboxUrl(selectedProfileUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150")}
                  className="relative shrink-0 select-none cursor-zoom-in active:scale-95 transition-all hover:scale-105 rounded-2xl overflow-hidden focus:outline-none"
                  title="Profil fotoğrafını büyüt"
                >
                  <img
                    src={selectedProfileUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                    alt={selectedProfileUser.username}
                    className="w-16 h-16 rounded-2xl object-cover border border-dark-border shadow-md"
                  />
                  {selectedProfileUser.isVerified && (
                    <div className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white rounded-full p-0.5 border border-dark-bg flex items-center justify-center w-5 h-5 shadow-sm">
                      <span className="text-[10px] font-black">✓</span>
                    </div>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-base font-bold text-white tracking-tight truncate">
                      @{formatDisplayName(selectedProfileUser.username)}
                    </h4>
                  </div>
                  
                  {/* Verification Badges */}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {selectedProfileUser.phoneVerified ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Telefon Doğrulandı</span>
                      </span>
                    ) : (
                      <span className="bg-zinc-900/55 text-zinc-500 border border-zinc-900 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 select-none">
                        <X className="w-3 h-3 text-zinc-650" />
                        <span>Telefon Onaysız</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 select-none">
                    <span className="flex items-center gap-0.5 text-amber-500 font-extrabold">
                      ★ {selectedProfileUser.rating?.toFixed(1) || "4.9"}
                    </span>
                    <span className="text-zinc-700">•</span>
                    <span className="text-zinc-300 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-neon" /> {selectedProfileUser.city || "Bursa"}
                    </span>
                  </div>

                  {selectedProfileUser.bio && (
                    <p className="text-xs text-zinc-300 mt-2.5 line-clamp-2 leading-relaxed bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900/60 font-sans italic">
                      "{selectedProfileUser.bio}"
                    </p>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5 select-none">
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/40 rounded-2xl text-center">
                  <div className="text-[9.5px] font-mono text-zinc-550 text-zinc-500 uppercase tracking-widest">Başarılı Takas</div>
                  <div className="text-base font-black text-neon mt-0.5">
                    {selectedProfileUser.completedSwaps ?? 3}
                  </div>
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/40 rounded-2xl text-center">
                  <div className="text-[9.5px] font-mono text-zinc-550 text-zinc-500 uppercase tracking-widest">Geri Bildirimler</div>
                  <div className="text-base font-black text-white mt-0.5">
                    {selectedProfileUser.rating?.toFixed(1) || "5.0"} / 5
                  </div>
                </div>
              </div>

              {/* Active Listings Grid of this Owner */}
              <div className="flex-1 flex flex-col min-h-0">
                <h5 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 select-none">
                  <span>Aktif Takas Ürünleri</span>
                  <span className="px-1.5 py-0.5 text-[8.5px] bg-neon/15 text-neon font-black rounded-lg font-sans">
                    {items.filter(item => item.userId === selectedProfileUser.id).length} İlan
                  </span>
                </h5>

                {items.filter(item => item.userId === selectedProfileUser.id).length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-8">Kullanıcının şu an başka aktif ürünü bulunmuyor.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[32vh] pr-1 pb-2">
                    {items.filter(item => item.userId === selectedProfileUser.id).map(item => {
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            const indexInFeed = items.findIndex(it => it.id === item.id);
                            if (indexInFeed !== -1) {
                              setCurrentIndex(indexInFeed);
                              setSelectedProfileUser(null);
                            }
                          }}
                          className={`group bg-dark-card border rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-neon hover:scale-[1.01] flex flex-col ${
                            item.id === activeItem.id ? 'border-neon/30 bg-neon/5' : 'border-dark-border'
                          }`}
                        >
                          <div className="relative h-20 w-full overflow-hidden select-none">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute top-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-sans font-bold text-zinc-300 border border-white/5">
                              {item.condition}
                            </div>
                            {item.id === activeItem.id && (
                              <div className="absolute inset-0 bg-neon/5 backdrop-blur-[0.5px] flex items-center justify-center">
                                <span className="bg-neon text-black text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider select-none">Bu Üründesiniz</span>
                              </div>
                            )}
                          </div>
                          <div className="p-2 flex-1 flex flex-col justify-between text-left">
                            <p className="text-[11px] font-bold text-white truncate group-hover:text-neon leading-tight">{item.title}</p>
                            <p className="text-[9.5px] text-zinc-500 mt-0.5 truncate font-mono uppercase">{item.category}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin actions Feedback Toaster */}
      {feedNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-neon text-black text-xs font-bold font-sans px-4 py-2.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce whitespace-nowrap">
          <span>{feedNotification}</span>
        </div>
      )}

      {/* Admin delete overlay modal */}
      {isAdminConfirmingDelete && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-5 z-50 animate-fade-in select-none">
          <div className="bg-dark-card border border-dark-border p-5 rounded-2xl w-full max-w-[280px] text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase font-mono tracking-wider">İlanı Sil?</h4>
              <p className="text-[10px] text-zinc-450 text-zinc-400 mt-1.5 leading-normal">
                "{items[currentIndex]?.title}" başlıklı ilanı yönetici yetkisiyle tamamen silmek istediğinize emin misiniz?
              </p>
            </div>
            <div className="flex gap-2 font-sans pt-1">
              <button
                onClick={() => setIsAdminConfirmingDelete(false)}
                className="flex-1 py-2 bg-dark-panel hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded-xl border border-dark-border transition-all cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={executeAdminDelete}
                className="flex-1 py-2 bg-red-650 hover:bg-red-700 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
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
              {/* Box frame */}
              <div className="relative rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 flex items-center justify-center aspect-square max-w-[320px] max-h-[320px] sm:max-w-[380px] sm:max-h-[380px]">
                <img 
                  src={avatarLightboxUrl} 
                  alt="Büyük Boy Profil Fotoğrafı" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Close and info overlay */}
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
