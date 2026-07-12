import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

interface FinanceState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTotalIncome: () => number;
  getTotalExpense: () => number;
  getBalance: () => number;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await getSupabase()
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      set({ transactions: data || [] });
    } catch (error: any) {
      console.error('Error fetching transactions:', error.message);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addTransaction: async (transaction) => {
    try {
      const { data, error } = await getSupabase()
        .from('transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ transactions: [data, ...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) }));
    } catch (error: any) {
      console.error('Error adding transaction:', error.message);
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    try {
      const { error } = await getSupabase().from('transactions').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
    } catch (error: any) {
      console.error('Error deleting transaction:', error.message);
      throw error;
    }
  },

  getTotalIncome: () => {
    return get().transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  },

  getTotalExpense: () => {
    return get().transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  },

  getBalance: () => {
    return get().getTotalIncome() - get().getTotalExpense();
  },
}));
