/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { StaffUser } from '../../types/pos';
import { 
  UserCheck, 
  X, 
  ShieldCheck, 
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Pencil,
  Check,
  ArrowRight
} from 'lucide-react';

interface CashierLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CashierLoginModal: React.FC<CashierLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { staffList, currentUser, loginCashier, updateStaffUser } = usePOS();
  
  const [selectedStaffId, setSelectedStaffId] = useState<string>(currentUser?.id || staffList[0]?.id || 'user-kasir-1');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Editing staff state
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editRole, setEditRole] = useState<'kasir' | 'supervisor' | 'admin'>('kasir');

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus input when modal opens or selected staff changes
  useEffect(() => {
    if (isOpen && !editingStaff) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, selectedStaffId, editingStaff]);

  if (!isOpen) return null;

  const selectedStaff = staffList.find(s => s.id === selectedStaffId) || staffList[0];

  const handleSelectStaff = (staff: StaffUser) => {
    setSelectedStaffId(staff.id);
    setPassword('');
    setErrorMsg('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleStartEdit = (staff: StaffUser, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditPassword(staff.pin);
    setEditRole(staff.role);
    setErrorMsg('');
  };

  const handleSaveStaffEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!editName.trim()) {
      setErrorMsg('Nama kasir tidak boleh kosong!');
      return;
    }
    if (!editPassword.trim()) {
      setErrorMsg('Kata sandi tidak boleh kosong!');
      return;
    }

    updateStaffUser(editingStaff.id, {
      name: editName.trim(),
      pin: editPassword.trim(),
      role: editRole,
    });

    setEditingStaff(null);
    setErrorMsg('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Masukkan kata sandi kasir!');
      inputRef.current?.focus();
      return;
    }

    const ok = loginCashier(selectedStaffId, password);
    if (ok) {
      setPassword('');
      setErrorMsg('');
      onSuccess();
    } else {
      // Automatic clear on wrong password, so user can simply re-type without backspacing one by one
      setErrorMsg(`Kata sandi salah! Coba lagi (Default: "${selectedStaff.pin}")`);
      setPassword('');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div 
        className={`bg-white rounded-3xl shadow-2xl border border-pink-100 max-w-md w-full p-5 sm:p-6 transition-all duration-200 ${
          isShaking ? 'animate-bounce' : 'animate-in zoom-in-95'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-pink-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-[#F43F5E] flex items-center justify-center border border-pink-100 shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Pilih Kasir Bertugas
              </h3>
              <p className="text-[11px] text-slate-500">
                Penanggung jawab sesi transaksi POS
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content: Either Edit Mode OR Login Mode */}
        {editingStaff ? (
          /* FORM EDIT DATA KASIR */
          <form onSubmit={handleSaveStaffEdit} className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-[#F43F5E]" />
                Edit Data &amp; Nama Kasir
              </h4>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                Batal
              </button>
            </div>

            <div className="space-y-3 bg-pink-50/40 p-3.5 rounded-2xl border border-pink-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Penjaga Kasir:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: Siti Rahma / Budi"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kata Sandi (Password):
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Ketik kata sandi (angka/huruf)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Bisa menggunakan huruf, angka, atau kombinasi keyboard laptop.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Peran / Jabatan:
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                >
                  <option value="kasir">Kasir</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin / Owner</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Simpan Perubahan
              </button>
            </div>
          </form>
        ) : (
          /* LOGIN KASIR MODE DENGAN KATA SANDI KEYBOARD */
          <div className="space-y-4 pt-3">
            
            {/* Grid Pilihan Kasir */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Pilih Petugas Kasir:
                </label>
                <span className="text-[10px] text-slate-400">
                  Tekan ikon ✏️ untuk edit nama
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-0.5 scrollbar-thin">
                {staffList.map((staff) => {
                  const isSelected = selectedStaffId === staff.id;
                  return (
                    <div
                      key={staff.id}
                      onClick={() => handleSelectStaff(staff)}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
                        isSelected
                          ? 'border-[#F43F5E] bg-pink-50/80 ring-2 ring-[#F43F5E]/20 shadow-2xs'
                          : 'border-pink-100 bg-white hover:border-pink-200 hover:bg-pink-50/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${staff.avatarColor}`}>
                          {staff.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {staff.name}
                          </div>
                          <div className="text-[9px] text-[#F43F5E] font-semibold uppercase">
                            {staff.role}
                          </div>
                        </div>
                      </div>

                      {/* Tombol Edit Nama Kasir */}
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(staff, e)}
                        title={`Edit nama & kata sandi ${staff.name}`}
                        className="p-1 rounded-lg text-slate-400 hover:text-[#F43F5E] hover:bg-pink-100 transition-colors opacity-70 group-hover:opacity-100 shrink-0 ml-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Input Kata Sandi via Keyboard Laptop */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-pink-50/40 border border-pink-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#F43F5E]" />
                    <span>Kata Sandi:</span>
                    <span className="text-[#F43F5E] font-extrabold">{selectedStaff.name}</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (Keyboard laptop siap)
                  </span>
                </div>

                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder={`Masukkan kata sandi...`}
                    className="w-full pl-3.5 pr-20 py-2.5 text-sm rounded-xl border border-pink-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] font-mono tracking-wider shadow-inner"
                    autoComplete="current-password"
                  />

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {password && (
                      <button
                        type="button"
                        onClick={() => {
                          setPassword('');
                          inputRef.current?.focus();
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                        title="Hapus input"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-[#F43F5E] rounded-lg cursor-pointer"
                      title={showPassword ? 'Sembunyikan' : 'Tampilkan sandi'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error message with auto-clear notice */}
                {errorMsg ? (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400">
                    💡 Petunjuk: Ketik langsung di keyboard laptop lalu tekan <kbd className="px-1 py-0.5 bg-white border border-pink-200 rounded text-[9px] font-mono font-bold text-slate-700">Enter</kbd>.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] rounded-xl transition-all shadow-md shadow-pink-500/20 hover:shadow-lg hover:shadow-pink-500/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <span>Masuk ke Mode Kasir POS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
