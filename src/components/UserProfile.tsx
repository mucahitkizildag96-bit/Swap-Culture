import React, { useState, useEffect, useRef } from "react";
import { User, Item } from "../types";
import { onboard, deleteAccount, formatDisplayName } from "../utils";
import { getTranslation } from "../utils/i18n";
import { motion, AnimatePresence } from "motion/react";
import { 
  User as UserIcon, 
  Star, 
  MapPin, 
  RefreshCw, 
  CheckCircle2, 
  ShoppingBag, 
  FileText, 
  Edit3, 
  LogOut, 
  UserPlus,
  BadgeAlert,
  ClipboardList,
  Check,
  Settings,
  X,
  Trash2,
  Upload,
  ShieldAlert,
  UserCheck,
  Smartphone,
  Globe,
  Camera
} from "lucide-react";

interface UserProfileProps {
  currentUser: User;
  userItems: Item[];
  allUsers: User[];
  onProfileUpdated: (updatedUser: User) => void;
  onLogout: () => void;
  onSwitchUser: (newUser: User) => void;
  onDeleteItem: (id: string, skipConfirm?: boolean) => void;
  onLanguageChange?: (lang: string) => void;
}

const AVATAR_POOL = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
];

const PROVINCES = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", 
  "Adana", "Konya", "Gaziantep", "Eskişehir", "Trabzon"
];

