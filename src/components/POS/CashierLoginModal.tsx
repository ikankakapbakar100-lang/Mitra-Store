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
  Info,
  KeyRound,
  Eye,
  EyeOff,
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
  const { staffList, currentUser, loginCashier } = usePOS();
  
  const [selectedStaffId, setSelectedStaffId] = useState<string>(currentUser?.id || staffList[0]?.id || 'user-kasir-1');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus input when modal opens or selected staff changes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, selectedStaffId]);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Masukkan kata sandi pegawai.');
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const ok = await loginCashier(selectedStaffId, password);
      if (ok) {
        setPassword('');
        setErrorMsg('');
        onSuccess();
      } else {
        setErrorMsg('Kata sandi salah. Silakan coba lagi atau hubungi Pemilik Toko untuk reset kata sandi.');
        setPassword('');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    } finally {
      setIsSubmitting(false);
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

        {/* Modal Content: LOGIN KASIR MODE (Tanpa Ikon Pensil & Tanpa Fitur Edit Sandi) */}
        <div className="space-y-4 pt-3">
          
          {/* Grid Pilihan Kasir */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-black">
              Pilih Identitas Pegawai:
            </label>

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
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${staff.avatarColor}`}>
                        {staff.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-black truncate">
                          {staff.name}
                        </div>
                        <div className="text-[9px] text-[#800020] font-extrabold uppercase tracking-wide">
                          {staff.role === 'admin' ? 'Bos / Owner' : staff.role}
                        </div>
                      </div>
                    </div>
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
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-3.5 pr-20 py-2.5 text-sm rounded-xl border border-[#FCE4E8] bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#800020] font-mono tracking-wider shadow-inner"
                  autoComplete="current-password"
                  disabled={isSubmitting}
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

              {/* Error message with clean text (no leaked password) */}
              {errorMsg ? (
                <div className="flex items-center gap-1.5 text-xs text-[#800020] font-bold">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              ) : (
                <div className="text-[10px] text-stone-600 font-medium">
                  💡 Ketik kata sandi lalu tekan <kbd className="px-1 py-0.5 bg-white border border-[#FCE4E8] rounded text-[9px] font-mono font-bold text-black">Enter</kbd>.
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
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] rounded-xl transition-all shadow-md shadow-rose-950/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk ke Mode Kasir POS'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
