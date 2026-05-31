// src/utils/supabase-feedback.js
// Helper untuk insert/update feedback

import { supabase } from "./supabase";

export async function insertFeedback({ kategori, judul, pesan, email }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Anda harus login untuk mengirim masukan.");

  const { error } = await supabase.from('feedback').insert({
    user_id: user.id,
    email: email || user.email,
    kategori,
    judul,
    pesan,
  });

  if (error) throw error;
  return true;
}

export async function getFeedbackList(statusFilter = "Semua") {
  let query = supabase.from('feedback').select('*').order('created_at', { ascending: false });

  if (statusFilter !== "Semua") {
    query = query.eq('status', statusFilter.toLowerCase());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function updateFeedbackStatus(id, status) {
  const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
  if (error) throw error;
  return true;
}
