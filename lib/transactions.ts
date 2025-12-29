// lib/transactions.ts
import { supabase } from "@/lib/supabase.client";

export type TxType = "expense" | "income";

export type TransactionRow = {
    id: string;
    user_id: string;
    date: string; // YYYY-MM-DD 
    type: TxType;
    amount: number;
    category: string;
    memo: string | null;
    created_at: string;
};

export type TxQuery = {
  from: string; // "YYYY-MM-DD"
  to: string;   // "YYYY-MM-DD"
  type?: "all" | TxType;
  category?: string;
  q?: string; // memo検索
  limit?: number;  // default 30
  offset?: number; // default 0
};

export type TxQueryCount = {
  from: string;
  to: string;
  type?: "all" | TxType;
  category?: string;
  q?: string;
};

export async function addTransaction(input: {
    date: string;
    type: TxType;
    amount: number;
    category: string;
    memo?: string;
}) {
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user.id;
    if(!userId) throw new Error("not logged in");

    const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        date: input.date,
        type: input.type,
        amount: input.amount,
        category: input.category,
        memo: input.memo ?? null,
    });

    if(error) throw error;
}

export async function listTransactions(month?: string) {
    const { data: sess } = await supabase.auth.getSession();  
    const userId = sess.session?.user.id;
    if (!userId) throw new Error("not logged in");

    let q = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false})
    .order("created_at", { ascending: false});

    if (month) {
        const start = `${month}-01`;
        const end = nextMonthStart(month);
        q = q.gte("date", start).lt("date", end);
    }

    q = q.order("date", {ascending:false}).order("created_at", { ascending: false});

    const { data,error } = await q;
    if (error) throw error;  
    return (data ?? []) as TransactionRow[];
}

function nextMonthStart(month: string) {
    const[y, m] = month.split("-").map(Number);
    const d = new Date(y, m, 1);
    return d.toISOString().slice(0, 10);
}

export async function listTransactionsLatest(limit = 10) {
    const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", {ascending: false})
    .order("created_at", {ascending: false})
    .limit(limit);

    if (error) throw error;
    return (data ?? []) as TransactionRow[];
}

export async function listTransactionsFiltered(params: TxQuery) {
  const {
    from,
    to,
    type = "all",
    category,
    q,
    limit = 30,
    offset = 0,
  } = params;

  let query = supabase
    .from("transactions")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type !== "all") query = query.eq("type", type);
  if (category) query = query.eq("category", category);
  if (q && q.trim()) query = query.ilike("memo", `%${q.trim()}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as TransactionRow[];
}

export async function countTransactionsFiltered(params: TxQueryCount) {
  const { from, to, type = "all", category, q } = params;

  let query = supabase
    .from("transactions")
    // head:true でデータ本体を返さない（軽い）
    .select("*", { count: "exact", head: true })
    .gte("date", from)
    .lte("date", to);

  if (type !== "all") query = query.eq("type", type);
  if (category) query = query.eq("category", category);
  if (q && q.trim()) query = query.ilike("memo", `%${q.trim()}%`);

  const { count, error } = await query;
  if (error) throw new Error(error.message);

  return count ?? 0;
}