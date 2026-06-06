import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://uctchotfaxlskxoddhct.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdGNob3RmYXhsc2t4b2RkaGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODM2MTYsImV4cCI6MjA5NjI1OTYxNn0.IJTENg16_SLkv79Dex4fCXkmPXj3KBKOgI8boOQlV3I"
);

async function check() {
  const { data: oData, error: oErr } = await supabase.from('orders').select('*').limit(1);
  console.log("Orders columns:", oData && oData[0] ? Object.keys(oData[0]) : "Empty or Error:", oErr);

  const { data: bData, error: bErr } = await supabase.from('bookings').select('*').limit(1);
  console.log("Bookings columns:", bData && bData[0] ? Object.keys(bData[0]) : "Empty or Error:", bErr);

  const { data: cData, error: cErr } = await supabase.from('chatSessions').select('*').limit(1);
  console.log("chatSessions:", cErr);
}

check();
