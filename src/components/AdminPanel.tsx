import React, { useState, useEffect } from "react";
import { User, Item, SwapOffer, Report, AppAnalytics } from "../types";
import { 
  getAdminUsers, 
  getAdminReports, 
  getAdminAnalytics, 
  updateAdminUser, 
  resolveAdminReport,
  getItems,
  deleteItem
} from "../utils";
import { 
  Users, 
  ShieldAlert, 
  BarChart3, 
  AlertOctagon, 
  Check, 
  X, 
  UserMinus, 
  UserCheck, 
  Activity, 
  Trash2,
  RefreshCw,
  ShoppingBag,
  ListRestart
} from "lucide-react";

interface AdminPanelProps {
  currentUser: User;
  onRefreshItems: () => void;
}

export default function AdminPanel({ currentUser, onRefreshItems }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [analytics, setAnalytics] = useState<AppAnalytics | null>(null);
  
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<"analytics" | "users" | "reports" | "items">("analytics");
  const [isLoading, setIsLoading] = useState(true);

  // Custom non-blocking interactive states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [uData, rData, aData, iData] = await Promise.all([
        getAdminUsers(),
        getAdminReports(),
        getAdminAnalytics(),
        getItems()
      ]);
      setUsers(uData);
      setReports(rData);
      setAnalytics(aData);
      setAllItems(iData);
    } catch (err) {
      console.error("Admin data load error: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser.isAdmin) {
      loadAdminData();
    }
  }, [currentUser.id]);

  const handleToggleBlock = async (userId: string, isCurrentlyBlocked: boolean) => {
    try {
      await updateAdminUser(userId, { isBlocked: !isCurrentlyBlocked });
      setAdminNotification("Kullanıcı bloklama durumu güncellendi.");
      setTimeout(() => setAdminNotification(null), 3000);
      loadAdminData();
    } catch (err) {
      setAdminNotification("İşlem gerçekleştirilemedi.");
      setTimeout(() => setAdminNotification(null), 3000);
    }
  };

  const handleToggleVerify = async (userId: string, isCurrentlyVerified: boolean) => {
    try {
      await updateAdminUser(userId, { isVerified: !isCurrentlyVerified });
      setAdminNotification("Kullanıcı onay durumu güncellendi.");
      setTimeout(() => setAdminNotification(null), 3000);
      loadAdminData();
    } catch (err) {
      setAdminNotification("İşlem gerçekleştirilemedi.");
      setTimeout(() => setAdminNotification(null), 3000);
    }
  };

  const handleResolveReport = async (reportId: string, action: "delete_item" | "dismiss") => {
    try {
      await resolveAdminReport(reportId, action);
      setAdminNotification(action === "delete_item" ? "Şikayet edilen ilan silindi." : "Şikayet kapatıldı.");
      setTimeout(() => setAdminNotification(null), 3000);
      loadAdminData();
      onRefreshItems();
    } catch (err) {
      setAdminNotification("Rapor güncellenemedi.");
      setTimeout(() => setAdminNotification(null), 3000);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setConfirmDeleteId(itemId);
  };

  const executeDeleteItem = async () => {
    if (!confirmDeleteId) return;
    try {
      const success = await deleteItem(confirmDeleteId);
      if (success) {
        setAdminNotification("İlan başarıyla yayından kaldırıldı.");
        setTimeout(() => setAdminNotification(null), 3050);
        await loadAdminData();
        onRefreshItems();
      } else {
        setAdminNotification("İlan silinirken bir hata oluştu.");
        setTimeout(() => setAdminNotification(null), 3050);
      }
    } catch (err) {
      setAdminNotification("İlan silinemedi.");
      setTimeout(() => setAdminNotification(null), 3050);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  if (!currentUser.isAdmin) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-white font-display font-semibold mb-1">Yetkisiz Erişim</h3>
        <p className="text-xs">Bu panele erişmek için yönetici yetkilerine sahip olmanız gerekir.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-dark-bg border border-dark-border p-6 rounded-[28px] relative" id="management-control-cabinet">
      {/* Tabs / Submenu Headers */}
      <div className="flex justify-between items-center pb-4 border-b border-dark-border mb-5 select-none">
        <div>
          <h2 className="text-white font-display font-extrabold text-lg flex items-center gap-1.5 leading-none">
            Yönetim Paneli
          </h2>
          <span className="text-[9px] font-mono text-neon uppercase tracking-wider block mt-1.5">
            Gözlem, Moderasyon ve İstatistikler
          </span>
        </div>

        <button 
          onClick={loadAdminData}
          className="p-1 px-2.5 rounded-lg bg-dark-card border border-dark-border text-[10px] text-zinc-400 font-mono flex items-center gap-1 hover:text-white"
        >
          <RefreshCw className="w-3 h-3 text-neon" /> Güncelle
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1 bg-dark-panel p-1 rounded-2xl border border-dark-border mb-6">
        <button
          onClick={() => setActiveAdminSubTab("analytics")}
          className={`py-2 px-1 text-[10px] sm:text-xs font-sans font-medium rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeAdminSubTab === "analytics" 
              ? "bg-neon text-black font-semibold shadow-inner" 
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Analiz
        </button>
        <button
          onClick={() => setActiveAdminSubTab("reports")}
          className={`py-2 px-1 text-[10px] sm:text-xs font-sans font-medium rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeAdminSubTab === "reports" 
              ? "bg-neon text-black font-semibold shadow-inner" 
              : "text-zinc-400 hover:text-white-80 font-semibold"
          }`}
        >
          <div className="relative">
            <ShieldAlert className="w-3.5 h-3.5" />
            {reports.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full text-[7.5px] text-white px-1 leading-none font-bold scale-90">
                {reports.length}
              </span>
            )}
          </div>
          Raporlar
        </button>
        <button
          onClick={() => setActiveAdminSubTab("users")}
          className={`py-2 px-1 text-[10px] sm:text-xs font-sans font-medium rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeAdminSubTab === "users" 
              ? "bg-neon text-black font-semibold shadow-inner" 
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Üyeler
        </button>
        <button
          onClick={() => setActiveAdminSubTab("items")}
          className={`py-2 px-1 text-[10px] sm:text-xs font-sans font-medium rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeAdminSubTab === "items" 
              ? "bg-neon text-black font-semibold shadow-inner" 
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" /> İlanlar
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-zinc-500 flex flex-col items-center justify-center">
          <Activity className="w-8 h-8 text-neon animate-pulse mb-3" />
          <p className="text-xs font-mono">Veritabanı okunuyor...</p>
        </div>
      ) : (
        <div className="text-left space-y-4">
          
          {/* ANALYTICS SUBTAB */}
          {activeAdminSubTab === "analytics" && analytics && (
            <div className="space-y-4 font-sans text-xs">
              
              {/* Quick statistics widgets row */}
              <div className="grid grid-cols-2 gap-3 select-none">
                <div className="bg-dark-card p-4 rounded-2xl border border-dark-border/50">
                  <div className="text-[9.5px] uppercase font-mono text-zinc-500">Kayıtlı Takasçı</div>
                  <div className="text-xl font-display font-bold text-white mt-1">{analytics.totalUsers}</div>
                </div>
                <div className="bg-dark-card p-4 rounded-2xl border border-dark-border/50 relative overflow-hidden">
                  <div className="text-[9.5px] uppercase font-mono text-zinc-500 flex items-center gap-1.5">
                    Aktif Kullanıcı 
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  </div>
                  <div className="text-xl font-display font-bold text-white mt-1">
                    {analytics.activeUsersCount ?? 5} <span className="text-[10px] text-emerald-400 font-sans font-medium">Çevrimiçi</span>
                  </div>
                </div>
                <div className="bg-dark-card p-4 rounded-2xl border border-dark-border/50">
                  <div className="text-[9.5px] uppercase font-mono text-zinc-500">Toplam İlan Görünümü</div>
                  <div className="text-xl font-display font-bold text-white mt-1">{analytics.totalViews ?? 0}</div>
                </div>
                <div className="bg-dark-card p-4 rounded-2xl border border-dark-border/50">
                  <div className="text-[9.5px] uppercase font-mono text-zinc-500">Aktif Takas İlanı</div>
                  <div className="text-xl font-display font-bold text-white mt-1">{analytics.totalItems}</div>
                </div>
                <div className="bg-dark-card p-4 rounded-2xl border border-dark-border/50">
                  <div className="text-[9.5px] uppercase font-mono text-zinc-500">Toplam Teklif</div>
                  <div className="text-xl font-display font-bold text-white mt-1">{analytics.totalSwaps}</div>
                </div>
                <div className="bg-dark-card p-4 rounded-2xl border border-dark-border/50">
                  <div className="text-[9.5px] uppercase font-mono text-zinc-500">Tamamlanan Takas</div>
                  <div className="text-xl font-display font-bold text-white mt-1">{analytics.totalCompletedSwaps}</div>
                </div>
              </div>

              {/* Daily Statistics Chart / Mini Bar graph */}
              <div className="bg-dark-card p-4 rounded-2xl border border-dark-border/50 space-y-3.5">
                <div className="flex justify-between items-center select-none">
                  <h4 className="text-white font-display font-bold text-xs">7 Günlük Aktivite İstatistikleri</h4>
                  <span className="text-[8.5px] text-zinc-500 font-mono">Son Güncellenme: Bugün</span>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3.5 text-[10px] font-sans pb-1.5 justify-start border-b border-dark-border/30">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-sky-400" />
                    <span className="text-zinc-400">Yeni Kayıt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-neon" />
                    <span className="text-zinc-400">Yeni İlan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-purple-550 bg-purple-500" />
                    <span className="text-zinc-400">Teklifler</span>
                  </div>
                </div>

                {/* Beautiful custom CSS Grid Bar Chart */}
                <div className="h-44 flex items-end justify-between pt-4 pb-2 px-1 bg-[#050505] rounded-xl border border-dark-border/30">
                  {analytics.dailyStats && analytics.dailyStats.map((stat, idx) => {
                    // find max to scale relatively
                    const maxVal = Math.max(...(analytics.dailyStats?.map(s => Math.max(s.registrations, s.listings, s.swaps)) || [5]));
                    const scaleFactor = 100 / (maxVal || 1); // target height of 100px

                    const capH = (val: number) => Math.max(3, Math.min(100, Math.round(val * scaleFactor)));

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-zinc-950 border border-dark-border px-2 py-1 rounded-md text-[9px] text-zinc-300 font-mono hidden group-hover:block whitespace-nowrap z-50 pointer-events-none mb-1.5 shadow-2xl">
                          <div className="font-bold text-white mb-0.5">{stat.date} İstatistikleri</div>
                          <div className="text-sky-400">Kayıt: {stat.registrations}</div>
                          <div className="text-neon font-bold">İlan: {stat.listings}</div>
                          <div className="text-purple-400">Teklif: {stat.swaps}</div>
                        </div>

                        {/* Stems containing the 3 mini-bars */}
                        <div className="flex items-end gap-1 px-1 h-28">
                          <div 
                            className="w-1.5 sm:w-2 bg-sky-400 rounded-t-sm transition-all duration-350 hover:brightness-125" 
                            style={{ height: `${capH(stat.registrations)}px` }}
                          />
                          <div 
                            className="w-1.5 sm:w-2 bg-neon rounded-t-sm transition-all duration-350 hover:brightness-125" 
                            style={{ height: `${capH(stat.listings)}px` }}
                          />
                          <div 
                            className="w-1.5 sm:w-2 bg-purple-500 rounded-t-sm transition-all duration-350 hover:brightness-125" 
                            style={{ height: `${capH(stat.swaps)}px` }}
                          />
                        </div>

                        {/* Date label */}
                        <span className="text-[9px] text-zinc-500 font-mono font-bold leading-none select-none">{stat.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress-like category distribution stats listing */}
              <div className="bg-dark-card p-4 rounded-2xl border border-dark-border/50 space-y-3">
                <h4 className="text-white font-display font-bold text-xs select-none">İlanların Kategori Dağılımı</h4>
                <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                  {Object.entries(analytics.categoryDistribution).map(([category, count]) => {
                    const pct = Math.round((Number(count) / (analytics.totalItems || 1)) * 105) > 100 ? 100 : Math.round((Number(count) / (analytics.totalItems || 1)) * 100);
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-[11px] text-zinc-300">
                          <span>{category}</span>
                          <span className="font-mono">{count as number} ilan ({pct}%)</span>
                        </div>
                        <div className="w-full bg-[#000000] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-neon h-full rounded-full transition-all duration-550" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* COMPLAINTS / REPORTS TAB */}
          {activeAdminSubTab === "reports" && (
            <div className="space-y-3.5">
              <h3 className="text-white text-sm font-display font-bold flex items-center gap-1.5 mb-2 select-none">
                <AlertOctagon className="w-4 h-4 text-red-500" /> Şikayet Bildirimleri
              </h3>

              {reports.length === 0 ? (
                <div className="p-8 border border-dashed border-dark-border text-center rounded-2xl">
                  <p className="text-xs text-zinc-500 font-sans">Bekleyen şikayet veya ihbar bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map(report => (
                    <div key={report.id} className="bg-dark-card border border-dark-border p-4 rounded-2xl space-y-3">
                      <div className="flex items-center gap-3 text-xs bg-dark-bg/40 p-2.5 rounded-xl border border-dark-border">
                        <img src={report.itemImageUrl} alt="" className="w-9 h-9 rounded object-cover" />
                        <div>
                          <div className="text-zinc-500 font-mono text-[9px]">Şikayet Edilen İlan:</div>
                          <div className="text-white font-semibold">{report.itemTitle}</div>
                        </div>
                      </div>

                      <div className="p-2.5 bg-red-400/5 border border-red-500/10 rounded-xl text-xs text-red-400 font-sans">
                        <span className="font-semibold text-[10.5px]">Gerekçe:</span> {report.reason}
                        <div className="text-[9.5px] font-mono text-zinc-500 mt-2">
                          Raporlayan: @{report.reporterUsername} • {new Date(report.createdAt).toLocaleDateString("tr-TR")}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveReport(report.id, "delete_item")}
                          className="flex-1 py-1.5 bg-red-650 hover:bg-red-700 text-white font-medium text-xs font-sans rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> İlanı Moderasyondan Sil
                        </button>
                        <button
                          onClick={() => handleResolveReport(report.id, "dismiss")}
                          className="py-1.5 px-3 bg-dark-panel hover:bg-dark-card text-zinc-350 text-xs font-sans rounded-lg transition-colors border border-dark-border"
                        >
                          Raporu Kapat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* USER MANAGEMENT SUBTAB */}
          {activeAdminSubTab === "users" && (
            <div className="space-y-3">
              <h3 className="text-white text-sm font-display font-bold flex items-center gap-1.5 selection-none">
                <Users className="w-4 h-4 text-neon" /> Üye Yönetimi ({users.length})
              </h3>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
                {users.map(user => (
                  <div key={user.id} className="bg-dark-card border border-dark-border p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <div className="text-white font-semibold flex items-center gap-1">
                          @{user.username}
                          {user.isAdmin && <span className="text-[8px] bg-amber-500/15 text-amber-550 border border-amber-500/20 px-1 rounded">ADMIN</span>}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{user.email}</div>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      {/* block toggle */}
                      <button
                        onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[9.5px] font-mono transition-colors ${
                          user.isBlocked 
                            ? "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25" 
                            : "bg-dark-bg border-dark-border text-zinc-400 hover:bg-dark-panel hover:text-white"
                        }`}
                        title={user.isBlocked ? "Engeli Kaldır" : "Engelle"}
                      >
                        {user.isBlocked ? "Engelli" : "Engel"}
                      </button>

                      {/* verified on/off */}
                      <button
                        onClick={() => handleToggleVerify(user.id, user.isVerified)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[9.5px] font-mono transition-colors ${
                          user.isVerified 
                            ? "bg-sky-550/15 border-sky-500/30 text-sky-400 hover:bg-sky-500/25" 
                            : "bg-dark-bg border-dark-border text-zinc-400 hover:bg-dark-panel hover:text-white"
                        }`}
                        title="Onaylı Profil Switch"
                      >
                        {user.isVerified ? "Onaylı" : "Onayla"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LISTS / ACTIVE ADVERTISING MODERATION SHIELD */}
          {activeAdminSubTab === "items" && (
            <div className="space-y-3">
              <h3 className="text-white text-sm font-display font-bold flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-neon" /> Sistemdeki Yayındaki İlanlar ({allItems.length})
              </h3>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
                {allItems.map(item => (
                  <div key={item.id} className="bg-dark-card border border-dark-border p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={item.imageUrl} alt="" className="w-9 h-9 rounded object-cover border border-dark-border" />
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate max-w-[160px]">{item.title}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 truncate">Sahibi: @{item.username} • {item.city}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl transition-all"
                      title="İlanı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Admin notification Toast */}
      {adminNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-neon text-black text-xs font-bold font-sans px-4 py-2.5 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in whitespace-nowrap">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>{adminNotification}</span>
        </div>
      )}

      {/* Admin delete confirmation modal inside the wrapper frame */}
      {confirmDeleteId && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-50 rounded-[28px] animate-fade-in select-none">
          <div className="bg-dark-card border border-dark-border p-5 rounded-2xl w-full max-w-[280px] text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase font-mono tracking-wider">İlan Silinsin mi?</h4>
              <p className="text-[10px] text-zinc-400 mt-1.5 leading-normal">
                Bu ürünü takas sistemimizden tamamen silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex gap-2 font-sans">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 bg-dark-panel hover:bg-zinc-805 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded-xl border border-dark-border transition-all cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={executeDeleteItem}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
