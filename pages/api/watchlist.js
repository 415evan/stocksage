// pages/api/watchlist.js
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Not signed in" });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const email = session.user.email;

  if (req.method === "GET") {
    const { data, error } = await supabase.from("watchlists").select("symbols").eq("email", email).single();
    if (error && error.code !== "PGRST116") return res.status(500).json({ error: error.message });
    return res.status(200).json({ symbols: data?.symbols || [] });
  }

  if (req.method === "POST") {
    const { symbols } = req.body;
    const { error } = await supabase.from("watchlists").upsert({ email, symbols, updated_at: new Date().toISOString() }, { onConflict: "email" });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
