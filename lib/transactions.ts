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