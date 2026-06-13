import React, { useState, useEffect } from "react";
import { SwapOffer, User } from "../types";
import { getSwaps, updateSwapStatus, rateSwap } from "../utils";
import { 
  RefreshCw, 
  ArrowLeftRight, 
  Check, 
  X, 
  MessageCircle, 
  Star, 
  CheckCircle2, 
  Clock, 
  FileText, 
  AlertCircle 
} from "lucide-react";

interface MySwapsProps {
  currentUser: User;
  onOpenChat: (swap: SwapOffer) => void;
  onRefreshUser: () => void;
}

export default function MySwaps({ currentUser, onOpenChat, onRefreshUser }: MySwapsProps) {
  const [swaps, setSwaps] = useState<SwapOffer[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [isLoading, setIsLoading] = useState(true);

  // Rating Modal State
  const [selectedSwapForRating, setSelectedSwapForRating] = useState<SwapOffer | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingStatus, setRatingStatus] = useState<"idle" | "loading" | "success">("idle");

  const loadSwaps = async () => {
    try {
      setIsLoading(true);
      const data = await getSwaps(currentUser.id);
      setSwaps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSwaps();
  }, [currentUser.id]);

  const handleUpdateStatus = async (swapId: string, newStatus: "accepted" | "completed" | "cancelled") => {
    try {
      await updateSwapStatus(swapId, newStatus, currentUser.id);
      loadSwaps();
      onRefreshUser();
    } catch (err) {
      alert("Durum güncellenirken hata oluştu.");
    }
  };

  const handleRateSubmit = async () => {
    if (!selectedSwapForRating) return;
    try {
      setRatingStatus("loading");
      await rateSwap(selectedSwapForRating.id, currentUser.id, ratingValue, ratingComment);
      setRatingStatus("success");
      onRefreshUser();
      setTimeout(() => {
        setSelectedSwapForRating(null);
        setRatingComment("");
        setRatingValue(5);
        setRatingStatus("idle");
        loadSwaps();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Değerlendirme kaydedilemedi.");
      setRatingStatus("idle");
    }
  };

  const receivedSwaps = swaps.filter(s => s.receiverId === currentUser.id);
  const sentSwaps = swaps.filter(s => s.proposerId === currentUser.id);
  const activeList = activeTab === "received" ? receivedSwaps : sentSwaps;

  // Custom status color badge helper
  const renderStatusBadge = (status: SwapOffer["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-sans font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Beklemede
          </span>
        );
      case "accepted":
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-sans font-medium bg-indigo-500/10 text-indigo-450 border border-indigo-550/25 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> Sohbet Aktif
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-sans font-medium bg-neon/10 text-neon border border-neon/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Tamamlandı
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-sans font-medium bg-zinc-800 text-zinc-400 border border-zinc-750 flex items-center gap-1">
            <X className="w-3 h-3" /> İptal Edildi
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-dark-bg border border-dark-border p-6 rounded-[28px]" id="swaps-manager-card">
      {/* Title section */}
      <div className="flex items-center gap-3 mb-6 select-none border-b border-dark-border pb-4">
        <div className="w-9 h-9 rounded-xl bg-neon/15 flex items-center justify-center text-neon">
          <ArrowLeftRight className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-white font-display font-bold text-lg leading-tight">Takas Tekliflerim</h2>
          <p className="text-[10.5px] text-zinc-400 font-mono tracking-wide uppercase mt-0.5">
            Gelen ve giden takasların durumunu takip et
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex bg-dark-panel/60 p-1 rounded-2xl border border-dark-border mb-6">
        <button
          onClick={() => setActiveTab("received")}
          className={`flex-1 py-3 text-xs font-sans font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "received" 
              ? "bg-neon text-black font-semibold shadow-inner" 
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Gelen Teklifler
          {receivedSwaps.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${activeTab === "received" ? "bg-black/80 text-neon" : "bg-dark-card text-white border border-dark-border"}`}>
              {receivedSwaps.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`flex-1 py-3 text-xs font-sans font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "sent" 
              ? "bg-neon text-black font-semibold shadow-inner" 
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Giden Teklifler
          {sentSwaps.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${activeTab === "sent" ? "bg-black/95 text-neon" : "bg-dark-card text-white border border-dark-border"}`}>
              {sentSwaps.length}
            </span>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-neon mb-3" />
          <p className="text-xs font-mono">Veriler güncelleniyor...</p>
        </div>
      ) : activeList.length === 0 ? (
        <div className="py-12 text-center text-zinc-400">
          <Clock className="w-10 h-10 text-zinc-650 mx-auto mb-3 animate-pulse" />
          <p className="text-sm font-sans mb-1 text-white">Takas işlemi bulunamadı</p>
          <p className="text-[11px] font-sans max-w-xs mx-auto">
            {activeTab === "received" 
              ? "Henüz diğer kullanıcılardan ilanlarınıza bir takas teklifi gelmedi." 
              : "Henüz başka ilanlara takas teklifi göndermediniz. Keşfet feed'inden başlayın!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4 text-left">
          {activeList.map(swap => {
            const isOfferer = swap.proposerId === currentUser.id;
            const otherUsername = isOfferer ? swap.receiverUsername : swap.proposerUsername;

            // Rating checking logic
            const alreadyRated = isOfferer ? swap.proposerRated : swap.receiverRated;

            return (
              <div 
                key={swap.id}
                className="bg-dark-card border border-dark-border p-4 rounded-3xl space-y-4"
              >
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-dark-border/40 pb-3">
                  <div className="flex items-center gap-2 select-none">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                      Takas Ortağı:
                    </span>
                    <span className="text-xs font-semibold text-white">@{otherUsername}</span>
                  </div>
                  {renderStatusBadge(swap.status)}
                </div>

                {/* Swapping product comparison layout */}
                <div className="flex items-center justify-between gap-3 text-center bg-dark-bg/40 p-3 rounded-2xl border border-dark-border/20">
                  {/* Left Proposer Item */}
                  <div className="flex-1 min-w-0">
                    <img 
                      src={swap.proposerItemImage} 
                      alt="" 
                      className="w-11 h-11 object-cover rounded-xl border border-dark-border mx-auto mb-1.5"
                    />
                    <div className="text-[10px] text-zinc-500 font-mono truncate">Önerilen Ürün</div>
                    <div className="text-xs font-semibold text-zinc-350 truncate">{swap.proposerItemTitle}</div>
                  </div>

                  {/* Intersect icon */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-dark-panel border border-dark-border flex items-center justify-center text-neon">
                      <ArrowLeftRight className="w-4 h-4 animate-pulse" />
                    </div>
                  </div>

                  {/* Right Receiver Item */}
                  <div className="flex-1 min-w-0">
                    <img 
                      src={swap.receiverItemImage} 
                      alt="" 
                      className="w-11 h-11 object-cover rounded-xl border border-dark-border mx-auto mb-1.5"
                    />
                    <div className="text-[10px] text-zinc-500 font-mono truncate">İstenen Ürün</div>
                    <div className="text-xs font-semibold text-zinc-350 truncate">{swap.receiverItemTitle}</div>
                  </div>
                </div>

                {/* Offer optional custom letter */}
                {swap.message && (
                  <div className="p-3 bg-dark-bg/65 border border-dark-border/30 rounded-xl text-xs text-zinc-400 font-sans italic">
                    &ldquo; {swap.message} &rdquo;
                  </div>
                )}

                {/* Actions Row */}
                <div className="flex items-center gap-2 pt-1.5">
                  {/* Chat button (Available for both: accepted & completed) */}
                  {(swap.status === "accepted" || swap.status === "completed") && (
                    <button
                      onClick={() => onOpenChat(swap)}
                      className="flex-1 py-2.5 bg-dark-panel hover:bg-dark-card text-white font-sans font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-dark-border"
                    >
                      <MessageCircle className="w-4 h-4 text-neon" /> Sohbet Odası
                    </button>
                  )}

                  {/* For Received Pending offer: Accept or Reject */}
                  {swap.status === "pending" && !isOfferer && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(swap.id, "accepted")}
                        className="flex-1 py-2.5 bg-neon text-black font-sans font-bold text-xs rounded-xl hover:opacity-90 transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4 font-black" /> Kabul Et
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(swap.id, "cancelled")}
                        className="p-2.5 bg-dark-card hover:bg-dark-panel text-red-400 text-xs rounded-xl transition-colors flex items-center justify-center border border-dark-border"
                        title="Reddet"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* For Pending Giden Offer: Withdraw option */}
                  {swap.status === "pending" && isOfferer && (
                    <button
                      onClick={() => handleUpdateStatus(swap.id, "cancelled")}
                      className="w-full py-2 bg-dark-card border border-dark-border hover:bg-dark-panel text-zinc-400 text-xs rounded-xl transition-colors flex items-center justify-center"
                    >
                      İptal Et / Geri Çek
                    </button>
                  )}

                  {/* For Accepted Offer: Complete or Cancel */}
                  {swap.status === "accepted" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(swap.id, "completed")}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Takas Tamamlandı
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(swap.id, "cancelled")}
                        className="py-2.5 px-3 bg-dark-card border border-dark-border text-red-500 hover:bg-dark-panel text-xs font-sans rounded-xl transition-colors"
                      >
                        İptal
                      </button>
                    </>
                  )}

                  {/* For Completed Swap: Rate action */}
                  {swap.status === "completed" && (
                    <button
                      disabled={alreadyRated}
                      onClick={() => setSelectedSwapForRating(swap)}
                      className={`flex-1 py-2.5 px-3 font-sans font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors ${
                        alreadyRated 
                          ? "bg-dark-panel text-zinc-555 border border-dark-border" 
                          : "bg-amber-500 hover:bg-amber-600 text-black font-bold"
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                      {alreadyRated ? "Puanlandı" : "Kullanıcıyı Değerlendir"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RATING DIALOG BOX */}
      {selectedSwapForRating && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center px-6">
          <div className="bg-dark-bg border border-dark-border p-6 rounded-[28px] w-full max-w-sm text-center space-y-5">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-2">
              <Star className="w-6 h-6 fill-current" />
            </div>

            <div>
              <h3 className="text-white font-display font-bold text-md">Ortağını Değerlendir</h3>
              <p className="text-zinc-400 text-xs font-sans mt-1">
                Kullanıcı: @{selectedSwapForRating.proposerId === currentUser.id ? selectedSwapForRating.receiverUsername : selectedSwapForRating.proposerUsername}
              </p>
            </div>

            {ratingStatus === "success" ? (
              <div className="py-4 text-center">
                <Check className="w-10 h-10 text-neon mx-auto mb-2" />
                <p className="text-white text-xs">Değerlendirmeniz başarıyla iletildi!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stars choice */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatingValue(star)}
                      className="focus:outline-none"
                    >
                      <Star 
                        className={`w-7 h-7 cursor-pointer transition-colors ${
                          star <= ratingValue 
                            ? "text-amber-500 fill-amber-400" 
                            : "text-zinc-700"
                        }`} 
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Takas deneyimi nasıldı? Paketleme, dürüstlük, zamanında katılım..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={3}
                  className="w-full bg-dark-card border border-dark-border text-zinc-250 text-xs p-3.5 rounded-2xl placeholder:text-zinc-650 focus:outline-none focus:border-neon font-sans"
                />

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setSelectedSwapForRating(null)}
                    className="flex-1 py-2.5 bg-dark-card border border-dark-border text-zinc-400 text-xs font-sans rounded-xl hover:text-white"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleRateSubmit}
                    disabled={ratingStatus === "loading"}
                    className="flex-1 py-2.5 bg-neon text-black font-semibold text-xs font-sans rounded-xl hover:opacity-90"
                  >
                    Gönder
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
