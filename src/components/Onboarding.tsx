import React, { useState } from "react";
import { login, onboard } from "../utils";
import { User } from "../types";
import { supabase, isSupabaseConfigured } from "../utils/supabase";
import { 
  RefreshCw, 
  MapPin, 
  Smile, 
  ArrowRight, 
  Check, 
  Apple, 
  Smartphone, 
  Mail, 
  Sparkles, 
  ShieldCheck, 
  Leaf, 
  ChevronLeft,
  Lock,
  ArrowUpDown,
  HeartHandshake,
  UserPlus,
  Upload
} from "lucide-react";

interface OnboardingProps {
  onLoginSuccess: (user: User, isNewSignup: boolean) => void;
}

const TOWNS = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", 
  "Adana", "Konya", "Gaziantep", "Eskişehir", "Trabzon"
];

export default function Onboarding({ onLoginSuccess }: OnboardingProps) {
  // Navigation states: "welcome" | "auth" | "sms_verify" | "onboard"
  const [viewState, setViewState] = useState<"welcome" | "auth" | "sms_verify" | "onboard">("welcome");
  
  // Tab within auth state: "email" | "phone" | "google"
  const [selectedTab, setSelectedTab] = useState<"email" | "phone" | "google">("email");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  
  // Onboarding parameters
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("İstanbul");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [showSmsSentAlert, setShowSmsSentAlert] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorText("Görsel boyutu en fazla 2MB olabilir.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setAvatarUrl(reader.result);
          setErrorText("");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // LOGIN ACTIONS
  const handleEmailAuth = async (e: React.FormEvent | null, isRegisterMode = false) => {
    if (e) e.preventDefault();
    if (!email) {
      setErrorText("Lütfen e-posta adresinizi giriniz.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorText("");
      
      let user: User;

      if (isSupabaseConfigured() && supabase) {
        if (isRegisterMode) {
          // Supabase signup
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });
          if (error) throw new Error(error.message);
          if (!data.user) throw new Error("Supabase kayıt işlemi başarısız.");
          
          // Sync with local backend
          user = await login({
            email,
            loginMode: "supabase",
            supabaseUserId: data.user.id,
            isRegister: true,
          });
        } else {
          // Supabase signin
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw new Error(error.message);
          if (!data.user) throw new Error("Supabase giriş işlemi başarısız.");
          
          // Sync with local backend
          user = await login({
            email,
            loginMode: "supabase",
            supabaseUserId: data.user.id,
          });
        }
      } else {
        // Fallback to offline/mock preset database auth
        user = await login({ email, password, loginMode: "email", isRegister: isRegisterMode });
      }
      
      checkUserOnboardFlow(user);
    } catch (err: any) {
      setErrorText(err.message || "Giriş esnasında teknik bir aksaklık yaşandı.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneRequestSms = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = phone.replace(/\s+/g, "");
    if (!cleanedPhone || cleanedPhone.length < 9) {
      setErrorText("Lütfen geçerli bir telefon numarası giriniz.");
      return;
    }
    
    setErrorText("");
    setIsLoading(true);
    
    // Simulate sending SMS
    setTimeout(() => {
      setIsLoading(false);
      setViewState("sms_verify");
      setShowSmsSentAlert(true);
      // Auto dismiss message in 5s
      setTimeout(() => setShowSmsSentAlert(false), 8000);
    }, 800);
  };

  const handleSmsVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsCode) {
      setErrorText("Lütfen doğrulama kodunu giriniz.");
      return;
    }

    if (smsCode !== "123456") {
      setErrorText("Hatalı doğrulama kodu. Test kodu: 123456");
      return;
    }

    try {
      setIsLoading(true);
      setErrorText("");
      
      const user = await login({ phone, loginMode: "phone" });
      checkUserOnboardFlow(user);
    } catch (err: any) {
      setErrorText(err.message || "Giriş doğrulanamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setErrorText("");
      
      // Select standard test email or randomize for nice simulation
      const randomId = Math.random().toString(36).substr(2, 4);
      const testEmail = `google_user_${randomId}@gmail.com`;
      const testName = `google_user_${randomId}`;
      
      const user = await login({ 
        email: testEmail, 
        username: testName, 
        loginMode: "google",
        avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&auto=format&fit=crop&q=80"
      });
      
      checkUserOnboardFlow(user);
    } catch (err: any) {
      setErrorText(err.message || "Google ile bağlanılamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserOnboardFlow = (user: User) => {
    // If the account is new (unconfigured), we navigate to profile onboarding steps
    if (user.ratingCount === 0 && user.completedSwaps === 0 && user.bio === "Swap Culture dünyasına yeni katıldı!") {
      setTempUser(user);
      setUsername(user.username);
      setViewState("onboard");
    } else {
      onLoginSuccess(user, false);
    }
  };

  const handleOnboardComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser) return;
    if (!username || !city || !avatarUrl) {
      setErrorText("Kullanıcı adı, yaşadığınız şehir ve profil fotoğrafı alanları zorunludur.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorText("");
      
      const updatedUser = await onboard({
        userId: tempUser.id,
        username,
        city,
        avatarUrl,
        bio: bio || "Takas yapmayı seviyorum!"
      });
      
      onLoginSuccess(updatedUser, true);
    } catch (err: any) {
      setErrorText(err.message || "Bilgiler kaydedilemedi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-dark-bg border border-dark-border p-8 rounded-[36px] text-center space-y-7 shadow-2xl relative overflow-hidden" id="auth-welcome-panel">
      {/* Small design accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-neon/5 rounded-full blur-2xl pointer-events-none" />

      {/* 1. STATE: SPLASH/WELCOME SCREEN */}
      {viewState === "welcome" && (
        <div className="space-y-8 py-4 flex flex-col justify-between min-h-[500px]">
          {/* Logo & Decorative loop */}
          <div className="space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-3xl bg-neon/10 border border-neon/30 animate-pulse" />
              {/* Stacked Arrows */}
              <div className="absolute inset-2 rounded-2xl bg-neon/15 border border-neon/25 flex items-center justify-center text-neon rotate-12 shadow-xl shadow-neon/5 transition-transform duration-1000">
                <ArrowUpDown className="w-10 h-10 text-neon" />
              </div>
              <span className="absolute -top-1 -right-1 bg-neon text-[9px] font-sans font-black text-black px-1.5 py-0.5 rounded-full uppercase scale-90 tracking-wider">
                YENİ
              </span>
            </div>

            <div className="pt-2 space-y-1">
              <h1 className="text-4xl sm:text-4.5xl font-display font-black tracking-tighter leading-none select-none">
                <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">SWAP</span>
                <span className="block text-neon filter drop-shadow-[0_0_12px_rgba(234,179,8,0.4)] tracking-wide transform hover:scale-102 transition-transform duration-350 cursor-default">CULTURE</span>
              </h1>
              {/* MANDATE BRAND RULE: MUST BE EXACTLY THE TAGLINE */}
              <p className="text-[10px] sm:text-xs text-neon tracking-widest font-mono font-bold uppercase pt-1" id="tagline-validation">
                Yeni nesil takas platformu
              </p>
            </div>
            
            <p className="text-zinc-400 text-xs font-sans max-w-xs mx-auto leading-relaxed pt-2">
              Eşyalarınızı değerinde ve güvenli bir ortamda nakit harcamadan kolayca takas edin; bütçenizi korurken sürdürülebilir bir geleceğe katkı sağlayın.
            </p>
          </div>

          {/* Core Highlights Grid */}
          <div className="bg-dark-card/40 border border-dark-border/60 rounded-2xl p-4 text-left space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs text-zinc-200 font-bold">Yeşil & Sürdürülebilir</h4>
                <p className="text-[10px] text-zinc-400 leading-normal">Kullanılmayan eşyaları geri kazandırır, israfı azaltır.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs text-zinc-200 font-bold">Aracısız & Komisyonsuz</h4>
                <p className="text-[10px] text-zinc-400 leading-normal">Kullanıcılar arası doğrudan ve tamamen ücretsiz takas modeli.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-neon/10 text-neon rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs text-zinc-200 font-bold">Güvenli ve Ortak Alanda</h4>
                <p className="text-[10px] text-zinc-400 leading-normal">Meydanlar ve AVM'ler gibi güvenli ortak noktalarda yüz yüze.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs text-zinc-200 font-bold">Değer Dengeleyici</h4>
                <p className="text-[10px] text-zinc-400 leading-normal">Adil olmayan takaslarda bütçe farkını TL olarak dengeleme.</p>
              </div>
            </div>
          </div>

          {/* Action Trigger button */}
          <div className="space-y-3">
            <button
              onClick={() => setViewState("auth")}
              className="w-full py-4 bg-neon hover:bg-neon/90 text-black font-sans font-black uppercase text-xs rounded-2xl transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-lg shadow-neon/10"
            >
              Hadi Başlayalım!
              <ArrowRight className="w-4 h-4 font-black transition-transform group-hover:translate-x-1" />
            </button>
            <p className="text-[9.5px] text-zinc-500 font-mono tracking-wider">
              Birlikte paylaşalım, birlikte kazanalım
            </p>
          </div>
        </div>
      )}

      {/* 2. STATE: AUTH SELECTION FLOW */}
      {viewState === "auth" && (
        <div className="space-y-6">
          {/* Simple header with tiny logo */}
          <div className="flex items-center justify-between text-left pb-2 border-b border-dark-border/40">
            <div className="flex items-center gap-2 select-none">
              <div className="w-7 h-7 rounded-lg bg-neon/10 text-neon flex items-center justify-center border border-neon/10">
                <ArrowUpDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-display font-extrabold text-white">Swap Culture</h3>
                <span className="text-[7.5px] text-neon font-mono font-bold block uppercase -mt-0.5">Yeni nesil takas</span>
              </div>
            </div>
            <button
              onClick={() => setViewState("welcome")}
              className="text-[10px] text-zinc-400 hover:text-white font-sans flex items-center gap-0.5 py-1 px-2 hover:bg-dark-card rounded-lg transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Geri
            </button>
          </div>

          <div className="space-y-1.5 text-center">
            <h2 className="text-xl font-display font-extrabold text-white">Giriş Yap / Üye Ol</h2>
            <p className="text-xs text-zinc-400">E-posta ve şifreniz ile güvenli giriş yapın veya yeni bir hesap oluşturun.</p>
          </div>

          <div className="space-y-4">
            <form onSubmit={(e) => handleEmailAuth(e, false)} className="space-y-4 text-left">
              <div>
                <label className="block text-zinc-500 text-[10.5px] font-mono uppercase tracking-wider mb-1.5">
                  E-POSTA ADRESI
                </label>
                <input 
                  type="email"
                  required
                  placeholder="isim@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-card border border-dark-border text-zinc-200 text-xs p-3.5 rounded-2xl placeholder:text-zinc-650 focus:outline-none focus:border-neon font-sans"
                />
              </div>

              <div>
                <label className="block text-zinc-500 text-[10.5px] font-mono uppercase tracking-wider mb-1.5">
                  ŞİFRE
                </label>
                <div className="relative">
                  <input 
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-dark-card border border-dark-border text-zinc-200 text-xs p-3.5 rounded-2xl placeholder:text-zinc-650 focus:outline-none focus:border-neon font-sans pr-10"
                  />
                  <div className="absolute right-3.5 top-3.5 text-zinc-600">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {errorText && <p className="text-red-500 text-xs font-sans text-center">{errorText}</p>}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-3.5 bg-neon hover:opacity-95 text-black font-sans font-black uppercase text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none"
                >
                  {isLoading ? "Giriş..." : "Giriş Yap"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleEmailAuth(null, true)}
                  disabled={isLoading}
                  className="py-3.5 bg-dark-card border border-neon/30 hover:border-neon text-neon hover:bg-neon/5 font-sans font-black uppercase text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none"
                >
                  {isLoading ? "Kayıt..." : "Kayıt Ol"}
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. STATE: SMS CODE VERIFICATION POPUP SCREEN */}
      {viewState === "sms_verify" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-left pb-2 border-b border-dark-border/40">
            <h3 className="text-sm font-display font-black text-white flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-neon animate-bounce" /> Telefon Doğrulama
            </h3>
            <button
              onClick={() => {
                setViewState("auth");
                setSelectedTab("phone");
                setErrorText("");
              }}
              className="text-[10px] text-zinc-400 hover:text-white font-sans flex items-center gap-0.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Değiştir
            </button>
          </div>

          <div className="space-y-2 text-center">
            <p className="text-xs text-zinc-300 leading-normal">
              Kaydettiğiniz telefon numarasına gönderilen <span className="text-white font-bold">6 haneli</span> doğrulama kodunu giriniz.
            </p>
            <div className="text-[10px] text-neon bg-neon/10 border border-neon/20 px-2.5 py-1.5 rounded-xl font-mono inline-block">
              Simüle Test Doğrulama Kodu: <span className="font-bold underline tracking-wider">123456</span>
            </div>
          </div>

          <form onSubmit={handleSmsVerifySubmit} className="space-y-4">
            <div>
              <input 
                type="text"
                required
                maxLength={6}
                placeholder="000000"
                value={smsCode}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "");
                  setSmsCode(cleaned);
                }}
                className="w-full text-center tracking-[1em] pl-[1em] bg-dark-card border border-dark-border text-neon text-lg p-3.5 rounded-2xl focus:outline-none focus:border-neon font-mono font-black"
                autoFocus
              />
            </div>

            {errorText && <p className="text-red-500 text-xs font-sans text-center">{errorText}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-neon hover:opacity-95 text-black font-sans font-black uppercase text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-neon/5"
            >
              {isLoading ? "Doğrulanıyor..." : "Kodu Doğrula ve Giriş Yap"}
              <ArrowRight className="w-4 h-4 font-black" />
            </button>

            <div className="flex justify-between items-center text-[10px] text-zinc-500 px-1 pt-1">
              <span>Sertifikalı SMS Sistemi</span>
              <button
                type="button"
                onClick={() => {
                  setSmsCode("123456");
                  setErrorText("");
                }}
                className="text-neon hover:underline"
              >
                Kodu otomatik doldur
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. STATE: ONBOARDS DETAILED PROFILE DETAILS SCREEN */}
      {viewState === "onboard" && (
        <form onSubmit={handleOnboardComplete} className="space-y-4 text-left">
          <div className="text-center select-none space-y-1">
            <h3 className="text-white font-display font-bold text-md flex items-center justify-center gap-1.5">
              <Smile className="w-5 h-5 text-neon" /> Aramıza Hoş Geldin!
            </h3>
            <p className="text-zinc-400 text-xs font-sans">
              Takasçı profilini özelleştirmek için aşağıdaki adımları tamamlayın.
            </p>
          </div>

          {/* Custom Avatar Selector without suggestion presets */}
          <div>
            <label className="block text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-2">
              Profil Fotoğrafı <span className="text-neon">*</span>
            </label>
            <div className="flex items-center gap-4 bg-dark-panel p-4 rounded-2xl border border-dark-border">
              {avatarUrl ? (
                <div className="w-16 h-16 rounded-full border-2 border-neon overflow-hidden shrink-0 relative bg-dark-card shadow-lg shadow-neon/15">
                  <img src={avatarUrl} alt="Profil Önizleme" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-700 shrink-0 bg-dark-card flex items-center justify-center text-zinc-600 text-[11px] font-mono">
                  Foto Yok
                </div>
              )}
              <div className="flex-1 space-y-1.5 text-left">
                <p className="text-[10px] text-zinc-400 font-sans leading-normal">
                  Yüzünüzü net gösteren kendi fotoğrafınızı yükleyin. Bu bilgi profil güvenliği açısından zorunludur.
                </p>
                <label className="cursor-pointer inline-flex items-center gap-1.5 bg-dark-card hover:bg-dark-panel border border-dark-border text-zinc-300 hover:text-white px-3 py-2 rounded-xl text-[10.5px] font-sans transition-colors select-none">
                  <Upload className="w-3.5 h-3.5 text-neon" />
                  <span>Fotoğraf Yükle</span>
                  <input 
                     type="file" 
                     accept="image/*" 
                     onChange={handleFileChange} 
                     className="hidden" 
                     required
                  />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-1.5">
              Kullanıcı Adı <span className="text-neon">*</span>
            </label>
            <input 
              type="text"
              required
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-dark-card border border-dark-border text-zinc-200 p-3 rounded-2xl text-xs focus:outline-none focus:border-neon font-sans"
            />
          </div>

          <div>
            <label className="block text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-1.5">
              Yaşadığınız Şehir <span className="text-neon">*</span>
            </label>
            <div className="relative">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-dark-card border border-dark-border text-zinc-300 p-3 pl-9 rounded-2xl text-xs focus:outline-none focus:border-neon font-sans cursor-pointer appearance-none animate-none"
              >
                {TOWNS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="absolute left-3 top-3 text-neon">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-1.5">
              Kısa Özgeçmiş (Bio)
            </label>
            <textarea
              placeholder="Hangi tarz ürünleri takaslıyorsunuz? Kendinizden bahsedin."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full bg-dark-card border border-dark-border text-zinc-200 p-3 rounded-2xl text-xs focus:outline-none focus:border-neon font-sans placeholder:text-zinc-650"
            />
          </div>

          {errorText && <p className="text-red-500 text-xs font-sans text-center">{errorText}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-2 bg-neon text-black font-sans font-black uppercase text-xs rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            {isLoading ? "Kaydediliyor..." : "Profili Oluştur"}
          </button>
        </form>
      )}

      {/* Floating SMS Sent Banner notification */}
      {showSmsSentAlert && (
        <div className="absolute top-4 left-4 right-4 bg-dark-panel border border-neon/30 text-zinc-300 text-[10px] p-3 rounded-xl flex items-center gap-2 text-left shadow-2xl animate-fade-in z-50">
          <div className="p-1 bg-neon/15 rounded text-neon animate-bounce">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-white block">SMS Gönderildi!</span>
            Test amacıyla doğrulama kodunuz <span className="text-neon font-bold">123456</span> olarak ayarlanmıştır.
          </div>
        </div>
      )}
    </div>
  );
}
