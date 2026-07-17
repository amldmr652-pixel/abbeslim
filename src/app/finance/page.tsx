'use client';

import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2, Edit, AlertCircle, X } from 'lucide-react';
import { Card, Button, Modal, Input } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useFinanceStore, Transaction } from '@/stores/useFinanceStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { createClient } from '@/utils/supabase/client';

export default function FinancePage() {
  const { t, language } = useTranslation();
  const settings = useSettingsStore();
  const { 
    transactions, fetchTransactions, addTransaction, deleteTransaction, updateTransaction,
    getBalance, getTotalIncome, getTotalExpense 
  } = useFinanceStore();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const locale = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'tr-TR';

  // Filtreler
  const [dateFilter, setDateFilter] = useState<'thisMonth' | 'last3Months' | 'all'>('all');

  // Ekleme modali states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Düzenleme modali states
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchTransactions();
      }
      setLoadingUser(false);
    };
    getUser();
  }, [fetchTransactions]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Kullanıcı bilgisi alınamadı. Lütfen giriş yapın.");
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
        description: description.trim(),
        date: new Date(date).toISOString()
      });
      
      setIsAddModalOpen(false);
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error: any) {
      alert("İşlem kaydedilirken hata oluştu: " + error.message);
    }
  };

  const openEditModal = (tx: Transaction) => {
    setSelectedTx(tx);
    setEditType(tx.type);
    setEditAmount(String(tx.amount));
    setEditCategory(tx.category);
    setEditDescription(tx.description || '');
    const d = new Date(tx.date || tx.created_at);
    setEditDate(d.toISOString().split('T')[0]);
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !editAmount || !editCategory) return;

    const parsedAmount = Number(editAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Lütfen geçerli bir miktar girin.");
      return;
    }

    try {
      await updateTransaction(selectedTx.id, {
        type: editType,
        amount: parsedAmount,
        category: editCategory,
        description: editDescription.trim(),
        date: new Date(editDate).toISOString()
      });

      setIsEditModalOpen(false);
      setSelectedTx(null);
    } catch (error: any) {
      alert("İşlem güncellenirken hata oluştu: " + error.message);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteTransaction(id);
    } catch (error: any) {
      alert("İşlem silinirken hata oluştu.");
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (dateFilter === 'all') return true;
    const txDate = new Date(tx.date || tx.created_at);
    const now = new Date();
    
    if (dateFilter === 'thisMonth') {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'last3Months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return txDate >= threeMonthsAgo;
    }
    return true;
  });

  const balance = getBalance();
  const income = getTotalIncome();
  const expense = getTotalExpense();
  const currency = settings.financeCurrency || '₺';

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-white">
        <Loader2 size={32} className="animate-spin text-green-500" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('common.loginRequired') || 'Giriş Gerekli'}</h2>
        <p className="text-gray-400">Finans verilerinizi görmek için lütfen giriş yapın.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Wallet className="text-green-500" size={32} />
            {t('finance.title') || 'Finans Takibi'}
          </h1>
          <p className="text-gray-400 mt-2">{t('finance.subtitle') || 'Gelir ve giderlerinizi yönetin'}</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus size={16} /> {t('finance.newTransaction') || 'Yeni İşlem'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-900/30 to-black/50 border-green-500/20">
          <h3 className="text-gray-400 text-sm mb-1">{t('finance.totalBalance') || 'Toplam Bakiye'}</h3>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {currency}{balance.toLocaleString('tr-TR')}
          </p>
        </Card>
        
        <Card className="glass relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={48} className="text-green-500" />
          </div>
          <h3 className="text-gray-400 text-sm mb-1">{t('finance.totalIncome') || 'Toplam Gelir'}</h3>
          <p className="text-2xl font-bold text-green-400">
            {currency}{income.toLocaleString('tr-TR')}
          </p>
        </Card>

        <Card className="glass relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={48} className="text-red-500" />
          </div>
          <h3 className="text-gray-400 text-sm mb-1">{t('finance.totalExpense') || 'Toplam Gider'}</h3>
          <p className="text-2xl font-bold text-red-400">
            {currency}{expense.toLocaleString('tr-TR')}
          </p>
        </Card>
      </div>

      {/* Date Filters & Transactions List */}
      <div className="glass rounded-3xl p-6 border border-green-900/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-white">{t('finance.recentTransactions') || 'Son İşlemler'}</h2>
          
          {/* Filters toggle */}
          <div className="flex border border-white/5 rounded-full p-1 bg-black/30">
            <button
              onClick={() => setDateFilter('thisMonth')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                dateFilter === 'thisMonth' ? 'bg-green-500 text-stone-950 shadow-sm font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Bu Ay
            </button>
            <button
              onClick={() => setDateFilter('last3Months')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                dateFilter === 'last3Months' ? 'bg-green-500 text-stone-950 shadow-sm font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Son 3 Ay
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                dateFilter === 'all' ? 'bg-green-500 text-stone-950 shadow-sm font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Tümü
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {t('finance.noTransactions') || 'Sonuç bulunamadı.'}
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-3 px-4 rounded-2xl bg-stone-900/40 border border-white/[0.02] hover:bg-stone-900/80 transition-colors group">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'income' ? 'bg-green-950/20 text-green-400 border border-green-500/10' : 'bg-red-950/20 text-red-400 border border-red-500/10'
                  }`}>
                    {tx.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-white text-sm truncate">{tx.category}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                      {tx.description ? `${tx.description} • ` : ''}
                      {new Date(tx.date || tx.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3.5 ml-4 flex-shrink-0">
                  <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'} {currency}{Number(tx.amount).toLocaleString('tr-TR')}
                  </span>
                  
                  {/* Edit & Delete Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(tx)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="Düzenle"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('finance.newTransaction') || 'Yeni İşlem'} maxWidth="md">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="flex gap-2 p-1 bg-black/50 rounded-xl border border-white/5 mb-4">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                type === 'income' ? 'bg-green-500 text-stone-950 shadow-md font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('finance.income') || 'Gelir'}
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                type === 'expense' ? 'bg-red-500 text-stone-950 shadow-md font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('finance.expense') || 'Gider'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('finance.amount') || 'Miktar'} ({currency})</label>
              <Input 
                type="text"
                value={amount}
                onChange={setAmount}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Tarih</label>
              <Input 
                type="date"
                value={date}
                onChange={setDate}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('finance.category') || 'Kategori'}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:border-green-500 outline-none w-full text-sm"
              required
            >
              <option value="">Kategori Seçin</option>
              {settings.financeCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('finance.description') || 'Açıklama'}</label>
            <Input 
              value={description}
              onChange={setDescription}
              placeholder="İsteğe bağlı açıklama..."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-green-900/30">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              {t('common.cancel') || 'İptal'}
            </Button>
            <Button type="submit" className={type === 'income' ? 'bg-green-500 text-stone-950 font-bold hover:bg-green-400' : 'bg-red-500 text-stone-950 font-bold hover:bg-red-400'}>
              {t('common.save') || 'Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedTx(null); }} title="İşlemi Düzenle" maxWidth="md">
        <form onSubmit={handleUpdateTransaction} className="space-y-4">
          <div className="flex gap-2 p-1 bg-black/50 rounded-xl border border-white/5 mb-4">
            <button
              type="button"
              onClick={() => setEditType('income')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                editType === 'income' ? 'bg-green-500 text-stone-950 shadow-md font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('finance.income') || 'Gelir'}
            </button>
            <button
              type="button"
              onClick={() => setEditType('expense')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                editType === 'expense' ? 'bg-red-500 text-stone-950 shadow-md font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('finance.expense') || 'Gider'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('finance.amount') || 'Miktar'} ({currency})</label>
              <Input 
                type="text"
                value={editAmount}
                onChange={setEditAmount}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Tarih</label>
              <Input 
                type="date"
                value={editDate}
                onChange={setEditDate}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('finance.category') || 'Kategori'}</label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:border-green-500 outline-none w-full text-sm"
              required
            >
              <option value="">Kategori Seçin</option>
              {settings.financeCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('finance.description') || 'Açıklama'}</label>
            <Input 
              value={editDescription}
              onChange={setEditDescription}
              placeholder="İsteğe bağlı açıklama..."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-green-900/30">
            <Button variant="ghost" type="button" onClick={() => { setIsEditModalOpen(false); setSelectedTx(null); }}>
              {t('common.cancel') || 'İptal'}
            </Button>
            <Button type="submit" className={editType === 'income' ? 'bg-green-500 text-stone-950 font-bold hover:bg-green-400' : 'bg-red-500 text-stone-950 font-bold hover:bg-red-400'}>
              Güncelle
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

// Simple loader helper
function Loader2({ size = 24, className = '' }) {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      style={{ width: size, height: size }}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
