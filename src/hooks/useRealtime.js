import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export const useRealtime = (tableName, userId = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tableName || !userId) {
      setData([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      let query = supabase.from(tableName).select('*');
      
      // Filter by user_id kalau tersedia
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      query = query.order('created_at', { ascending: false });

      const { data: initialData, error: fetchError } = await query;

      if (!isMounted) return;

      if (fetchError) {
        console.error('Gagal fetch data:', fetchError.message);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setData(initialData || []);
      setLoading(false);
    };

    fetchData();

    // Realtime subscription — hanya aktif kalau user sudah login
    let channel = null;
    if (userId) {
      channel = supabase
        .channel(`live-${tableName}-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName, filter: `user_id=eq.${userId}` },
          (payload) => {
            if (!isMounted) return;
            if (payload.eventType === 'INSERT') {
              setData((prev) => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setData((prev) =>
                prev.map((item) => (item.id === payload.new.id ? payload.new : item))
              );
            } else if (payload.eventType === 'DELETE') {
              setData((prev) => prev.filter((item) => item.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [tableName, userId]);

  return { data, loading, error };
};
