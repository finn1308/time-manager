"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Plus,
  BookOpen,
  FolderPlus,
  CheckCircle2,
  Lock,
  Unlock,
  Coins,
  ArrowLeft,
  Sparkles,
  Layers,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface SetItem {
  id: string;
  title: string;
  orderNumber: number;
  isPro: boolean;
  courseTitle: string;
  courseSlug: string;
  wordsCount: number;
}

interface Stats {
  totalCourses: number;
  totalSets: number;
  totalWords: number;
  totalSessions: number;
  totalLearners: number;
}

export default function VocabAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sets, setSets] = useState<SetItem[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; isPro: boolean; coins: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [term, setTerm] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("noun");
  const [meaning, setMeaning] = useState("");
  const [exampleSentence, setExampleSentence] = useState("");
  const [exampleMeaning, setExampleMeaning] = useState("");
  const [explanation, setExplanation] = useState("");
  const [submittingWord, setSubmittingWord] = useState(false);

  // New set states
  const [showAddSetModal, setShowAddSetModal] = useState(false);
  const [newSetTitle, setNewSetTitle] = useState("");
  const [newSetDescription, setNewSetDescription] = useState("");
  const [newSetIsPro, setNewSetIsPro] = useState(false);
  const [submittingSet, setSubmittingSet] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vocab/admin/stats");
      if (!res.ok) throw new Error("Failed to load admin stats");
      const data = await res.json();
      setStats(data.stats);
      setSets(data.sets);
      setCurrentUser(data.currentUser);
      if (data.sets.length > 0 && !selectedSetId) {
        setSelectedSetId(data.sets[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", message: err.message || "Lỗi tải dữ liệu" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleTogglePro = async (setId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/vocab/admin/sets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: setId, isPro: !currentStatus }),
      });
      if (!res.ok) throw new Error("Không thể cập nhật trạng thái");
      setSets((prev) =>
        prev.map((s) => (s.id === setId ? { ...s, isPro: !currentStatus } : s))
      );
      setFeedback({ type: "success", message: "Đã cập nhật trạng thái bộ từ!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetId || !term.trim() || !meaning.trim()) {
      setFeedback({ type: "error", message: "Vui lòng điền từ và nghĩa" });
      return;
    }

    try {
      setSubmittingWord(true);
      const res = await fetch("/api/vocab/admin/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordSetId: selectedSetId,
          term,
          phonetic,
          partOfSpeech,
          meaning,
          exampleSentence,
          exampleMeaning,
          explanation,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Thêm từ thất bại");
      }

      setFeedback({ type: "success", message: `Đã thêm từ "${term}" thành công!` });
      setTerm("");
      setPhonetic("");
      setMeaning("");
      setExampleSentence("");
      setExampleMeaning("");
      setExplanation("");
      setShowAddWordModal(false);
      fetchAdminData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmittingWord(false);
    }
  };

  const handleAddSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetTitle.trim()) {
      setFeedback({ type: "error", message: "Vui lòng nhập tên bộ từ" });
      return;
    }

    try {
      setSubmittingSet(true);
      // Find courseId from the first set or load default
      const courseRes = await fetch("/api/vocab/courses/a1-0-3-0");
      const courseData = await courseRes.json();
      const courseId = courseData.course.id;

      const res = await fetch("/api/vocab/admin/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title: newSetTitle,
          description: newSetDescription,
          isPro: newSetIsPro,
        }),
      });

      if (!res.ok) throw new Error("Thêm bộ từ thất bại");

      setFeedback({ type: "success", message: `Đã tạo bộ từ "${newSetTitle}" thành công!` });
      setNewSetTitle("");
      setNewSetDescription("");
      setShowAddSetModal(false);
      fetchAdminData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmittingSet(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#15251a] p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Quản Trị Hệ Thống LUYENTU
              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                Admin Console
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý kho từ vựng, các bộ từ, trạng thái PRO và dữ liệu học tập
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddWordModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm từ vựng mới</span>
          </button>
          <button
            onClick={() => setShowAddSetModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Thêm bộ từ</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-[#15251a] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center shadow-xs">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Khóa học</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {stats?.totalCourses ?? "-"}
          </p>
        </div>
        <div className="bg-white dark:bg-[#15251a] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center shadow-xs">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Bộ từ</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {stats?.totalSets ?? "-"}
          </p>
        </div>
        <div className="bg-white dark:bg-[#15251a] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center shadow-xs">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tổng từ vựng</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats?.totalWords ?? "-"}
          </p>
        </div>
        <div className="bg-white dark:bg-[#15251a] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center shadow-xs">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Phiên học</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats?.totalSessions ?? "-"}
          </p>
        </div>
        <div className="bg-white dark:bg-[#15251a] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Học viên</p>
          <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
            {stats?.totalLearners ?? "-"}
          </p>
        </div>
      </div>

      {/* Sets List & Actions */}
      <div className="bg-white dark:bg-[#15251a] rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Danh Sách Bộ Từ & Trạng Thái PRO
          </h2>
          <span className="text-xs text-slate-400">{sets.length} bộ từ vựng</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 px-2">STT</th>
                <th className="pb-3 px-2">Tên bộ từ</th>
                <th className="pb-3 px-2">Khóa học</th>
                <th className="pb-3 px-2">Số từ</th>
                <th className="pb-3 px-2">Chế độ</th>
                <th className="pb-3 px-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {sets.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-2 font-bold text-slate-500">#{s.orderNumber}</td>
                  <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-100">{s.title}</td>
                  <td className="py-3 px-2 text-slate-500">{s.courseTitle}</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                      {s.wordsCount} từ
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {s.isPro ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                        <Lock className="w-2.5 h-2.5" />
                        <span>PRO</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                        <Unlock className="w-2.5 h-2.5" />
                        <span>Miễn phí</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right space-x-2">
                    <button
                      onClick={() => handleTogglePro(s.id, s.isPro)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {s.isPro ? "Chuyển Miễn phí" : "Đặt PRO"}
                    </button>
                    <Link
                      href={`/vocab/sets/${s.id}`}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                    >
                      Xem bộ từ
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Word */}
      {showAddWordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#15251a] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Thêm Từ Vựng Mới
              </h3>
              <button
                onClick={() => setShowAddWordModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWord} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Thuộc bộ từ
                </label>
                <select
                  value={selectedSetId}
                  onChange={(e) => setSelectedSetId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2f21] text-slate-800 dark:text-slate-100"
                >
                  {sets.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.orderNumber}. {s.title} ({s.courseTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Từ tiếng Anh (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Good morning"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2f21] text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phiên âm IPA
                  </label>
                  <input
                    type="text"
                    placeholder="VD: /ɡʊd ˈmɔːrnɪŋ/"
                    value={phonetic}
                    onChange={(e) => setPhonetic(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2f21] text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Từ loại
                  </label>
                  <select
                    value={partOfSpeech}
                    onChange={(e) => setPartOfSpeech(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2f21] text-slate-800 dark:text-slate-100"
                  >
                    <option value="phrase">Cụm từ / Câu chào</option>
                    <option value="noun">Danh từ (n)</option>
                    <option value="verb">Động từ (v)</option>
                    <option value="adj">Tính từ (adj)</option>
                    <option value="adv">Trạng từ (adv)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nghĩa tiếng Việt (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Chào buổi sáng"
                    value={meaning}
                    onChange={(e) => setMeaning(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2f21] text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Câu ví dụ tiếng Anh
                </label>
                <input
                  type="text"
                  placeholder="VD: Good morning, how are you today?"
                  value={exampleSentence}
                  onChange={(e) => setExampleSentence(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2f21] text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dịch nghĩa câu ví dụ
                </label>
                <input
                  type="text"
                  placeholder="VD: Chào buổi sáng, hôm nay bạn thế nào?"
                  value={exampleMeaning}
                  onChange={(e) => setExampleMeaning(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2f21] text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú / Mẹo ghi nhớ
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Dùng để chào người đối diện từ lúc thức dậy tới 12h trưa"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2f21] text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingWord}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50"
                >
                  {submittingWord ? "Đang lưu..." : "Lưu vào database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Set */}
      {showAddSetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#15251a] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                Tạo Bộ Từ Mới
              </h3>
              <button
                onClick={() => setShowAddSetModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSet} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên bộ từ (*)
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Gia đình & Họ hàng"
                  value={newSetTitle}
                  onChange={(e) => setNewSetTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2f21] text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả
                </label>
                <input
                  type="text"
                  placeholder="VD: Các từ vựng gọi tên thành viên trong gia đình"
                  value={newSetDescription}
                  onChange={(e) => setNewSetDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2f21] text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="proCheck"
                  checked={newSetIsPro}
                  onChange={(e) => setNewSetIsPro(e.target.checked)}
                  className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="proCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Đặt làm bộ từ PRO (Cần xu hoặc gói PRO để mở)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSetModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingSet}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
                >
                  {submittingSet ? "Đang tạo..." : "Tạo bộ từ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
