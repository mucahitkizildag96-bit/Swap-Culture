import React, { useState } from "react";
import { createItem } from "../utils";
import { User, Item } from "../types";
import { Plus, Camera, MapPin, Check, Image as ImageIcon, AlertCircle, Star, Trash2 } from "lucide-react";

interface ListingFormProps {
  currentUser: User;
  onSuccess: (newItem: Item) => void;
}

const CATEGORIES = [
  "Telefon",
  "Motorlu Araçlar",
  "Tablet",
  "Bilgisayar",
  "Drone",
  "Fotoğraf Makinesi",
  "Diğer Elektronik",
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

const CITIES = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", 
  "Adana", "Konya", "Gaziantep", "Eskişehir", "Trabzon",
  "Samsun", "Mersin", "Muğla", "Kocaeli", "Denizli"
];

export default function ListingForm({ currentUser, onSuccess }: ListingFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Telefon");
  const [condition, setCondition] = useState<"Yeni" | "Az Kullanılmış" | "Kullanılmış">("Az Kullanılmış");
  const [targetSwap, setTargetSwap] = useState("Telefon"); // Default to category name
  const [estimatedValue, setEstimatedValue] = useState<string>(""); // Approximate value in TL
  const [city, setCity] = useState(currentUser.city || "İstanbul");
  
  // 6 Image Slots Storage
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [showcaseIndex, setShowcaseIndex] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadProgress, setUploadProgress] = useState(false);

  // Derive active cover visual preview
  const uploadedIndices = images.map((img, i) => (img ? i : -1)).filter(i => i !== -1);
  let activeCoverUrl = "";
  let isCoverSelectedExplicitly = false;

  if (showcaseIndex !== null && images[showcaseIndex]) {
    activeCoverUrl = images[showcaseIndex]!;
    isCoverSelectedExplicitly = true;
  } else if (uploadedIndices.length > 0) {
    // Show the first uploaded image in preview if none selected yet
    activeCoverUrl = images[uploadedIndices[0]]!;
  }

  const handleFileChangeForSlot = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImages(prev => {
          const next = [...prev];
          next[idx] = reader.result as string;
          return next;
        });
      }
      setUploadProgress(false);
    };
    reader.onerror = () => {
      setErrorMsg("Görsel yüklenirken bir hata oluştu.");
      setUploadProgress(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title || !category || !condition || !targetSwap || !city || !estimatedValue) {
      setErrorMsg("Lütfen tüm zorunlu (yıldızlı) alanları doldurun.");
      return;
    }

    const currentUploadedIndices = images.map((img, i) => (img ? i : -1)).filter(i => i !== -1);
    if (currentUploadedIndices.length < 2) {
      setErrorMsg("Lütfen en az 2 adet ürün fotoğrafı yükleyin.");
      return;
    }

    try {
      setIsLoading(true);

      // Determine final showcase photo: user choice or fallback to a randomly assigned uploaded image
      let finalCoverUrl = "";
      if (showcaseIndex !== null && images[showcaseIndex]) {
        finalCoverUrl = images[showcaseIndex]!;
      } else {
        // Random assign from uploaded
        const randomIndex = currentUploadedIndices[Math.floor(Math.random() * currentUploadedIndices.length)];
        finalCoverUrl = images[randomIndex]!;
      }

      const itemData = {
        userId: currentUser.id,
        title,
        description,
        category,
        condition,
        targetSwap,
        city,
        imageUrl: finalCoverUrl,
        estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
      };

      const itemsResult = await createItem(itemData);
      onSuccess(itemsResult);

      // Reset form variables
      setTitle("");
      setDescription("");
      setTargetSwap("Telefon");
      setEstimatedValue("");
      setImages([null, null, null, null, null, null]);
      setShowcaseIndex(null);
    } catch (err: any) {
      setErrorMsg(err.message || "İlan yayınlanırken hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-dark-bg border border-dark-border p-6 rounded-[28px]" id="listing-creation-card">
      <div className="flex items-center gap-3 mb-6 select-none border-b border-dark-border pb-4">
        <div className="w-9 h-9 rounded-xl bg-neon/15 flex items-center justify-center text-neon">
          <Plus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-white font-display font-bold text-lg leading-tight">Takas İlanı Ekle</h2>
          <p className="text-[10.5px] text-zinc-400 font-mono tracking-wide uppercase mt-0.5">
            Ürününü sisteme yükle ve takas teklifleri topla
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        {/* Visual Showcase Cover Selection */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider">
              Ürün Fotoğrafları (En Az 2 Adet - En Fazla 6 Adet) <span className="text-neon">*</span>
            </label>
            <span className="text-[10px] text-zinc-550 font-mono">
              Yüklenen: {uploadedIndices.length}/6
            </span>
          </div>

          {/* 6 Grid Slots */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {images.map((imgUrl, idx) => {
              const isShowcase = showcaseIndex === idx;
              return (
                <div 
                  key={idx}
                  className={`relative h-28 rounded-2xl overflow-hidden border transition-all flex flex-col items-center justify-center select-none bg-dark-card/40 ${
                    imgUrl 
                      ? isShowcase 
                        ? "border-neon ring-2 ring-neon/20 shadow-[0_0_12px_rgba(20,250,140,0.15)]"
                        : "border-dark-border" 
                      : "border-dashed border-zinc-700 hover:border-neon hover:bg-dark-panel/30"
                  }`}
                >
                  {imgUrl ? (
                    <>
                      {/* Image Preview */}
                      <img src={imgUrl} alt={`Ürün ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {/* Dark elegant gradient cover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35 opacity-90" />

                      {/* Top action row */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-center">
                        {/* Showcase designator toggle */}
                        <button
                          type="button"
                          onClick={() => setShowcaseIndex(idx)}
                          title={isShowcase ? "Bu görsel vitrin resmi olarak seçildi" : "Vitrin görseli olarak ayarla"}
                          className={`p-1.5 rounded-lg backdrop-blur-md transition-all flex items-center justify-center cursor-pointer ${
                            isShowcase
                              ? "bg-neon text-black scale-102 font-bold"
                              : "bg-black/60 hover:bg-black/80 hover:scale-105 hover:text-neon text-zinc-450"
                          }`}
                        >
                          <Star className="w-3 h-3 fill-current" />
                        </button>

                        {/* Delete / Clear button */}
                        <button
                          type="button"
                          onClick={() => {
                            setImages(prev => {
                              const next = [...prev];
                              next[idx] = null;
                              return next;
                            });
                            if (isShowcase) {
                              setShowcaseIndex(null);
                            }
                          }}
                          title="Resmi kaldır"
                          className="p-1.5 bg-black/60 hover:bg-red-950/80 hover:text-red-400 text-zinc-400 rounded-lg cursor-pointer backdrop-blur-md transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Bottom change label */}
                      <label 
                        htmlFor={`file-input-${idx}`}
                        className="absolute bottom-1.5 left-1.5 right-1.5 text-center py-1 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-[8.5px] font-mono text-zinc-300 font-bold uppercase tracking-wider rounded-md cursor-pointer border border-zinc-800/80 transition-all select-none"
                      >
                        Değiştir
                      </label>
                    </>
                  ) : (
                    <>
                      {/* Empty slot wrapper */}
                      <label 
                        htmlFor={`file-input-${idx}`}
                        className="w-full h-full flex flex-col items-center justify-center gap-1.5 group cursor-pointer p-4 text-center"
                      >
                        <div className="w-8 h-8 rounded-full bg-zinc-900 group-hover:bg-neon/15 border border-zinc-800 group-hover:border-neon/30 flex items-center justify-center transition-all text-zinc-500 group-hover:text-neon scale-95 group-hover:scale-105">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-[9.5px] uppercase font-mono tracking-wider text-zinc-500 group-hover:text-zinc-350 transition-colors">
                          Fotoğraf {idx + 1}
                        </span>
                      </label>
                    </>
                  )}

                  {/* Hidden input for this slot */}
                  <input 
                    type="file" 
                    id={`file-input-${idx}`}
                    accept="image/*"
                    onChange={(e) => handleFileChangeForSlot(idx, e)}
                    className="hidden"
                  />
                </div>
              );
            })}
          </div>

          {/* Render Active Image Preview */}
          <div className="relative h-44 rounded-2xl overflow-hidden border border-dark-border bg-dark-panel/40 mb-1 flex items-center justify-center transition-all">
            {activeCoverUrl ? (
              <img src={activeCoverUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-zinc-650 flex flex-col items-center gap-1.5 font-sans">
                <ImageIcon className="w-8 h-8" />
                <span className="text-xs">Uyumlu görsel yerleştirilecek</span>
              </div>
            )}
            <div className="absolute bottom-2.5 left-2.5 px-3 py-1 bg-black/75 backdrop-blur-md rounded-lg text-[9.5px] font-mono border border-dark-border flex items-center gap-1">
              <Star className={`w-3 h-3 ${isCoverSelectedExplicitly ? "text-neon fill-current" : "text-zinc-500"}`} />
              <span className={isCoverSelectedExplicitly ? "text-neon font-bold" : "text-zinc-300"}>
                {isCoverSelectedExplicitly 
                  ? "Seçtiğiniz Vitrin Görseli" 
                  : "Varsayılan Vitrin Görseli (Rastgele Seçilecektir)"}
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-1.5">
            İlan Başlığı <span className="text-neon">*</span>
          </label>
          <input 
            type="text"
            required
            placeholder="Örn: Playstation 5 Slim 1TB iki Kollu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-dark-card border border-dark-border text-zinc-200 p-3.5 rounded-2xl text-xs placeholder:text-zinc-650 focus:outline-none focus:border-neon font-sans"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-1.5">
            İlan Açıklaması
          </label>
          <textarea 
            placeholder="Cihazın durumu, garantisi, çizik durumu veya takas etmek isteyeceğiniz diğer alternatifleri detaylandırın..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-dark-card border border-dark-border text-zinc-200 p-3.5 rounded-2xl text-xs placeholder:text-zinc-650 focus:outline-none focus:border-neon font-sans"
          />
        </div>

        {/* Categories, Condition, City Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-1.5">
              Kategori <span className="text-neon">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-dark-card border border-dark-border text-zinc-300 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-neon font-sans cursor-pointer"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-1.5">
              Ürün Durumu <span className="text-neon">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1 bg-dark-card p-1 rounded-2xl border border-dark-border">
              {(["Yeni", "Az Kullanılmış", "Kullanılmış"] as const).map(cond => (
                <button
                  type="button"
                  key={cond}
                  onClick={() => setCondition(cond)}
                  className={`py-2 rounded-xl text-[10.5px] font-sans font-medium transition-all ${
                    condition === cond 
                      ? "bg-neon text-black font-semibold shadow-inner" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target Swap Item (Category selector) */}
          <div>
            <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-1.5">
              Takas Karşılığında İstenen Kategori <span className="text-neon">*</span>
            </label>
            <select
              value={targetSwap}
              onChange={(e) => setTargetSwap(e.target.value)}
              className="w-full bg-dark-card border border-dark-border text-zinc-300 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-neon font-sans cursor-pointer"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Mandatory City selection */}
          <div>
            <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1">
              Bulunduğunuz Şehir <span className="text-neon">*</span>
            </label>
            <div className="relative">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-dark-card border border-dark-border text-zinc-350 p-3.5 pl-9 rounded-2xl text-xs focus:outline-none focus:border-neon font-sans cursor-pointer appearance-none"
              >
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="absolute left-3 top-3.5 text-neon">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Estimated Value (TL) */}
        <div>
          <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Ürünün Yaklaşık Değeri (TL) <span className="text-neon">*</span></span>
            <span className="text-[10px] text-zinc-500 lowercase">değer dengesi için önemlidir</span>
          </label>
          <div className="relative">
            <input 
              type="number"
              min="0"
              placeholder="Örn: 15000"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              className="w-full bg-dark-card border border-dark-border text-zinc-200 p-3.5 pr-12 rounded-2xl text-xs placeholder:text-zinc-650 focus:outline-none focus:border-neon font-sans"
            />
            <div className="absolute right-4 top-3.5 text-neon font-mono text-xs font-bold font-sans">
              TL
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 p-3.5 rounded-2xl text-xs font-sans">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || uploadProgress}
          className={`w-full py-4 mt-2 bg-neon text-black font-sans font-black uppercase text-xs rounded-2xl hover:opacity-95 transition-opacity flex items-center justify-center gap-2 ${
            (isLoading || uploadProgress) ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Yayınlanıyor..." : "İlanı Başarıyla Yayınla"}
        </button>
      </form>
    </div>
  );
}
