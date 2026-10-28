/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { formatRupiah } from '../../utils/format';
import { 
  Users, 
  Plus, 
  X, 
  Edit2, 
  Check, 
  ShoppingCart,
  Clock
} from 'lucide-react';

interface MultiCartBarProps {
  compact?: boolean;
}

export const MultiCartBar: React.FC<MultiCartBarProps> = ({ compact = false }) => {
  const {
    cartSessions,
    activeCartSessionId,
    setActiveCartSessionId,
    createNewCartSession,
    deleteCartSession,
    renameCartSession,
  } = usePOS();

  const [editingCartId, setEditingCartId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleStartRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCartId(id);
    setEditingName(currentName);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (editingName.trim()) {
      renameCartSession(id, editingName.trim());
    }
    setEditingCartId(null);
    setEditingName('');
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCartId(null);
    setEditingName('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCartSession(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className={`w-full rounded-2xl border border-[#FCE4E8] bg-white p-2 sm:p-2.5 shadow-2xs ${compact ? 'mb-2' : 'mb-3'}`}>
      
      {/* Bar Header: Info Antrean Pelanggan & Tombol + Pelanggan Baru */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#FCE4E8]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#FCE8EB] text-[#800020] flex items-center justify-center shrink-0">
            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <div>
            <span className="text-xs sm:text-xs font-black text-black">
              Antrean Pelanggan
            </span>
          </div>
        </div>

        {/* Tombol Buat Keranjang Baru untuk Pelanggan Berikutnya */}
        <button
          type="button"
          onClick={() => createNewCartSession()}
          className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-[11px] sm:text-xs transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 shrink-0"
          title="Buka keranjang baru untuk melayani pelanggan lain yang datang bersamaan"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Pelanggan Baru</span>
        </button>
      </div>

      {/* Daftar Tab Keranjang Tiap Pelanggan (Bisa Digeser Horizontal di HP) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {cartSessions.map((session, index) => {
          const isActive = session.id === activeCartSessionId;
          const sessionItemCount = session.items.reduce((sum, item) => sum + item.qty, 0);
          const sessionTotal = session.items.reduce((sum, item) => sum + (item.product.sellPrice * item.qty), 0);
          const isEditing = editingCartId === session.id;
          const isDeleting = confirmDeleteId === session.id;

          if (isEditing) {
            return (
              <div
                key={session.id}
                className="flex items-center gap-1 bg-[#FFF5F7] p-1 rounded-xl border border-[#800020] shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(session.id);
                    if (e.key === 'Escape') setEditingCartId(null);
                  }}
                  autoFocus
                  className="px-2 py-0.5 text-xs font-bold text-black bg-white rounded-lg border border-[#FCE4E8] w-28 sm:w-36 focus:outline-none focus:ring-1 focus:ring-[#800020]"
                  placeholder="Nama Pelanggan..."
                />
                <button
                  type="button"
                  onClick={(e) => handleSaveRename(session.id, e)}
                  className="p-1 rounded-lg bg-[#800020] text-white hover:bg-[#660019] cursor-pointer"
                  title="Simpan Nama"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelRename}
                  className="p-1 rounded-lg text-stone-500 hover:text-black cursor-pointer"
                  title="Batal"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          }

          if (isDeleting) {
            return (
              <div
                key={session.id}
                className="flex items-center gap-1.5 bg-rose-50 p-1.5 rounded-xl border border-rose-300 text-xs shrink-0 animate-in fade-in duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[11px] font-bold text-rose-900">
                  Hapus {session.name}?
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDelete(session.id, e)}
                  className="px-2 py-0.5 text-[10px] font-bold bg-[#800020] text-white rounded-lg hover:bg-[#660019] cursor-pointer"
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(null);
                  }}
                  className="px-1.5 py-0.5 text-[10px] text-stone-600 hover:text-black cursor-pointer"
                >
                  Batal
                </button>
              </div>
            );
          }

          return (
            <div
              key={session.id}
              className={`flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-xl border transition-all shrink-0 select-none ${
                isActive
                  ? 'bg-[#800020] text-white border-[#800020] shadow-sm ring-2 ring-[#800020]/20'
                  : 'bg-[#FFF8F8] text-black border-[#FCE4E8] hover:border-[#800020]/50 hover:bg-[#FFF2F4]'
              }`}
            >
              {/* Clickable Area for Selecting the Cart Session */}
              <button
                type="button"
                onClick={() => setActiveCartSessionId(session.id)}
                className="flex items-center gap-2 text-left cursor-pointer focus:outline-none"
              >
                {/* Ikon Keranjang dengan Angka */}
                <div className="relative shrink-0">
                  <ShoppingCart className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#800020]'}`} />
                  {sessionItemCount > 0 && (
                    <span className={`absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full text-[8px] font-black flex items-center justify-center ${
                      isActive ? 'bg-white text-[#800020]' : 'bg-[#800020] text-white'
                    }`}>
                      {sessionItemCount}
                    </span>
                  )}
                </div>

                {/* Info Pelanggan & Subtotal */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black truncate max-w-[95px] sm:max-w-[125px]">
                      {session.name}
                    </span>
                    {isActive && (
                      <span className="text-[9px] uppercase font-bold px-1 py-0.2 rounded bg-white/20 text-white">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] font-mono font-bold leading-tight ${isActive ? 'text-pink-100' : 'text-[#800020]'}`}>
                    {sessionItemCount > 0 ? formatRupiah(sessionTotal) : 'Kosong'}
                  </div>
                </div>
              </button>

              {/* Action Buttons: Rename & Delete */}
              <div className="flex items-center gap-0.5 ml-1 opacity-85 hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => handleStartRename(session.id, session.name, e)}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? 'text-pink-200 hover:text-white hover:bg-white/10'
                      : 'text-stone-400 hover:text-black hover:bg-stone-100'
                  }`}
                  title="Ubah nama pelanggan/antrean"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>

                {cartSessions.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (sessionItemCount > 0) {
                        setConfirmDeleteId(session.id);
                      } else {
                        deleteCartSession(session.id);
                      }
                    }}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'text-pink-200 hover:text-white hover:bg-white/10'
                        : 'text-stone-400 hover:text-rose-600 hover:bg-stone-100'
                    }`}
                    title="Hapus antrean keranjang ini"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
