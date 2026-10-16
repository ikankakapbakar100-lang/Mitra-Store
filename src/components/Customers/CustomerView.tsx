/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { Customer, CustomerTier } from '../../types/pos';
import { formatRupiah } from '../../utils/format';
import { 
  Users, 
  Search, 
  Plus, 
  MessageCircle, 
  Sparkles, 
  X
} from 'lucide-react';

export const CustomerView: React.FC = () => {
  const { customers, addCustomer, storeProfile } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | CustomerTier>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [tierInput, setTierInput] = useState<CustomerTier>('reguler');
  const [formError, setFormError] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchTier = selectedTierFilter === 'all' || c.tier === selectedTierFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q));
      return matchTier && matchSearch;
    });
  }, [customers, selectedTierFilter, searchQuery]);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!nameInput.trim() || !phoneInput.trim()) {
      setFormError('Nama dan No Telepon wajib diisi.');
      return;
    }

    addCustomer({
      name: nameInput.trim(),
      phone: phoneInput.trim(),
      email: emailInput.trim() || undefined,
      tier: tierInput,
    });

    setNameInput('');
    setPhoneInput('');
    setEmailInput('');
    setTierInput('reguler');
    setFormError('');
    setIsAddModalOpen(false);
  };

  const handleSendWhatsApp = (c: Customer) => {
    const cleanPhone = c.phone.replace(/^0/, '62').replace(/\D/g, '');
    const msg = `Halo Kak ${c.name}, terima kasih telah berkunjung ke ${storeProfile.name}! Saldo poin loyalitas Kakak ada ${c.points} Poin (senilai ${formatRupiah(c.points * 100)}). Yuk gunakan untuk diskon belanja!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTierBadge = (tier: CustomerTier) => {
    switch (tier) {
      case 'platinum':
        return <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-[#BE185D] dark:bg-pink-950/60 dark:text-pink-300">PLATINUM</span>;
      case 'gold':
        return <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">GOLD</span>;
      case 'silver':
        return <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">SILVER</span>;
      default:
        return <span className="font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-pink-50 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">REGULER</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Loyalty Policy Banner in Minimalist Pink & White */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-pink-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/50 text-[#F43F5E] flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Program Poin Loyalitas Pelanggan
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Belanja Rp 10.000 dapat 1 Poin · 1 Poin = potongan Rp 100 langsung di kasir POS.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-pink-100 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau nomor HP..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
          />
        </div>

        {/* Tier filter */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['all', 'platinum', 'gold', 'silver', 'reguler'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTierFilter(tier)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl uppercase transition-colors ${
                selectedTierFilter === tier
                  ? 'bg-[#F43F5E] text-white shadow-xs'
                  : 'bg-pink-50/50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-pink-100/60'
              }`}
            >
              {tier === 'all' ? 'Semua' : tier}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-pink-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-pink-100 dark:border-zinc-800 bg-pink-50/30 dark:bg-zinc-800/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4">No. WhatsApp</th>
                <th className="py-3.5 px-4 text-center">Tier</th>
                <th className="py-3.5 px-4 text-center">Poin</th>
                <th className="py-3.5 px-4 text-right">Potongan Diskon</th>
                <th className="py-3.5 px-4 text-right">Total Belanja</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50 dark:divide-zinc-800 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada pelanggan di filter ini.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-pink-50/20 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-zinc-300">
                      {c.phone}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getTierBadge(c.tier)}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-[#F43F5E]">
                      {c.points}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                      {formatRupiah(c.points * 100)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-zinc-200">
                      {formatRupiah(c.totalSpend)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSendWhatsApp(c)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 ml-auto transition-colors"
                        title="Kirim Info Poin WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Sapa WA</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-pink-100 dark:border-zinc-800 max-w-sm w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Daftar Pelanggan Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-3">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Nama Lengkap:
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Contoh: Budi Pratama"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#F43F5E]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Nomor WhatsApp:
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-[#F43F5E]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Email (Opsional):
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#F43F5E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Tingkat Member:
                </label>
                <select
                  value={tierInput}
                  onChange={(e) => setTierInput(e.target.value as CustomerTier)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white"
                >
                  <option value="reguler">Reguler</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] rounded-xl transition-colors"
                >
                  Simpan Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
