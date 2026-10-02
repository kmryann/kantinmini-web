"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  UserCheck,
  Store,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
} from "lucide-react";

export interface UserItem {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  role: string;
  hasPin?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UsersClientProps {
  initialUsers: UserItem[];
  currentUserId: string;
}

export default function UsersClient({
  initialUsers,
  currentUserId,
}: UsersClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");

  // State Toast
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // State Modal Tambah
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<"ADMIN" | "MANAGER" | "CASHIER">("CASHIER");
  const [addPin, setAddPin] = useState("");
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // State Modal Edit
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<string>("CASHIER");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");
  const [editPin, setEditPin] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // State Modal Hapus
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = selectedRole === "ALL" || u.role === selectedRole;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));
      return matchRole && matchSearch;
    });
  }, [users, selectedRole, searchQuery]);

  // Statistik
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const managerCount = users.filter((u) => u.role === "MANAGER").length;
  const cashierCount = users.filter((u) => u.role === "CASHIER").length;

  const handleOpenAdd = () => {
    setAddName("");
    setAddUsername("");
    setAddEmail("");
    setAddPassword("");
    setAddRole("CASHIER");
    setAddPin("");
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addUsername.trim() || !addPassword) {
      setAddError("Nama, Username, dan Kata Sandi wajib diisi.");
      return;
    }
    if (addPassword.length < 4) {
      setAddError("Kata sandi minimal 4 karakter.");
      return;
    }

    try {
      setIsSubmittingAdd(true);
      setAddError(null);

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName.trim(),
          username: addUsername.trim(),
          email: addEmail.trim() || undefined,
          password: addPassword,
          role: addRole,
          pin: addPin.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setAddError(json.error || "Gagal membuat akun.");
        setIsSubmittingAdd(false);
        return;
      }

      setUsers((prev) => [json.data, ...prev]);
      setIsAddModalOpen(false);
      showToast(json.message || "Akun baru berhasil dibuat!");
      router.refresh();
    } catch {
      setAddError("Terjadi kesalahan koneksi server.");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditUsername(user.username || "");
    setEditEmail(user.email || "");
    setEditRole(user.role);
    setEditIsActive(user.isActive);
    setEditPassword("");
    setEditPin("");
    setEditError(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editName.trim() || !editUsername.trim()) {
      setEditError("Nama dan Username tidak boleh kosong.");
      return;
    }

    try {
      setIsSubmittingEdit(true);
      setEditError(null);

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          username: editUsername.trim(),
          email: editEmail.trim() || null,
          role: editRole,
          isActive: editIsActive,
          password: editPassword.trim() || undefined,
          pin: editPin.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setEditError(json.error || "Gagal memperbarui akun.");
        setIsSubmittingEdit(false);
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...json.data } : u))
      );
      setEditingUser(null);
      showToast(json.message || "Akun berhasil diperbarui!");
      router.refresh();
    } catch {
      setEditError("Terjadi kesalahan koneksi server.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      setIsSubmittingDelete(true);
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || "Gagal menghapus akun.", "error");
        setIsSubmittingDelete(false);
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
      showToast(json.message || "Akun berhasil dihapus!");
      router.refresh();
    } catch {
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
            <Shield className="w-3.5 h-3.5 text-rose-600" />
            <span>Admin</span>
          </span>
        );
      case "MANAGER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Manager</span>
          </span>
        );
      case "CASHIER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kasir</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs md:text-sm font-semibold flex items-center justify-between gap-2 shadow-xs transition-all animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-0.5 rounded-md hover:bg-black/5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3 Metric Cards Ringkasan Pengguna */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface p-4.5 rounded-2xl border border-surface-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block">
              Akun Admin
            </span>
            <span className="text-2xl font-black text-ink tracking-tight mt-1 block">
              {adminCount}
            </span>
            <span className="text-[11px] text-ink-muted">Akses Penuh Bisnis</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface p-4.5 rounded-2xl border border-surface-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block">
              Akun Manager
            </span>
            <span className="text-2xl font-black text-ink tracking-tight mt-1 block">
              {managerCount}
            </span>
            <span className="text-[11px] text-ink-muted">Laporan & Ubah Menu</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface p-4.5 rounded-2xl border border-surface-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block">
              Akun Kasir
            </span>
            <span className="text-2xl font-black text-ink tracking-tight mt-1 block">
              {cashierCount}
            </span>
            <span className="text-[11px] text-ink-muted">POS & Riwayat Kasir</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Header & Search Bar */}
      <div className="bg-surface rounded-2xl p-4 md:p-5 border border-surface-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base md:text-lg font-extrabold text-ink">
              Daftar Pengguna & Hak Akses
            </h2>
            <p className="text-xs text-ink-muted">
              Kelola role staf untuk membatasi akses fitur sesuai tanggung jawab.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-press inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-brand-hover transition-all cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Akun Staf</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama, username, atau email..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-xs md:text-sm bg-white border border-surface-border placeholder:text-ink-muted/50 focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "ALL", label: "Semua" },
              { id: "ADMIN", label: "Admin" },
              { id: "MANAGER", label: "Manager" },
              { id: "CASHIER", label: "Kasir" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedRole(tab.id)}
                className={`btn-press px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedRole === tab.id
                    ? "bg-brand text-white shadow-2xs"
                    : "bg-surface-subtle text-ink-muted hover:text-ink border border-surface-border/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table / List */}
      <div className="bg-surface rounded-2xl border border-surface-border shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-ink-muted mx-auto" />
            <p className="text-sm font-bold text-ink">Tidak ada pengguna ditemukan</p>
            <p className="text-xs text-ink-muted">
              Coba sesuaikan kata kunci pencarian atau filter role.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-subtle/50 text-ink-muted font-bold">
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 hidden md:table-cell">Dibuat Pada</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUserId;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-surface-subtle/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-ink truncate">
                                {user.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand/10 text-brand">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-ink-muted truncate">
                              @{user.username || "tanpa-username"}{" "}
                              {user.email ? `• ${user.email}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getRoleBadge(user.role)}
                      </td>

                      <td className="py-3.5 px-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 hidden md:table-cell text-xs text-ink-muted">
                        {new Date(user.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="btn-press p-2 rounded-lg text-ink-muted hover:text-brand hover:bg-brand-light transition-all cursor-pointer"
                            title="Edit / Reset Password"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingUser(user)}
                            disabled={isCurrent}
                            className={`btn-press p-2 rounded-lg transition-all ${
                              isCurrent
                                ? "text-gray-300 cursor-not-allowed opacity-50"
                                : "text-ink-muted hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            }`}
                            title={isCurrent ? "Tidak dapat menghapus akun sendiri" : "Hapus Akun"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Tambah Akun Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-surface rounded-3xl border border-surface-border shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-ink">Tambah Akun Baru</h3>
                  <p className="text-xs text-ink-muted">Buat akun untuk kasir, manager, atau admin.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs sm:text-sm bg-white focus:outline-hidden focus:border-brand font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink block mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    placeholder="Contoh: kasir2"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs sm:text-sm bg-white focus:outline-hidden focus:border-brand font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink block mb-1">
                    Email <span className="text-ink-muted text-[10px]">(Opsional)</span>
                  </label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="budi@kantin.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs sm:text-sm bg-white focus:outline-hidden focus:border-brand font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink block mb-1">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="Min. 4 karakter"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs sm:text-sm bg-white focus:outline-hidden focus:border-brand font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink block mb-1">
                    PIN Cepat Kasir <span className="text-ink-muted text-[10px]">(4 Digit)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={addPin}
                    onChange={(e) => setAddPin(e.target.value)}
                    placeholder="Contoh: 1234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs sm:text-sm bg-white focus:outline-hidden focus:border-brand font-medium"
                  />
                </div>
              </div>

              {/* Pilihan Role dengan Penjelasan Hak Akses */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink block">
                  Pilih Role Pengguna <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "CASHIER",
                      label: "Kasir",
                      desc: "POS & Riwayat Kasir",
                      icon: Store,
                      color: "emerald",
                    },
                    {
                      id: "MANAGER",
                      label: "Manager",
                      desc: "Laporan & Ubah Menu",
                      icon: UserCheck,
                      color: "blue",
                    },
                    {
                      id: "ADMIN",
                      label: "Admin",
                      desc: "Akses Penuh & Akun",
                      icon: Shield,
                      color: "rose",
                    },
                  ].map((r) => {
                    const isSelected = addRole === r.id;
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setAddRole(r.id as "ADMIN" | "MANAGER" | "CASHIER")}
                        className={`btn-press p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-brand bg-brand-light/30 ring-2 ring-brand/30"
                            : "border-surface-border bg-surface hover:bg-surface-subtle"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-brand" : "text-ink-muted"}`} />
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand" />}
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-ink block">
                            {r.label}
                          </span>
                          <span className="text-[10px] text-ink-muted block mt-0.5 leading-tight">
                            {r.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="btn-press px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-hover transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingAdd ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Buat Akun</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Akun / Reset Password */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-surface rounded-3xl border border-surface-border shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-ink">Edit Akun Pengguna</h3>
                  <p className="text-xs text-ink-muted">Ubah profil atau reset kata sandi staf.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs sm:text-sm bg-white focus:outline-hidden focus:border-brand font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink block mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs sm:text-sm bg-white focus:outline-hidden focus:border-brand font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Opsional"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs sm:text-sm bg-white focus:outline-hidden focus:border-brand font-medium"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Role Akses
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={editingUser.id === currentUserId}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs sm:text-sm bg-white focus:outline-hidden focus:border-brand font-medium disabled:opacity-50"
                >
                  <option value="CASHIER">Kasir (POS & Riwayat Kasir)</option>
                  <option value="MANAGER">Manager (Laporan & Ubah Menu)</option>
                  <option value="ADMIN">Admin (Akses Penuh & Kelola Akun)</option>
                </select>
                {editingUser.id === currentUserId && (
                  <p className="text-[11px] text-ink-muted mt-1">
                    Role akun Anda sendiri tidak dapat diubah di sini.
                  </p>
                )}
              </div>

              {/* Status Aktif Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-surface-border">
                <div>
                  <span className="text-xs font-bold text-ink block">Status Akun Aktif</span>
                  <span className="text-[11px] text-ink-muted block">
                    Jika dinonaktifkan, akun ini tidak dapat login ke sistem.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={editingUser.id === currentUserId}
                  onClick={() => setEditIsActive(!editIsActive)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer disabled:opacity-50 ${
                    editIsActive ? "bg-brand" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                      editIsActive ? "translate-x-5.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Reset Password */}
              <div className="p-3.5 rounded-2xl border border-dashed border-surface-border space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <Lock className="w-3.5 h-3.5 text-brand" />
                  <span>Reset Kata Sandi Baru (Opsional)</span>
                </div>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah sandi"
                  className="w-full px-3.5 py-2 rounded-xl border border-surface-border text-xs sm:text-sm bg-white focus:outline-hidden focus:border-brand font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="btn-press px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-hover transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-surface rounded-3xl border border-surface-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-ink">Hapus Akun Staf?</h3>
              <p className="text-xs text-ink-muted">
                Apakah Anda yakin ingin menghapus akun <b>{deletingUser.name}</b> (@{deletingUser.username})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isSubmittingDelete}
                className="btn-press flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1"
              >
                {isSubmittingDelete ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
