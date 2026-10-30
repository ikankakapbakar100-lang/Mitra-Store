/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { StaffUser } from '../../types/pos';
import { 
  ShieldCheck, 
  X, 
  KeyRound, 
  Check, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  User,
  Lock,
  Sparkles
} from 'lucide-react';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { staffList, currentUser, isCashierLoggedIn, resetStaffPasswordByAdmin } = usePOS();

  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // STRICT ACCESS CHECK: Only verified Admin (Bos) who is logged in can view or use this feature
  const isAuthorized = Boolean(isCashierLoggedIn && currentUser && currentUser.role === 'admin');

  if (!isOpen || !isAuthorized) return null;

  const handleOpenReset = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setNewName(staff.name);
    setNewPassword('');
    setConfirmPassword('');
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    if (!newPassword.trim()) {
      setErrorMsg('Kata sandi baru tidak boleh kosong.');
      return;
    }

    if (newPassword.trim().length < 3) {
      setErrorMsg('Kata sandi minimal 3 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await resetStaffPasswordByAdmin(selectedStaff.id, newPassword.trim(), newName.trim());
      if (res.success) {
        setSuccessMsg(res.message || `Kata sandi untuk ${selectedStaff.name} berhasil diperbarui.`);
        setTimeout(() => {
          setSelectedStaff(null);
          setSuccessMsg('');
        }, 1800);
      } else {
        setErrorMsg(res.error || 'Gagal mengubah kata sandi pegawai.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#FCE4E8] max-w-lg w-full p-5 sm:p-6 transition-all duration-200 text-black">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#FCE4E8]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#800020] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-black">
                  Manajemen Pegawai
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#800020] text-white font-extrabold uppercase">
                  Khusus Bos
                </span>
              </div>
              <p className="text-[11px] text-stone-600 font-medium">
                Kontrol hak akses dan reset kata sandi tim kasir
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

        {/* Content */}
        {!isAuthorized ? (
          /* JIKA BUKAN BOS / ADMIN: Akses Ditolak */
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-black">Akses Dibatasi</h4>
            <p className="text-xs text-stone-600 max-w-xs mx-auto">
              Fitur Manajemen Pegawai dan reset kata sandi hanya dapat diakses oleh <span className="font-bold text-[#800020]">Bos / Admin Utama</span> yang sah.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-white bg-[#800020] rounded-xl hover:bg-[#660019]"
              >
                Kembali
              </button>
            </div>
          </div>
        ) : selectedStaff ? (
          /* FORM RESET KATA SANDI OLEH BOS */
          <form onSubmit={handleSavePassword} className="space-y-4 pt-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#FCE4E8]">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold ${selectedStaff.avatarColor}`}>
                  {selectedStaff.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-black">
                    Reset Sandi: <span className="text-[#800020]">{selectedStaff.name}</span>
                  </h4>
                  <span className="text-[10px] text-stone-500 uppercase font-bold">
                    Peran: {selectedStaff.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="text-xs text-stone-600 hover:text-black underline cursor-pointer"
              >
                Batal
              </button>
            </div>

            <div className="space-y-3 bg-[#FFF5F7] p-3.5 rounded-2xl border border-[#FCE4E8]">
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Nama Pegawai:
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama pegawai..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#800020]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Kata Sandi Baru (Tanpa Perlu Tahu Sandi Lama):
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ketik kata sandi baru (angka/huruf)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black font-mono focus:outline-none focus:ring-2 focus:ring-[#800020]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-[#800020]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Ulangi Kata Sandi Baru:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black font-mono focus:outline-none focus:ring-2 focus:ring-[#800020]"
                />
              </div>

              <div className="text-[10px] text-stone-500 flex items-center gap-1.5 pt-1">
                <Lock className="w-3 h-3 text-[#800020]" />
                <span>Kata sandi akan otomatis di-hash (SHA-256 + Salt) dan disimpan aman.</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-[#800020] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="flex-1 py-2.5 text-xs font-bold text-black bg-[#FCE8EB] hover:bg-[#F8CCD4] rounded-xl transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isLoading ? 'Menyimpan...' : 'Terapkan Sandi Baru'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* DAFTAR PEGAWAI TOKO */
          <div className="space-y-4 pt-3">
            <div className="p-3 bg-[#FFF5F7] rounded-2xl border border-[#FCE4E8] flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#800020] shrink-0 mt-0.5" />
              <div className="text-xs text-stone-700">
                <span className="font-bold text-black">Sebagai Bos Toko:</span> Anda dapat menetapkan kata sandi baru untuk setiap kasir atau supervisor tanpa perlu mengetahui kata sandi lamanya.
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {staffList.map((staff) => {
                const isCurrent = staff.id === currentUser.id;
                return (
                  <div
                    key={staff.id}
                    className="p-3 rounded-2xl border border-[#FCE4E8] bg-white hover:border-[#F8CCD4] transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${staff.avatarColor}`}>
                        {staff.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-black truncate">{staff.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#800020] text-white font-bold">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500 font-medium">
                          Jabatan: <span className="font-bold uppercase text-[#800020]">{staff.role === 'admin' ? 'Bos / Owner' : staff.role}</span> · Sandi: Terenkripsi (SHA-256)
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenReset(staff)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FCE8EB] hover:bg-[#F8CCD4] text-[#800020] transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                      title={`Reset kata sandi ${staff.name}`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Reset Sandi</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold text-black bg-[#FCE8EB] hover:bg-[#F8CCD4] rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
