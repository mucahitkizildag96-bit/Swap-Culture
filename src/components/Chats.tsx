import React, { useState, useEffect, useRef } from "react";
import { SwapOffer, ChatMessage, User } from "../types";
import { getChatMessages, sendChatMessage } from "../utils";
import { Send, Image as ImageIcon, Camera, RotateCw, ArrowLeft, Paperclip, Check } from "lucide-react";

interface ChatsProps {
  activeSwap: SwapOffer;
  currentUser: User;
  onGoBack: () => void;
}

export default function Chats({ activeSwap, currentUser, onGoBack }: ChatsProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [attachedImageUrl, setAttachedImageUrl] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const listEndRef = useRef<HTMLDivElement>(null);

  const partnerUsername = activeSwap.proposerId === currentUser.id 
    ? activeSwap.receiverUsername 
    : activeSwap.proposerUsername;

  const loadMessages = async (silent = false) => {
    if (!silent) setIsPolling(true);
    try {
      const msgs = await getChatMessages(activeSwap.id);
      setMessages(msgs);
    } catch (err) {
      console.error("Error loading chat messages: ", err);
    } finally {
      if (!silent) setIsPolling(false);
    }
  };

  // Poll for messages every 3.5 seconds
  useEffect(() => {
    loadMessages();

    const interval = setInterval(() => {
      loadMessages(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeSwap.id]);

  // Scroll to bottom whenever messages list changes
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedImageUrl) return;

    try {
      setIsSending(true);
      const tempText = inputText;
      const tempImg = attachedImageUrl;
      setInputText("");
      setAttachedImageUrl("");

      await sendChatMessage(activeSwap.id, currentUser.id, tempText, tempImg);
      // Reload immediately
      await loadMessages(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === "string") {
        try {
          const { compressImage } = await import("../utils/imageCompressor");
          const compressed = await compressImage(reader.result, 500, 500, 0.7);
          setAttachedImageUrl(compressed);
        } catch (err) {
          console.error(err);
          setAttachedImageUrl(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
    
    // Clear value to allow selecting same file again
    e.target.value = "";
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-dark-bg border border-dark-border h-[680px] flex flex-col rounded-[28px] overflow-hidden" id="chat-session-cabinet">
      {/* Top Header */}
      <div className="bg-dark-panel border-b border-dark-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onGoBack} 
            className="p-1 px-1.5 rounded-lg bg-dark-card border border-dark-border text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="text-left select-none">
            <div className="text-xs text-zinc-400 font-sans">Takas Görüşmesi</div>
            <div className="text-sm font-bold text-white font-display">@{partnerUsername}</div>
          </div>
        </div>

        {/* Sync spinner indicators */}
        <div className="flex items-center gap-2">
          {isPolling && <div className="w-1.5 h-1.5 rounded-full bg-neon animate-ping" />}
          <span className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest bg-dark-card border border-dark-border px-2 py-0.5 rounded-lg">
            Sohbet
          </span>
        </div>
      </div>

      {/* Target swapping cards summary banner */}
      <div className="bg-dark-card/40 w-full p-2.5 px-4 border-b border-dark-border/40 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-left truncate">
          <span className="text-[10px] font-mono font-semibold text-neon uppercase bg-neon/10 rounded px-1">Önerilen</span>
          <span className="text-xs text-zinc-300 truncate max-w-[120px]">{activeSwap.proposerItemTitle}</span>
        </div>
        <span className="text-zinc-650 text-xs text-zinc-500 font-mono">⇆</span>
        <div className="flex items-center gap-2 text-right truncate">
          <span className="text-xs text-zinc-300 truncate max-w-[120px]">{activeSwap.receiverItemTitle}</span>
          <span className="text-[10px] font-mono font-semibold text-amber-500 uppercase bg-amber-500/10 rounded px-1">İstenen</span>
        </div>
      </div>

      {/* Chat Messages Scrolling List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar bg-black/25">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
            <ImageIcon className="w-7 h-7 text-zinc-800" />
            <p className="text-xs font-sans">Bu sohbette henüz mesaj yok.</p>
            <p className="text-[10px] max-w-xs font-sans text-zinc-650">Güvenliğiniz için tüm ödemeleri, kargolama adımlarını ve adresleri bu ekrandan netleştirin.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.senderId === "system";
            const isMe = msg.senderId === currentUser.id;

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center select-none py-1 px-4">
                  <div className="bg-dark-card/90 border border-dark-border/60 text-[11px] text-zinc-400 font-mono p-2 px-3.5 rounded-2xl max-w-sm text-center leading-relaxed italic whitespace-pre-line">
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={msg.id}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[75%] space-y-1 text-left`}>
                  {/* Sender details on top */}
                  <div className={`text-[10px] font-mono text-zinc-500 ${isMe ? "text-right" : "text-left"}`}>
                    {isMe ? "Sen" : `@${partnerUsername}`} • {new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </div>

                  {/* Message bubble */}
                  <div className={`p-3.5 rounded-2xl font-sans text-xs break-words leading-relaxed ${
                    isMe 
                      ? "bg-neon text-black rounded-tr-none font-medium" 
                      : "bg-dark-card border border-dark-border text-zinc-200 rounded-tl-none"
                  }`}>
                    {msg.text}
                    
                    {/* Embedded attachment */}
                    {msg.imageUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-black/10">
                        <img 
                          src={msg.imageUrl} 
                          alt="Attached media" 
                          className="max-w-full h-auto object-cover max-h-[140px]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={listEndRef} />
      </div>

      {/* Embedded attachment visualizer bar */}
      {attachedImageUrl && (
        <div className="p-2.5 px-4 bg-dark-card border-t border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={attachedImageUrl} alt="" className="w-8 h-8 rounded object-cover" />
            <span className="text-[10px] font-mono text-zinc-400">Ürün resmi eklendi</span>
          </div>
          <button 
            onClick={() => setAttachedImageUrl("")}
            className="text-xs text-red-400 hover:text-red-300 font-mono uppercase font-semibold"
          >
            Kaldır
          </button>
        </div>
      )}

      {/* Conversation input composer */}
      <form onSubmit={handleSend} className="bg-dark-panel p-3.5 border-t border-dark-border flex items-center gap-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleFileChange} 
          className="hidden" 
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 bg-dark-card border border-dark-border hover:border-zinc-700 text-zinc-450 hover:text-neon rounded-2xl transition-colors cursor-pointer"
          title="Cihazdan Fotoğraf Seç"
        >
          <Camera className="w-4 h-4" />
        </button>

        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Mesajınızı bu alana yazın..."
          className="flex-1 bg-dark-bg border border-dark-border text-zinc-200 text-xs p-3.5 rounded-2xl placeholder:text-zinc-650 focus:outline-none focus:border-neon font-sans"
        />

        <button
          type="submit"
          disabled={isSending || (!inputText.trim() && !attachedImageUrl)}
          className={`p-3.5 bg-neon hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold rounded-2xl transition-all`}
        >
          <Send className="w-4 h-4 font-black" />
        </button>
      </form>
    </div>
  );
}
