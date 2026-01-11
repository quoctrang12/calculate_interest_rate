
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

const isConfigured = () => !!(supabaseUrl && supabaseKey);

const supabase = isConfigured() 
  ? createClient(supabaseUrl!, supabaseKey!) 
  : null;

const TABLE_NAME = 'app_data';

// Hàm lưu dữ liệu (Upsert: Nếu có ID rồi thì update, chưa có thì insert)
export const saveToCloud = async (key: string, data: any) => {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert({ 
        id: key, 
        content: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error('Supabase Save Error:', error);
    }
  } catch (err) {
    console.error('Cloud Save Exception:', err);
  }
};

// Hàm đọc dữ liệu
export const loadFromCloud = async (key: string) => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('content')
      .eq('id', key)
      .single();

    if (error) {
      // Mã lỗi PGRST116 nghĩa là không tìm thấy dòng nào -> trả về null hợp lệ
      if (error.code !== 'PGRST116') {
        console.error('Supabase Load Error:', error);
      }
      return null;
    }

    return data?.content || null;
  } catch (err) {
    console.error('Cloud Load Exception:', err);
    return null;
  }
};
