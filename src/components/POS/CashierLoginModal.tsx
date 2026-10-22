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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className={`bg-white rounded-3xl shadow-2xl border border-[#FCE4E8] max-w-md w-full p-5 sm:p-6 transition-all duration-200 text-black ${
          isShaking ? 'animate-bounce' : 'animate-in zoom-in-95'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#FCE4E8]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FCE8EB] text-[#800020] flex items-center justify-center border border-[#F8CCD4] shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-black">
                Pilih Kasir Bertugas
              </h3>
              <p className="text-[11px] text-stone-600 font-medium">
                Penanggung jawab sesi transaksi POS
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-stone-500 hover:text-black hover:bg-[#FCE8EB] transition-colors cursor-pointer"
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
              <h4 className="text-xs font-bold text-black flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-[#800020]" />
                Edit Data &amp; Nama Kasir
              </h4>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-[11px] text-stone-600 hover:text-black underline cursor-pointer font-medium"
              >
                Batal
              </button>
            </div>

            <div className="space-y-3 bg-[#FFF5F7] p-3.5 rounded-2xl border border-[#FCE4E8]">
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Nama Penjaga Kasir:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: Siti Rahma / Budi"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#800020]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Kata Sandi (Password):
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Ketik kata sandi (angka/huruf)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FCE4E8] bg-white font-mono text-black focus:outline-none focus:ring-2 focus:ring-[#800020]"
                />
                <span className="text-[10px] text-stone-600 mt-0.5 block font-medium">
                  Bisa menggunakan huruf, angka, atau kombinasi keyboard laptop.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Peran / Jabatan:
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#800020]"
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
                className="flex-1 py-2 text-xs font-bold text-black bg-[#FCE8EB] hover:bg-[#F8CCD4] rounded-xl transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
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
                <label className="text-xs font-bold text-black">
                  Pilih Petugas Kasir:
                </label>
                <span className="text-[10px] text-stone-600 font-medium">
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
                          ? 'border-[#800020] bg-[#FCE8EB] ring-2 ring-[#800020]/20 shadow-2xs'
                          : 'border-[#FCE4E8] bg-white hover:border-[#F8CCD4] hover:bg-[#FFF5F7]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${staff.avatarColor}`}>
                          {staff.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-black truncate">
                            {staff.name}
                          </div>
                          <div className="text-[9px] text-[#800020] font-extrabold uppercase">
                            {staff.role}
                          </div>
                        </div>
                      </div>

                      {/* Tombol Edit Nama Kasir */}
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(staff, e)}
                        title={`Edit nama & kata sandi ${staff.name}`}
                        className="p-1 rounded-lg text-stone-400 hover:text-[#800020] hover:bg-[#FCE8EB] transition-colors opacity-70 group-hover:opacity-100 shrink-0 ml-1 cursor-pointer"
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
              <div className="p-3.5 rounded-2xl bg-[#FFF5F7] border border-[#FCE4E8] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-black flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#800020]" />
                    <span>Kata Sandi:</span>
                    <span className="text-[#800020] font-black">{selectedStaff.name}</span>
                  </label>
                  <span className="text-[10px] text-stone-600 font-mono font-medium">
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
                    className="w-full pl-3.5 pr-20 py-2.5 text-sm rounded-xl border border-[#FCE4E8] bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#800020] font-mono tracking-wider shadow-inner"
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
                        className="p-1 text-stone-400 hover:text-black rounded-lg cursor-pointer"
                        title="Hapus input"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-stone-400 hover:text-[#800020] rounded-lg cursor-pointer"
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
                  <div className="flex items-center gap-1.5 text-xs text-[#800020] font-bold animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-stone-600 font-medium">
                    💡 Petunjuk: Ketik langsung di keyboard laptop lalu tekan <kbd className="px-1 py-0.5 bg-white border border-[#FCE4E8] rounded text-[9px] font-mono font-bold text-black">Enter</kbd>.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold text-black bg-[#FCE8EB] hover:bg-[#F8CCD4] rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] rounded-xl transition-all shadow-md shadow-rose-950/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
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