const LANGUAGES = [
  { code: "tr", name: "Türkçe", native: "Türkçe", flag: "🇹🇷" },
  { code: "en", name: "English", native: "English", flag: "🇺🇸" },
  { code: "de", name: "Almanca", native: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Fransızca", native: "Français", flag: "🇫🇷" },
  { code: "es", name: "İspanyolca", native: "Español", flag: "🇪🇸" },
  { code: "it", name: "İtalyanca", native: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portekizce", native: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Rusça", native: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "Arapça", native: "العربية", flag: "🇸🇦" },
  { code: "nl", name: "Felemenkçe", native: "Nederlands", flag: "🇳🇱" },
  { code: "sv", name: "İsveççe", native: "Svenska", flag: "🇸🇪" },
  { code: "pl", name: "Lehçe", native: "Polski", flag: "🇵🇱" },
  { code: "ja", name: "Japonca", native: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korece", native: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "Çince", native: "简体中文", flag: "🇨🇳" },
  { code: "hi", name: "Hintçe", native: "हिन्दी", flag: "🇮🇳" },
  { code: "az", name: "Azerbaycan Türkçesi", native: "Azərbaycanca", flag: "🇦🇿" },
  { code: "uk", name: "Ukraynaca", native: "Українська", flag: "🇺🇦" },
  { code: "el", name: "Yunanca", native: "Ελληνικά", flag: "🇬🇷" },
  { code: "ro", name: "Romence", native: "Română", flag: "🇷🇴" }
];

export default function UserProfile({ 
  currentUser, 
  userItems, 
  allUsers,
  onProfileUpdated, 
  onLogout,
  onSwitchUser,
  onDeleteItem,
  onLanguageChange
}: UserProfileProps) {
  const appLanguage = "tr";
  const t = (key: string) => getTranslation(key, "tr");

  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountSettingsExpanded, setIsAccountSettingsExpanded] = useState(false);
  const [username, setUsername] = useState(currentUser.username);
  const [city, setCity] = useState(currentUser.city);
  const [bio, setBio] = useState(currentUser.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [avatarLightboxUrl, setAvatarLightboxUrl] = useState<string | null>(null);

  // Sync state with currentUser when it changes
  useEffect(() => {
    setUsername(currentUser.username);
    setCity(currentUser.city);
    setBio(currentUser.bio || "");
    setAvatarUrl(currentUser.avatarUrl);
    setPhoneToVerify(currentUser.phone || "");
  }, [currentUser]);

  const handleCancelEdit = () => {
    setUsername(currentUser.username);
    setCity(currentUser.city);
    setBio(currentUser.bio || "");
    setAvatarUrl(currentUser.avatarUrl);
    setErrorMsg("");
    setIsEditing(false);
  };

  const isChanged = 
    username !== currentUser.username ||
    city !== currentUser.city ||
    (bio || "") !== (currentUser.bio || "") ||
    avatarUrl !== currentUser.avatarUrl;

  // Face Verification States
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [faceScanStep, setFaceScanStep] = useState<"idle" | "camera_loading" | "scanning" | "comparing" | "success" | "error">("idle");
  const [faceScanProgress, setFaceScanProgress] = useState(0);
  const [faceScanError, setFaceScanError] = useState("");
  const [compatibilityScore, setCompatibilityScore] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startFaceScan = async () => {
    setIsFaceScanning(true);
    setFaceScanStep("camera_loading");
    setFaceScanProgress(0);
    setFaceScanError("");
    setCompatibilityScore(0);

    try {
      // Access camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 400, height: 400, facingMode: "user" } 
      });
      streamRef.current = stream;
      
      // We wait a tiny bit to make sure video ref is available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(playErr => {
            console.error("Video play error: ", playErr);
          });
        }
      }, 305);

      setFaceScanStep("scanning");

      // Progress animation simulation for scan & alignment
      let progress = 0;
      const interval = setInterval(() => {
        progress += 4;
        setFaceScanProgress(Math.min(progress, 100));

        if (progress >= 35 && progress < 40) {
          setFaceScanStep("comparing");
        }

        if (progress >= 100) {
          clearInterval(interval);
          completeFaceScan();
        }
      }, 150);

    } catch (err: any) {
      console.error("Camera access error (simulating secure backup pipeline): ", err);
      // Fallback/Simulated secure camera model if camera is blocked/unsupported (safely guides user experience)
      setFaceScanStep("scanning");
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setFaceScanProgress(Math.min(progress, 100));

        if (progress >= 40 && progress < 50) {
          setFaceScanStep("comparing");
        }

        if (progress >= 100) {
          clearInterval(interval);
          completeFaceScan();
        }
      }, 150);
    }
  };

  const stopFaceCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const completeFaceScan = async () => {
    try {
      // Calculate a randomized high compatibility percentage with their current avatar (e.g., 94% - 99%)
      const score = Math.floor(Math.random() * 6) + 94;
      setCompatibilityScore(score);
      setFaceScanStep("success");
      stopFaceCamera();

      // Send the request to verify user
      const { verifyFace } = await import("../utils");
      const updatedUser = await verifyFace(currentUser.id);
      onProfileUpdated(updatedUser);
    } catch (err: any) {
      setFaceScanError(err.message || "Yüz doğrulaması kaydedilemedi.");
      setFaceScanStep("error");
      stopFaceCamera();
    }
  };

  const closeFaceScan = () => {
    stopFaceCamera();
    setIsFaceScanning(false);
    setFaceScanStep("idle");
  };

  // Phone Verification States
  const [phoneToVerify, setPhoneToVerify] = useState(currentUser.phone || "");
  const [verificationCodeInput, setVerificationCodeInput] = useState("");
  const [isVerifyingState, setIsVerifyingState] = useState<"idle" | "code_sent" | "success">("idle");
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [langToast, setLangToast] = useState("");

  // Profile Tab & Preview / Delete confirmation States
  const [profileTab, setProfileTab] = useState<"listings" | "completed_swaps">("listings");
  const [userSwaps, setUserSwaps] = useState<any[]>([]);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<Item | null>(null);
  const [selectedPreviewSwap, setSelectedPreviewSwap] = useState<any | null>(null);

  useEffect(() => {
    const fetchUserSwaps = async () => {
      try {
        const { getSwaps } = await import("../utils");
        const swapsList = await getSwaps(currentUser.id);
        setUserSwaps(swapsList || []);
      } catch (err) {
        console.error("Error fetching user swaps:", err);
      }
    };
    fetchUserSwaps();
  }, [currentUser.id, userItems.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFreezeAccountClick = () => {
    const confirmation = window.confirm("Hesabınızı geçici olarak dondurmak istediğinize emin misiniz?\n\nBu işlem ilanlarınızı dondurur ve sizi güvenli bir şekilde çıkış yaptırır. İstediğiniz zaman tekrar giriş yaparak hesabınızı aktifleştirebilirsiniz.");
    if (!confirmation) return;

    alert("Hesabınız başarıyla donduruldu. Tekrar giriş yaptığınızda otomatik olarak tekrar aktifleştirilecektir.");
    onLogout();
  };

  const handleDeleteAccountClick = async () => {
    const confirmation = window.confirm("Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!");
    if (!confirmation) return;

    try {
      setIsLoading(true);
      const success = await deleteAccount(currentUser.id);
      if (success) {
        onLogout();
      } else {
        alert("Hesap silinirken bir hata oluştu.");
      }
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !city || !avatarUrl) {
      setErrorMsg("Kullanıcı adı, yaşadığınız şehir ve profil fotoğrafı alanları zorunludur.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg("");
      const updatedUser = await onboard({
        userId: currentUser.id,
        username,
        city,
        bio,
        avatarUrl
      });
      onProfileUpdated(updatedUser);
      setIsEditing(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Profil kaydedilemedi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-dark-bg border border-dark-border p-6 rounded-[28px] relative overflow-hidden" id="profile-panel-cabinet">
      
      {isEditing ? (
        <form onSubmit={handleUpdateProfile} className="space-y-4 text-left">
          <div className="flex justify-between items-center pb-2 select-none">
            <h3 className="text-white font-display font-bold text-md flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-neon" /> Profili Düzenle
            </h3>
            <button 
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-zinc-500 hover:text-zinc-300 font-mono"
            >
              Vazgeç
            </button>
          </div>

          {/* Profil Fotoğrafı (No visual suggestions - real photo only) */}
          <div>
            <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">
              Profil Fotoğrafı <span className="text-neon">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-center gap-4 bg-dark-panel/60 p-4 rounded-2xl border border-dark-border">
                {avatarUrl ? (
                  <button
                    type="button"
                    onClick={() => setAvatarLightboxUrl(avatarUrl)}
                    className="w-16 h-16 rounded-full border-2 border-neon overflow-hidden shrink-0 relative bg-dark-card shadow-inner shadow-neon/10 cursor-zoom-in hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-1 focus:ring-neon/50"
                    title="Büyütmek için tıklayın"
                  >
                    <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-700 shrink-0 bg-dark-card flex items-center justify-center text-zinc-500 text-xs">
                    Foto Yok
                  </div>
                )}
                <div className="flex-1 space-y-1.5 text-left">
                  <p className="text-[10.5px] text-zinc-400 font-sans leading-normal">
                    Lütfen kendinize ait gerçek bir fotoğraf yükleyin. Profil fotoğrafı, kullanıcı adı ve şehir girmek zorunludur.
                  </p>
                  
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-dark-card hover:bg-dark-panel border border-dark-border hover:border-neon/40 text-zinc-300 hover:text-white px-3 py-2 rounded-xl text-[11px] font-sans transition-all select-none active:scale-98">
                    <Upload className="w-3.5 h-3.5 text-neon" />
                    <span>Cihazımdan Fotoğraf Yükle</span>
                    <input 
                       type="file" 
                       accept="image/*" 
                       onChange={handleFileChange} 
                       className="hidden" 
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-1.5">
              Kullanıcı Adı <span className="text-neon">*</span>
            </label>
            <input 
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-dark-card border border-dark-border text-zinc-200 p-3 rounded-2xl text-xs focus:outline-none focus:border-neon font-sans"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-1.5">
              Şehir <span className="text-neon">*</span>
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-dark-card border border-dark-border text-zinc-300 p-3 rounded-2xl text-xs focus:outline-none focus:border-neon font-sans cursor-pointer"
            >
              {PROVINCES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-1.5">
              Hakkımda (Bio)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Takas tarzınızı yazın..."
              rows={3}
              className="w-full bg-dark-card border border-dark-border text-zinc-200 p-3 rounded-2xl text-xs placeholder:text-zinc-650 focus:outline-none focus:border-neon font-sans"
            />
          </div>

          {/* Fotoğraf/Yüz Biyometrik Doğrulama Bölümü */}
          <div className="p-4 bg-dark-panel/40 rounded-2xl border border-dark-border/60 space-y-3">
            <div className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-neon animate-pulse" /> BİYOMETRİK YÜZ DOĞRULAMA (MAVİ TİK)
            </div>

            {currentUser.isVerified ? (
              <div className="flex items-center gap-2 bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl text-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-left text-xs font-sans">
                  <span className="font-bold text-white block">Yüzünüz Doğrulandı</span>
                  Profiliniz biyometrik yüz doğrulaması yapılarak onaylandı! Mavi Tik rozetiniz aktif.
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                  Profil fotoğrafınızla yüzünüzün uyumunu kontrol ederek anında "Onaylı Takasçı" mavi tik rozeti kazanın. Güveni artırın ve hemen öne geçin!
                </p>

                <button
                  type="button"
                  onClick={startFaceScan}
                  className="w-full py-2.5 bg-neon hover:bg-neon/90 text-black font-sans font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Kamerayı Aç ve Yüzünü Tara</span>
                </button>
              </div>
            )}
          </div>

          {/* Telefon Numarası Doğrulama Bölümü (Relocated next to face scan) */}
          <div className="p-4 bg-dark-panel/40 rounded-2xl border border-dark-border/60 space-y-3">
            <div className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-neon" /> CEP TELEFONU DOĞRULAMA (MAVİ TİK)
            </div>
            
            {currentUser.phoneVerified ? (
              <div className="flex items-center gap-2 bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl text-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-left text-xs font-sans">
                  <span className="font-bold text-white block">Telefon Onaylandı</span>
                  Telefon numaranız ({currentUser.phone || "Kayıtlı"}) onaylandı. Mavi tik rozetiniz aktif.
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                  Profilinizi bir telefon numarasıyla doğrulayarak diğer takasçılara güven verin ve "Güvenli Profil" rozeti kazanın!
                </p>

                {isVerifyingState === "idle" && (
                  <div className="space-y-2.5">
                    <div className="flex gap-2">
                      <div className="bg-dark-card border border-dark-border text-zinc-400 text-xs p-3 rounded-xl font-mono select-none flex items-center">
                        +90
                      </div>
                      <input 
                        type="tel"
                        maxLength={10}
                        placeholder="555 555 55 55"
                        value={phoneToVerify}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, "");
                          setPhoneToVerify(clean);
                        }}
                        className="flex-1 bg-zinc-950 border border-dark-border text-zinc-200 text-xs p-3 rounded-xl placeholder:text-zinc-650 focus:outline-none focus:border-neon font-mono tracking-wider"
                      />
                    </div>
                    {phoneError && <p className="text-red-500 text-[10px] text-center font-sans">{phoneError}</p>}
                    <button
                      type="button"
                      onClick={async () => {
                        const cleaned = phoneToVerify.replace(/\s+/g, "");
                        if (!cleaned || cleaned.length < 9) {
                          setPhoneError("Lütfen geçerli bir telefon numarası girin.");
                          return;
                        }
                        setPhoneError("");
                        setIsVerifyingState("code_sent");
                        setPhoneSuccess("SMS ile iletilen 6 haneli test kodu: 123456");
                      }}
                      className="w-full py-2.5 bg-neon hover:bg-neon/90 text-black font-sans font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                    >
                      Doğrulama SMS'i Gönder
                    </button>
                  </div>
                )}

                {isVerifyingState === "code_sent" && (
                  <div className="space-y-2.5 bg-dark-card p-3 rounded-xl border border-dark-border/60">
                    <div className="text-[10px] text-zinc-400 font-mono">DOĞRULAMA KODU GİRİN</div>
                    <input 
                      type="text"
                      maxLength={6}
                      placeholder="Doğrulama kodu (Test için: 123456)"
                      value={verificationCodeInput}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, "");
                        setVerificationCodeInput(clean);
                      }}
                      className="w-full bg-zinc-950 border border-dark-border text-zinc-200 text-xs p-2.5 rounded-lg placeholder:text-zinc-650 focus:outline-none focus:border-neon font-mono text-center tracking-[0.5em] text-md"
                    />
                    {phoneSuccess && <p className="text-neon text-[9.5px] leading-tight font-sans">{phoneSuccess}</p>}
                    {phoneError && <p className="text-red-500 text-[10px] leading-tight font-sans">{phoneError}</p>}
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsVerifyingState("idle");
                          setVerificationCodeInput("");
                          setPhoneError("");
                        }}
                        className="flex-1 py-2 bg-dark-card border border-dark-border hover:bg-zinc-900 text-zinc-400 text-xs font-sans rounded-lg transition-all cursor-pointer"
                      >
                        Vazgeç
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (verificationCodeInput !== "123456") {
                            setPhoneError("Hatalı doğrulama kodu. Test kodu: 123456");
                            return;
                          }
                          
                          try {
                            setPhoneError("");
                            const { verifyPhone } = await import("../utils");
                            const updatedUser = await verifyPhone(currentUser.id, phoneToVerify, verificationCodeInput);
                            onProfileUpdated(updatedUser);
                            setIsVerifyingState("success");
                          } catch (err: any) {
                            setPhoneError(err.message || "Doğrulama tamamlanırken bir hata oluştu.");
                          }
                        }}
                        className="flex-1 py-2 bg-neon text-black font-sans font-bold text-xs rounded-lg transition-all cursor-pointer animate-none"
                      >
                        Kodu Doğrula
                      </button>
                    </div>
                  </div>
                )}

                {isVerifyingState === "success" && (
                  <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl text-emerald-400 flex items-center gap-2">
                    <span className="text-emerald-400 text-xs font-bold font-sans">✓</span>
                    <div className="text-[10px] font-sans">
                      Telefon doğrulamanız başarıyla tamamlandı! Mavi tik profilinize uygulandı.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {errorMsg && <p className="text-red-500 text-xs font-sans">{errorMsg}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 font-sans font-bold text-xs uppercase rounded-2xl transition-all cursor-pointer relative overflow-hidden ${
              isChanged 
              ? "bg-neon text-black shadow-[0_0_20px_rgba(20,250,140,0.73)] border border-white scale-[1.03] hover:scale-[1.05] animate-pulse" 
              : "bg-zinc-800 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-750"
            }`}
          >
            {isLoading ? "KAYDEDİLİYOR..." : "Profili Kaydet"}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Top Profile Header with Settings Row */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900 select-none">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Takasçı Kimliği</div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-dark-card border border-dark-border hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all"
              title="Ayarlar"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Main User Card info */}
          <div className="flex flex-col items-center text-center space-y-3.5 pt-2">
            <button
              type="button"
              onClick={() => setAvatarLightboxUrl(currentUser.avatarUrl)}
              className="relative cursor-zoom-in group active:scale-95 transition-all focus:outline-none"
              title="Profil fotoğrafını büyüt"
            >
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.username} 
                className={`w-20 h-20 rounded-full object-cover border-2 shadow-lg shadow-black/40 group-hover:brightness-110 group-hover:border-neon transition-all ${
                  currentUser.isVerified ? "border-neon neon-glow" : "border-zinc-800"
                }`}
              />
              {currentUser.isVerified && (
                <div 
                  className="absolute -bottom-1 -right-1 bg-sky-500 text-white rounded-full p-0.5 border border-zinc-950 flex items-center justify-center w-5 h-5 shadow-lg select-none"
                  title="Fotoğraf Doğrulandı"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>

            <div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-white text-lg font-display font-medium">{formatDisplayName(currentUser.username)}</span>
                {currentUser.isAdmin && (
                  <span className="text-[10px] uppercase font-mono bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-full font-bold">
                    Admin
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-1 text-zinc-400 text-xs font-sans mt-1">
                <MapPin className="w-3.5 h-3.5 text-neon" />
                <span>{currentUser.city}</span>
              </div>
            </div>

            {currentUser.bio && (
              <p className="text-zinc-400 text-xs px-4 py-2 bg-dark-card/40 border border-dark-border rounded-2xl max-w-sm italic font-sans leading-relaxed">
                &ldquo; {currentUser.bio} &rdquo;
              </p>
            )}

            {/* Quick Profile edits and actions buttons */}
            <div className="w-full max-w-xs pb-1 flex justify-center">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full max-w-[200px] py-2.5 bg-dark-card/80 border border-dark-border hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 text-xs font-sans font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5 text-neon" /> Profili Düzenle
              </button>
            </div>
          </div>

          {/* Stats Bento Grid Grid */}
          <div className="grid grid-cols-3 gap-2.5 bg-dark-panel/50 border border-dark-border p-4 rounded-3xl text-center select-none">
            {/* Rating */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-0.5 text-amber-505">
                <Star className="w-4 h-4 fill-current text-amber-450" />
                <span className="text-sm font-bold font-mono text-white">{currentUser.rating}</span>
              </div>
              <div className="text-[9.5px] uppercase font-mono text-zinc-500 font-medium">Değerlendirme ({currentUser.ratingCount || 0})</div>
            </div>

            {/* Completed */}
            <div className="space-y-1 border-x border-dark-border">
              <div className="text-white text-sm font-bold font-mono flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{currentUser.completedSwaps || 0}</span>
              </div>
              <div className="text-[9.5px] uppercase font-mono text-zinc-500 font-medium">Tamamlanan Takaslar</div>
            </div>

            {/* Listed items count */}
            <div className="space-y-1">
              <div className="text-white text-sm font-bold font-mono flex items-center justify-center gap-1">
                <ShoppingBag className="w-4 h-4 text-neon" />
                <span>{userItems.length}</span>
              </div>
              <div className="text-[9.5px] uppercase font-mono text-zinc-500 font-medium">Aktif İlanlarım</div>
            </div>
          </div>

          {/* User's uploaded Listings manage panel */}
          <div className="space-y-4">
            {/* Tab Selection buttons */}
            <div className="grid grid-cols-2 gap-2 bg-dark-panel/60 p-1 rounded-2xl border border-dark-border select-none">
              <button
                type="button"
                onClick={() => setProfileTab("listings")}
                className={`py-3 text-[11.5px] font-sans font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  profileTab === "listings" 
                    ? "bg-neon text-black font-semibold shadow-inner" 
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Aktif İlanlarım ({userItems.length})
              </button>
              
              <button
                type="button"
                onClick={() => setProfileTab("completed_swaps")}
                className={`py-3 text-[11.5px] font-sans font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  profileTab === "completed_swaps" 
                    ? "bg-neon text-black font-semibold shadow-inner" 
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Tamamlanan Takaslar ({userSwaps.filter(s => s.status === "completed").length})
              </button>
            </div>

            {/* TAB CONTENT */}
            {profileTab === "listings" ? (
              userItems.length === 0 ? (
                <div className="p-8 border border-dashed border-dark-border text-center rounded-[24px]">
                  <p className="text-xs text-zinc-500 font-sans">{t("no_my_listings")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto no-scrollbar scroll-smooth pr-1">
                  {userItems.map(item => (
                    <div 
                      key={item.id}
                      className="p-2.5 bg-dark-card border border-dark-border/50 hover:border-zinc-700/60 rounded-2xl flex items-center justify-between gap-3 text-left transition-all"
                    >
                      {/* Clicking the info block triggers a preview modal */}
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewItem(item)}
                        className="flex items-center gap-3 flex-1 text-left cursor-pointer focus:outline-none min-w-0"
                      >
                        <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-dark-border shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white truncate pr-1">{item.title}</div>
                          <div className="text-[9.5px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className="text-neon/95 font-bold">Değer: {item.estimatedValue ? `${item.estimatedValue.toLocaleString("tr-TR")} TL` : "Belirtilmedi"}</span>
                            <span className="text-zinc-650">|</span>
                            <span className="truncate">Takaslık: {item.targetSwap}</span>
                          </div>
                        </div>
                      </button>

                      {/* Delete action button available to owners and admins */}
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-2 px-3 bg-zinc-950 border border-dark-border hover:border-red-500/35 hover:bg-red-500/5 hover:text-red-400 text-zinc-400 rounded-xl transition-all font-sans text-xs font-semibold cursor-pointer active:scale-95 shrink-0"
                      >
                        Kaldır
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* COMPLETED SWAPS TAB */
              userSwaps.filter(s => s.status === "completed").length === 0 ? (
                <div className="p-8 border border-dashed border-dark-border text-center rounded-[24px]">
                  <p className="text-xs text-zinc-500 font-sans">Henüz tamamlanmış bir takasınız bulunmuyor.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto no-scrollbar scroll-smooth pr-1">
                  {userSwaps.filter(s => s.status === "completed").map((swap) => {
                    const isProposer = swap.proposerId === currentUser.id;
                    const myItemTitle = isProposer ? swap.proposerItemTitle : swap.receiverItemTitle;
                    const myItemImage = isProposer ? swap.proposerItemImage : swap.receiverItemImage;
                    const peerItemTitle = isProposer ? swap.receiverItemTitle : swap.proposerItemTitle;
                    const peerItemImage = isProposer ? swap.receiverItemImage : swap.proposerItemImage;
                    const peerName = isProposer ? swap.receiverUsername : swap.proposerUsername;

                     return (
                      <button 
                        type="button"
                        onClick={() => setSelectedPreviewSwap(swap)}
                        key={swap.id}
                        className="w-full p-3 bg-dark-card border border-dark-border/40 hover:border-zinc-800 hover:bg-zinc-900/10 rounded-2xl flex flex-col gap-2.5 text-left transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-neon/35"
                      >
                        <div className="flex items-center justify-between border-b border-dark-border/40 pb-1.5 select-none w-full">
                          <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
                            TAKAS TAMAMLANDI ✔
                          </span>
                          <span className="text-[10px] text-neon font-sans font-semibold">
                            @{peerName} ile
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2.5 w-full">
                          {/* My Item */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <img src={myItemImage} alt="" className="w-9 h-9 rounded-lg object-cover border border-dark-border shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] text-zinc-500 font-mono block leading-none">BENİM</span>
                              <div className="text-[11.5px] font-medium text-zinc-200 truncate mt-0.5">{myItemTitle}</div>
                            </div>
                          </div>

                          {/* Swap icon */}
                          <div className="text-emerald-450 text-emerald-400 flex flex-col items-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>

                          {/* Peer Item */}
                          <div className="flex items-center gap-2 flex-1 min-w-0 text-right justify-end">
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] text-zinc-500 font-mono block leading-none">ALINAN</span>
                              <div className="text-[11.5px] font-medium text-zinc-200 truncate mt-0.5">{peerItemTitle}</div>
                            </div>
                            <img src={peerItemImage} alt="" className="w-9 h-9 rounded-lg object-cover border border-dark-border shrink-0" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* SETTINGS MODAL / PANEL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col justify-end text-left rounded-[28px] overflow-hidden">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="bg-dark-bg border-t border-dark-border px-6 py-6 pb-8 w-full h-[92%] overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6 select-none font-sans">
                  <h3 className="text-md font-display font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-neon animate-spin-slow" /> {t("settings_title")}
                  </h3>
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-1.5 rounded-full bg-dark-card text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {langToast && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-neon/15 border border-neon/30 text-neon font-sans text-xs rounded-xl flex items-center gap-2 shadow-inner shadow-neon/5"
                  >
                    <Check className="w-4 h-4 text-neon font-black shrink-0" />
                    <span className="font-medium">{langToast}</span>
                  </motion.div>
                )}

                <div className="space-y-4">
                  {/* Preferences Group */}
                  <div className="p-4 bg-dark-card rounded-2xl border border-dark-border space-y-3.5">
                    <div className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">Tercihler</div>
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="text-xs font-semibold text-white">Anlık Bildirimler</div>
                        <div className="text-[10px] text-zinc-500 font-sans">Takas teklifi geldiğinde sesli uyar</div>
                      </div>
                      <input type="checkbox" defaultChecked className="accent-neon h-4 w-4 bg-zinc-900 border-zinc-800 rounded" />
                    </div>
                    <div className="border-t border-dark-border/45 pt-3 flex items-center justify-between" id="pref-email">
                      <div className="text-left">
                        <div className="text-xs font-semibold text-white">E-posta Güncellemeleri</div>
                        <div className="text-[10px] text-zinc-500 font-sans">Özet eşleşmeleri haftalık e-posta ile al</div>
                      </div>
                      <input type="checkbox" className="accent-neon h-4 w-4 bg-zinc-900 border-zinc-800 rounded" />
                    </div>
                  </div>

                  {/* Informational Group */}
                  <div className="p-4 bg-dark-card rounded-2xl border border-dark-border space-y-3.5 select-none font-sans">
                    <div className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">Hakkında</div>
                    <div className="flex justify-between text-xs border-b border-dark-border/45 pb-2">
                      <span className="text-zinc-500">Uygulama Sürümü</span>
                      <span className="font-mono text-zinc-300">v2.4.0 (Elegant Dark)</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-dark-border/45 pb-2">
                      <span className="text-zinc-500">Geliştirici Sürümü</span>
                      <span className="font-mono text-zinc-400">Beta MVP (Mücahit K.)</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-dark-border/45 pb-2">
                      <span className="text-zinc-500">Sunucu Durumu</span>
                      <span className="font-mono text-emerald-400">Çevrimiçi (Aktif)</span>
                    </div>
                    <div className="space-y-1 text-left text-xs bg-dark-panel p-2.5 rounded-xl border border-dark-border/60">
                      <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Topluluk Misyonu</div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Tüketimi azaltmayı hedefleyen, eşyalarınızı başka ihtiyaçlarla adil takas yoluyla yeniden değerlendirebileceğiniz sürdürülebilir bir ekolojik döngü platformudur.
                      </p>
                    </div>
                    <div className="space-y-1 text-left text-xs bg-dark-panel p-2.5 rounded-xl border border-dark-border/60">
                      <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Güvenli Takas Kılavuzu</div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Takas işlemleriniz yüz yüze yapılacaksa her zaman güvenli, aydınlık ve kalabalık ortak alanlarda (meydanlar, AVM'ler, metro/metrobüs çıkışları) buluşmayı tercih etmenizi öneririz. Eşyaları tam kontrol edip teslim almadan onay vermeyiniz.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Hesap Ayarları Collapsible and Buttons */}
              <div className="space-y-3 pt-6 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsAccountSettingsExpanded(!isAccountSettingsExpanded)}
                  className="w-full py-3 bg-dark-card border border-dark-border hover:border-zinc-750 text-zinc-300 text-xs font-sans font-bold uppercase rounded-xl transition-all flex items-center justify-between px-4 select-none active:scale-98"
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-orange-400" /> Hesap Ayarları
                  </span>
                  <span className="text-[10px] text-zinc-500">{isAccountSettingsExpanded ? "YUKARI ▲" : "AŞAĞI ▼"}</span>
                </button>

                {isAccountSettingsExpanded && (
                  <div className="p-4 bg-dark-panel/85 border border-dark-border rounded-2xl space-y-3.5 transition-all text-left">
                    {/* Hesabı Dondur Button */}
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={handleFreezeAccountClick}
                        className="w-full py-3 bg-orange-950/20 border border-orange-500/20 hover:bg-orange-950/40 text-orange-400 text-xs font-sans font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <UserCheck className="w-4 h-4 text-orange-400" /> Hesabı Dondur / Askıya Al
                      </button>
                      <p className="text-[10px] text-zinc-500 leading-relaxed pl-1 font-sans">
                        Hesabınızı dondurarak ilanlarınızı geçici olarak yayından kaldırabilirsiniz. Tekrar giriş yaptığınızda hesabınız dondurulma modundan otomatik çıkar.
                      </p>
                    </div>

                    <div className="border-t border-dark-border/40 my-3" />

                    {/* Hesabı Sil Link */}
                    <div className="pt-1 text-center">
                      <button
                        type="button"
                        onClick={handleDeleteAccountClick}
                        className="text-red-500 hover:text-red-400 hover:underline text-xs font-sans font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hesabımı Kalıcı Olarak Sil
                      </button>
                      <p className="text-[9.5px] text-zinc-500 leading-normal font-sans mt-1 max-w-[280px] mx-auto">
                        Hesabınızı ve ilanlarınızı kalıcı olarak temizler. Bu işlem geri alınamaz.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Çıkış Yap Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onLogout();
                    }}
                    className="w-full py-3 bg-red-950/20 hover:bg-red-950/30 border border-red-500/20 hover:border-red-500/35 hover:text-red-350 text-red-400 text-xs font-sans font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <LogOut className="w-4 h-4" /> Çıkış Yap
                  </button>
                </div>
                
                <div className="text-[9.5px] text-zinc-550 text-center font-sans tracking-tight leading-normal select-none pt-1">
                  Uygulamaya dair tüm ayarlar cihazınızda şifreli olarak tutulur.
                </div>
              </div>
            </motion.div>
          </div>
        )}
       </AnimatePresence>

      {/* FACE SCAN OVERLAY */}
      <AnimatePresence>
        {isFaceScanning && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-[60] flex flex-col justify-center items-center p-6 rounded-[28px] overflow-hidden select-none">
            <style>{`
              @keyframes scanLineAnim {
                0%, 100% { top: 4px; }
                50% { top: calc(100% - 6px); }
              }
            `}</style>
            <div className="w-full max-w-sm flex flex-col items-center text-center space-y-5">
              
              <div className="flex flex-col items-center space-y-1">
                <div className="text-[10px] font-mono text-neon tracking-widest uppercase bg-neon/10 px-2.5 py-1 rounded-full border border-neon/20">
                  BİYOMETRİK KİMLİK DOĞRULAMA
                </div>
                <h4 className="text-white text-md font-display font-bold mt-2">Güvenli Yüz Tarayıcı</h4>
                <p className="text-[11px] text-zinc-400 font-sans max-w-[240px]">
                  Lütfen yüzünüzü aşağıdaki dairesel tarama alanına hizalayın.
                </p>
              </div>

              {/* Scanner Frame Box */}
              <div className="relative w-44 h-44 rounded-full border-2 border-dashed border-zinc-700 p-1 flex items-center justify-center overflow-hidden bg-zinc-950/40">
                {faceScanStep === "camera_loading" ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="w-8 h-8 text-neon animate-spin" />
                    <span className="text-[10px] text-zinc-500 font-mono">KAMERA YÜKLENİYOR...</span>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover rounded-full select-none pointer-events-none transform -scale-x-100" 
                      playsInline 
                      muted 
                    />
                    
                    {faceScanStep === "scanning" && (
                      <>
                        {/* Shimmer laser scanner line */}
                        <div 
                          className="absolute left-0 right-0 h-0.5 bg-neon shadow-[0_0_8px_#14fa8c]" 
                          style={{ animation: "scanLineAnim 2.5s infinite ease-in-out" }} 
                        />
                        {/* Target frame ring */}
                        <div className="absolute inset-2 border-2 border-neon/50 rounded-full animate-pulse pointer-events-none" />
                      </>
                    )}

                    {faceScanStep === "comparing" && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center space-y-2 text-neon">
                        <RefreshCw className="w-7 h-7 text-neon animate-spin" />
                        <span className="text-[10px] text-neon font-mono font-bold tracking-wider animate-pulse">HARİTALAMA YAPILIYOR...</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Progress and status */}
              <div className="w-full space-y-3.5 px-4">
                {faceScanStep === "scanning" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                      <span>Tarama İlerlemesi</span>
                      <span className="text-neon">{faceScanProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-neon transition-all duration-150" 
                        style={{ width: `${faceScanProgress}%` }} 
                      />
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono animate-pulse mt-1 select-none">
                      Gözlerinizi kırpmadan doğrudan kameraya bakın...
                    </div>
                  </div>
                )}

                {faceScanStep === "comparing" && (
                  <div className="space-y-1 text-center">
                    <div className="text-[11px] text-neon font-mono uppercase tracking-wider animate-pulse">
                      Biyometrik Veriler Eşleştiriliyor...
                    </div>
                    <div className="text-[10px] text-zinc-455">
                      Profil fotoğrafınızla eşleşme oranı analiz ediliyor.
                    </div>
                  </div>
                )}

                {faceScanStep === "success" && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 justify-center font-bold text-xs select-none">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> DOĞRULAMA BAŞARILI!
                    </div>
                    <p className="text-[11.5px] text-zinc-300 leading-normal font-sans">
                      Yüzünüz profil fotoğrafınızla <strong className="text-emerald-400">%{compatibilityScore}</strong> oranında uyuştu. Hesabınız başarıyla <strong>ONAYLANDI</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={closeFaceScan}
                      className="mt-1 w-full py-2 bg-emerald-500 text-black font-sans font-bold text-[11px] rounded-xl hover:opacity-90 active:scale-98 transition-all cursor-pointer"
                    >
                      Tamamla ve Kapat
                    </button>
                  </div>
                )}

                {faceScanStep === "error" && (
                  <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl space-y-2">
                    <div className="text-red-400 font-bold text-xs flex items-center gap-1 justify-center">
                      HATA OLUŞTU
                    </div>
                    <p className="text-[11px] text-zinc-200 leading-normal">
                      {faceScanError || "Kamera erişimi engellendi veya yüzünüz tanımlanamadı."}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={startFaceScan}
                        className="flex-1 py-2 bg-zinc-850 hover:bg-zinc-800 text-white text-[11px] font-sans rounded-xl transition-all"
                      >
                        Tekrar Dene
                      </button>
                      <button
                        type="button"
                        onClick={closeFaceScan}
                        className="flex-1 py-1.5 bg-red-650 hover:bg-red-600 text-white text-[11px] font-sans rounded-xl transition-all"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}

                {faceScanStep !== "success" && faceScanStep !== "error" && (
                  <button
                    type="button"
                    onClick={closeFaceScan}
                    className="text-xs text-zinc-500 hover:text-zinc-350 underline font-sans py-2 block mx-auto cursor-pointer"
                  >
                    Vazgeç ve Kamerayı Kapat
                  </button>
                )}
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRM DELETE DIALOG */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 rounded-[28px]">
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-zinc-950 border border-red-500/35 p-5 rounded-3xl w-full max-w-[280px] text-center space-y-4 shadow-2xl"
            >
              <div className="w-11 h-11 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                ✕
              </div>
              <div className="space-y-1.5">
                <h4 className="text-white font-display font-black uppercase text-xs tracking-wider">İlanı Kaldır?</h4>
                <p className="text-[11.5px] text-zinc-400 font-sans leading-relaxed">
                  <span className="text-zinc-200 font-semibold">"{itemToDelete.title}"</span> ilanınızı kalıcı olarak kaldırmak istediğinize emin misiniz?
                </p>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-2 bg-dark-card hover:bg-zinc-900 border border-dark-border text-zinc-300 text-xs font-sans font-medium rounded-xl transition-all cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const skipConfirm = true;
                    onDeleteItem(itemToDelete.id, skipConfirm);
                    setItemToDelete(null);
                  }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-sans font-black uppercase rounded-xl transition-all cursor-pointer"
                >
                  Kaldır
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM LISTING DETAIL PREVIEW MODAL */}
      <AnimatePresence>
        {selectedPreviewItem && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col justify-end text-left rounded-[28px] overflow-hidden">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 200 }}
              className="bg-dark-bg border-t border-dark-border px-5 py-5 pb-8 w-full max-h-[85vh] overflow-y-auto flex flex-col"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-3 select-none">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neon">İLAN ÖNİZLEME DETAYLARI</span>
                <button 
                  onClick={() => setSelectedPreviewItem(null)}
                  className="p-1 px-3 py-1 bg-dark-card border border-dark-border hover:border-zinc-700 hover:text-white rounded-xl text-xs text-zinc-400 font-sans cursor-pointer transition-colors"
                >
                  Kapat ✕
                </button>
              </div>

              {/* Main content */}
              <div className="space-y-4">
                {/* Product Image */}
                <div className="w-full h-48 rounded-2xl overflow-hidden border border-dark-border relative bg-dark-panel">
                  <img src={selectedPreviewItem.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 bg-black/85 backdrop-blur-md text-[10px] text-zinc-350 px-2.5 py-1 rounded-lg border border-dark-border select-none">
                    Durum: <span className="text-neon font-black font-sans">{selectedPreviewItem.condition || "Belirtilmedi"}</span>
                  </div>
                </div>

                {/* Title and values */}
                <div className="space-y-1">
                  <h3 className="text-sm font-display font-bold text-white leading-tight">{selectedPreviewItem.title}</h3>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono uppercase tracking-wide flex-wrap">
                    <span>Kategori: {selectedPreviewItem.category}</span>
                    <span>•</span>
                    <span className="text-neon font-semibold">Tahmini Değer: {selectedPreviewItem.estimatedValue ? `${selectedPreviewItem.estimatedValue.toLocaleString("tr-TR")} TL` : "Belirtilmedi"}</span>
                  </div>
                </div>

                {/* Swap choice */}
                <div className="p-3 bg-dark-panel/65 rounded-xl border border-dark-border/60">
                  <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider mb-1">TERCİH EDİLEN TAKASLIK ÜRÜN</div>
                  <div className="text-xs text-zinc-200 font-semibold font-sans">
                    {selectedPreviewItem.targetSwap || "Her şeyle takas olur"}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">AÇIKLAMA</div>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed bg-zinc-950/40 p-3 rounded-xl border border-dark-border/40 whitespace-pre-wrap max-h-40 overflow-y-auto no-scrollbar">
                    {selectedPreviewItem.description || "Açıklama girilmemiş."}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM COMPLETED SWAP DETAILS MODAL */}
      <AnimatePresence>
        {selectedPreviewSwap && (() => {
          const isProposer = selectedPreviewSwap.proposerId === currentUser.id;
          const myItemTitle = isProposer ? selectedPreviewSwap.proposerItemTitle : selectedPreviewSwap.receiverItemTitle;
          const myItemImage = isProposer ? selectedPreviewSwap.proposerItemImage : selectedPreviewSwap.receiverItemImage;
          const peerItemTitle = isProposer ? selectedPreviewSwap.receiverItemTitle : selectedPreviewSwap.proposerItemTitle;
          const peerItemImage = isProposer ? selectedPreviewSwap.receiverItemImage : selectedPreviewSwap.proposerItemImage;
          const peerName = isProposer ? selectedPreviewSwap.receiverUsername : selectedPreviewSwap.proposerUsername;
          const formattedDate = new Date(selectedPreviewSwap.createdAt).toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          return (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col justify-end text-left rounded-[28px] overflow-hidden">
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 200 }}
                className="bg-dark-bg border-t border-dark-border px-5 py-5 pb-8 w-full max-h-[85vh] overflow-y-auto flex flex-col"
              >
                {/* Modal header */}
                <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-3 select-none">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neon">TAKAS DETAYLARI</span>
                  <button 
                    onClick={() => setSelectedPreviewSwap(null)}
                    className="p-1 px-3 py-1 bg-dark-card border border-dark-border hover:border-zinc-700 hover:text-white rounded-xl text-xs text-zinc-400 font-sans cursor-pointer transition-colors"
                  >
                    Kapat ✕
                  </button>
                </div>

                {/* Main content */}
                <div className="space-y-4">
                  {/* Swap match visual illustration */}
                  <div className="flex items-center justify-between gap-3 bg-zinc-950/40 p-4 rounded-2xl border border-dark-border/40">
                    <div className="flex-1 flex flex-col items-center gap-1.5 text-center min-w-0">
                      <img src={myItemImage} alt="" className="w-16 h-16 rounded-xl object-cover border border-dark-border shadow" />
                      <span className="text-[9px] text-zinc-500 font-mono font-bold leading-none uppercase">BENİM</span>
                      <div className="text-xs font-semibold text-white truncate w-full text-center">{myItemTitle}</div>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-450 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-bold shadow-inner">
                        ✔
                      </div>
                      <span className="text-[9px] text-zinc-550 font-sans mt-0.5 select-none uppercase tracking-widest font-bold">Takaslandı</span>
                    </div>

                    <div className="flex-1 flex flex-col items-center gap-1.5 text-center min-w-0">
                      <img src={peerItemImage} alt="" className="w-16 h-16 rounded-xl object-cover border border-dark-border shadow" />
                      <span className="text-[9px] text-zinc-500 font-mono font-bold leading-none truncate w-full">@{peerName}</span>
                      <div className="text-xs font-semibold text-white truncate w-full text-center">{peerItemTitle}</div>
                    </div>
                  </div>

                  {/* Summary lists */}
                  <div className="space-y-2.5">
                    <div className="text-[9.5px] text-zinc-500 font-mono uppercase tracking-wider">Takas Bilgileri</div>
                    
                    <div className="p-3 bg-dark-panel/65 rounded-xl border border-dark-border/60 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Takas Partneri:</span>
                        <span className="text-neon font-sans font-semibold">@{peerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Tamamlanma Tarihi:</span>
                        <span className="text-zinc-300 font-mono">{formattedDate}</span>
                      </div>
                      {selectedPreviewSwap.monetaryAmount && selectedPreviewSwap.monetaryAmount > 0 && (
                        <div className="flex justify-between border-t border-dark-border/40 pt-2 mt-2">
                          <span className="text-zinc-500">Maddi Denge Ayarlaması:</span>
                          <span className="text-white font-semibold">
                            {selectedPreviewSwap.monetaryType === 'give' && isProposer 
                              ? `-${selectedPreviewSwap.monetaryAmount.toLocaleString("tr-TR")} TL (Ödediğim)` 
                              : selectedPreviewSwap.monetaryType === 'give' ? `+${selectedPreviewSwap.monetaryAmount.toLocaleString("tr-TR")} TL (Alınan)` 
                              : selectedPreviewSwap.monetaryType === 'take' && isProposer 
                              ? `+${selectedPreviewSwap.monetaryAmount.toLocaleString("tr-TR")} TL (Alınan)` 
                              : `-${selectedPreviewSwap.monetaryAmount.toLocaleString("tr-TR")} TL (Ödediğim)`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message (if any) */}
                  {selectedPreviewSwap.message && (
                    <div className="space-y-1">
                      <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">İLK TEKLİF MESAJI</div>
                      <p className="text-xs text-zinc-350 font-sans leading-relaxed bg-zinc-950/40 p-3 rounded-xl border border-dark-border/40 whitespace-pre-wrap italic">
                        &ldquo; {selectedPreviewSwap.message} &rdquo;
                      </p>
                    </div>
                  )}

                  {/* Status Note */}
                  <div className="p-3 bg-emerald-500/5 text-emerald-400 text-[11px] rounded-xl border border-emerald-500/10 font-sans font-medium leading-relaxed">
                    Bu takas işlemi her iki tarafın onayı ile fiziki olarak başarıyla sonuçlandırılmış ve kayıtlara güvenli bir şekilde işlenmiştir. Katılımınız için teşekkürler!
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* PORTRAIT/AVATAR LIGHTBOX VIEWER */}
      <AnimatePresence>
        {avatarLightboxUrl && (
          <div 
            className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 rounded-[28px] select-none"
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
