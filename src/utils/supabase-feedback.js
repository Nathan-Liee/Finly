// src/utils/supabase.js
// Helper untuk insert feedback

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