'use client';

import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';
import { Card, Button, Modal, Input } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useFinanceStore, Transaction } from '@/stores/useFinanceStore';
import { createClient } from '@/utils/supabase/client';

export default function FinancePage() {
  const { t } = useTranslation();
  const { transactions, fetchTransactions, addTransaction, deleteTransaction, getBalance, getTotalIncome, getTotalExpense } = useFinanceStore();
  const [userId, setUserId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchTransactions();
    
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, [fetchTransactions]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Kullanıcı bilgisi alınamadı. Lütfen sayfayı yenileyin.");
      return;
    }
    if (!amount || !category) return;
    
    const parsedAmount = Number(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Lütfen geçerli bir miktar girin (ör: 100 veya 100.50)");
      return;
    }
    
    try {
      await addTransaction({
        user_id: userId,
        type,
        amount: parsedAmount,
        category,
        description
      });
      
      setIsModalOpen(false);
      setAmount('');
      setCategory('');
      setDescription('');
    } catch (error: any) {
      alert("İşlem kaydedilirken hata oluştu: " + error.message);
    }
  };

  const balance = getBalance();
  const income = getTotalIncome();
  const expense = getTotalExpense();

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Wallet className="text-green-500" size={32} />
            {t('finance.title')}
          </h1>
          <p className="text-gray-400 mt-2">{t('finance.subtitle')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={16} /> {t('finance.newTransaction')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-900/40 to-black/50 border-green-500/30">
          <h3 className="text-gray-400 text-sm mb-1">{t('finance.totalBalance')}</h3>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ₺{balance.toLocaleString('tr-TR')}
          </p>
        </Card>
        
        <Card className="glass relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={48} className="text-green-500" />
          </div>
          <h3 className="text-gray-400 text-sm mb-1">{t('finance.totalIncome')}</h3>
          <p className="text-2xl font-bold text-green-400">
            ₺{income.toLocaleString('tr-TR')}
          </p>
        </Card>

        <Card className="glass relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={48} className="text-red-500" />
          </div>
          <h3 className="text-gray-400 text-sm mb-1">{t('finance.totalExpense')}</h3>
          <p className="text-2xl font-bold text-red-400">
            ₺{expense.toLocaleString('tr-TR')}
          </p>
        </Card>
      </div>

      {/* Transactions List */}
      <div className="glass rounded-3xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">{t('finance.recentTransactions')}</h2>
        
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {t('finance.noTransactions')}
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-4 rounded-2xl bg-black/40 hover:bg-black/60 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    tx.type === 'income' ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'
                  }`}>
                    {tx.type === 'income' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">{tx.category}</h4>
                    <p className="text-sm text-gray-400">{tx.description || new Date(tx.date).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <span className={`font-bold text-lg ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'} ₺{Number(tx.amount).toLocaleString('tr-TR')}
                  </span>
                  <button 
                    onClick={() => deleteTransaction(tx.id)}
                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('finance.newTransaction')} maxWidth="md">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="flex gap-2 p-1 bg-black/50 rounded-xl border border-white/5 mb-4">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                type === 'income' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('finance.income')}
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                type === 'expense' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('finance.expense')}
            </button>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">{t('finance.amount')} (₺)</label>
            <Input 
              type="number"
              value={amount}
              onChange={(val) => setAmount(val as string)}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">{t('finance.category')}</label>
            <Input 
              value={category}
              onChange={(val) => setCategory(val as string)}
              placeholder="Örn: Market, Maaş, Kira..."
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">{t('finance.description')}</label>
            <Input 
              value={description}
              onChange={(val) => setDescription(val as string)}
              placeholder="İsteğe bağlı açıklama..."
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <Button type="submit" className={type === 'income' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
