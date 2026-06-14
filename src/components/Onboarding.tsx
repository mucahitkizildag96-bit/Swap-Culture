import React, { useState } from "react";
import { onboard } from "../utils";
import { User } from "../types";
import { supabase, isSupabaseConfigured } from "../utils/supabase";

import {
  ArrowRight,
  MapPin,
  Smile,
  ChevronLeft,
  Lock,
  Smartphone,
  Mail,
  UserPlus,
  Upload,
  ArrowUpDown,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Leaf
} from "lucide-react";

interface OnboardingProps {
  onLoginSuccess: (user: User, isNewSignup: boolean) => void;
}

const TOWNS = ["İstanbul","Ankara","İzmir","Bursa","Antalya","Adana","Konya","Gaziantep","Eskişehir","Trabzon"];

export default function Onboarding({ onLoginSuccess }: OnboardingProps) {
  const [viewState, setViewState] = useState<"welcome"|"auth"|"sms_verify"|"onboard">("welcome");
  const [selectedTab, setSelectedTab] = useState<"email"|"phone"|"google">("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");

  const [tempUser, setTempUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("İstanbul");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ✅ SUPABASE EMAIL AUTH
  const handleEmailAuth = async (e: React.FormEvent, isRegister = false) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setErrorText("");

      if (!supabase) throw new Error("Supabase yok");

      let authUser;

      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        authUser = data.user;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        authUser = data.user;
      }

      if (!authUser) throw new Error("Auth user yok");

      const user: User = {
        id: authUser.id,
        email: authUser.email!,
        username: authUser.email!.split("@")[0],
        ratingCount: 0,
        completedSwaps: 0,
        bio: "Swap Culture dünyasına yeni katıldı!"
      };

      if (user.ratingCount === 0 && user.completedSwaps === 0) {
        setTempUser(user);
        setUsername(user.username);
        setViewState("onboard");
      } else {
        onLoginSuccess(user, false);
      }

    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ SMS MOCK (değişmedi)
  const handleSmsVerify = () => {
    if (smsCode !== "123456") {
      setErrorText("Kod 123456 olmalı");
      return;
    }

    const user: User = {
      id: "phone-user",
      email: "",
      username: "phone_user",
      ratingCount: 0,
      completedSwaps: 0,
      bio: "Telefon ile giriş"
    };

    setTempUser(user);
    setViewState("onboard");
  };

  // ✅ GOOGLE MOCK
  const handleGoogle = async () => {
    const user: User = {
      id: "google-" + Math.random(),
      email: "google@test.com",
      username: "google_user",
      ratingCount: 0,
      completedSwaps: 0,
      bio: "Google ile giriş"
    };

    setTempUser(user);
    setViewState("onboard");
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser) return;

    try {
      setIsLoading(true);

      const updated = await onboard({
        userId: tempUser.id,
        username,
        city,
        avatarUrl,
        bio
      });

      onLoginSuccess(updated, true);

    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-white">

      {viewState === "welcome" && (
        <button onClick={() => setViewState("auth")}>
          Başla
        </button>
      )}

      {viewState === "auth" && (
        <div className="space-y-4">

          {/* EMAIL LOGIN */}
          {selectedTab === "email" && (
            <form onSubmit={(e) => handleEmailAuth(e,false)}>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email"/>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
              <button type="submit">Giriş</button>
              <button onClick={(e)=>handleEmailAuth(e,true)}>Kayıt</button>
            </form>
          )}

          <button onClick={handleGoogle}>Google</button>

          <button onClick={()=>setSelectedTab("phone")}>Phone</button>
        </div>
      )}

      {viewState === "sms_verify" && (
        <div>
          <input value={smsCode} onChange={e=>setSmsCode(e.target.value)} />
          <button onClick={handleSmsVerify}>Doğrula</button>
        </div>
      )}

      {viewState === "onboard" && (
        <form onSubmit={handleOnboard}>
          <input value={username} onChange={e=>setUsername(e.target.value)} />
          <select value={city} onChange={e=>setCity(e.target.value)}>
            {TOWNS.map(t=> <option key={t}>{t}</option>)}
          </select>

          <input type="file" onChange={handleFileChange} />
          <textarea value={bio} onChange={e=>setBio(e.target.value)} />

          <button type="submit">Bitir</button>
        </form>
      )}

      {errorText && <p>{errorText}</p>}
    </div>
  );
}
