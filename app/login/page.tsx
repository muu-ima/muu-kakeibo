// app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase.client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    // 既ログインなら家計簿へ
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/kakeibo");
    });
  }, [router]);

  const signIn = async () => {
    setStatus("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setStatus(error.message);
    router.replace("/kakeibo");
  };

  const signUp = async () => {
    setStatus("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setStatus(error.message);
    setStatus("登録OK。確認メールが来る設定の場合はメールを確認してね。");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setStatus("ログアウトしました");
  };

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-xl font-semibold">ログイン</h1>

      <div className="space-y-2">
        <input
          className="w-full rounded-lg border bg-white p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          autoComplete="email"
        />
        <input
          className="w-full rounded-lg border bg-white p-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          autoComplete="current-password"
        />
      </div>

      <div className="flex gap-2">
        <button className="flex-1 rounded-lg border px-3 py-2" onClick={signIn}>
          ログイン
        </button>
        <button className="flex-1 rounded-lg border px-3 py-2" onClick={signUp}>
          新規登録
        </button>
      </div>

      <button className="w-full rounded-lg border px-3 py-2" onClick={signOut}>
        ログアウト
      </button>

      {status && <p className="text-sm text-zinc-700">{status}</p>}

      <p className="text-xs text-zinc-500">
        ※ EmailログインをSupabase側でONにしておいてね（Authentication → Providers）
      </p>
    </main>
  );
}

