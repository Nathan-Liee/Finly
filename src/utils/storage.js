import { supabase } from './supabase'

export function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function loadData() {
  const { getUangAwalLocal, getTransaksiLocal, saveAllToLocal } = await import('../db/index.js');
  
  // Ambil data dari penyimpanan lokal HP (Offline First)
  let kasHarian = [];
  let transaksi = [];
  
  try {
    kasHarian = await getUangAwalLocal() || [];
  } catch (err) {
    console.warn("[loadData] IndexedDB uang_awal error:", err);
  }
  
  try {
    transaksi = await getTransaksiLocal() || [];
  } catch (err) {
    console.warn("[loadData] IndexedDB transaksi error:", err);
  }

  // Jika lokal kosong dan user login, coba tarik dari Supabase
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && navigator.onLine && kasHarian.length === 0) {
      const { data: kasHarianDb, error: errKas } = await supabase
        .from('uang_awal')
        .select('*')
        .eq('user_id', user.id);

      const { data: transaksiDb, error: errTrans } = await supabase
        .from('transaksi')
        .select('*')
        .eq('user_id', user.id)
        .order('urutan', { ascending: true });

      if (!errKas && !errTrans) {
        kasHarian = kasHarianDb || [];
        transaksi = transaksiDb || [];
        // Simpan hasil tarikan ke lokal
        try { await saveAllToLocal(kasHarian, transaksi); } catch { /* skip */ }
      }
    }
  } catch (err) {
    console.warn("[loadData] Supabase check failed, using local data", err);
  }

  const result = {};
  kasHarian?.forEach(k => {
    result[k.tanggal] = {
      uang_awal: k.uang_awal,
      transaksi: transaksi
        ?.filter(t => t.tanggal === k.tanggal)
        .map(t => ({
          type: t.type,
          jumlah: t.jumlah,
          metode: t.metode,
          kategori: t.kategori,
          catatan: t.catatan,
        })) || []
    };
  });
  return result;
}

export async function saveHarian(tanggal, uang_awal) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Manual check and update to avoid upsert unique constraint issues
  const { data: existing } = await supabase
    .from('uang_awal')
    .select('id')
    .eq('tanggal', tanggal)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('uang_awal').update({ uang_awal }).eq('id', existing.id);
  } else {
    await supabase.from('uang_awal').insert({ tanggal, uang_awal, user_id: user.id });
  }
}

export async function saveTransaksi(tanggal, transaksiList) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Hapus yang lama
  await supabase
    .from('transaksi')
    .delete()
    .eq('tanggal', tanggal)
    .eq('user_id', user.id);

  // Insert baru hanya kalau ada isinya
  if (transaksiList.length === 0) return;

  const { error } = await supabase
    .from('transaksi')
    .insert(
      transaksiList.map((t, i) => ({
        tanggal,
        type: t.type,
        jumlah: t.jumlah,
        metode: t.metode || null,
        kategori: t.kategori || null,
        catatan: t.catatan || null,
        urutan: i,
        user_id: user.id,
      }))
    );

  if (error) {
    console.error('Gagal simpan transaksi:', error.message);
    throw error; // Lempar error agar App.jsx bisa tangkap
  }
}

export async function loadProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Resolve username dari prioritas: metadata → email prefix → default
    const metaUsername = user.user_metadata?.username;
    const emailPrefix = user.email?.split('@')?.[0];
    const fallbackUsername = metaUsername || emailPrefix || 'user';

    // Coba ambil profile
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      // Profile belum ada — buat baru
      const { data: created } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: fallbackUsername,
          email: user.email,
        })
        .select()
        .single();
      data = created;
    } else if (!data.username) {
      // Profile ada tapi username kosong/null — update
      await supabase
        .from('profiles')
        .update({ username: fallbackUsername })
        .eq('id', user.id);
      data.username = fallbackUsername;
    }

    return { ...data, email: user.email };
  } catch {
    return null;
  }
}

export async function updateProfile(username) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('profiles')
    .update({ username })
    .eq('id', user.id);
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
export async function getEmailByUsername(username) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single();
    
    if (error || !data) return null;
    return data.email || null;
  } catch {
    return null;
  }
}

/**
 * Resolve display name dengan fallback chain:
 * profile.username → user.user_metadata.username → email prefix → 'User'
 */
export function getDisplayName(profile, user) {
  return profile?.username
    || user?.user_metadata?.username
    || user?.email?.split('@')?.[0]
    || 'User';
}