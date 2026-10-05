"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { StudyWord } from "./interactive-study-modal";

export interface WordItem extends StudyWord {
  status: string;
  isFavorite: boolean;
  timesStudied: number;
}

export interface WordSetDetails {
  id: string;
  orderNumber: number;
  title: string;
  description: string | null;
  isPro: boolean;
  course: {
    id: string;
    slug: string;
    title: string;
    icon: string | null;
  };
  totalWords: number;
  learnedWordsCount: number;
  masteredWordsCount: number;
  progressPercent: number;
}

interface VocabWorkspaceContextType {
  setId: string | null;
  setSetId: (id: string) => void;
  loading: boolean;
  error: string | null;
  setDetails: WordSetDetails | null;
  allWords: WordItem[];
  filteredWords: WordItem[];
  userCoins: number;
  isPro: boolean;
  
  // Filters
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  quantityFilter: string;
  setQuantityFilter: (v: string) => void;
  orderFilter: string;
  setOrderFilter: (v: string) => void;
  tableSearch: string;
  setTableSearch: (v: string) => void;

  fetchSetData: () => Promise<void>;
  toggleFavorite: (wordId: string, currentFav: boolean) => Promise<void>;
  setUserCoins: (coins: number) => void;
}

const VocabWorkspaceContext = createContext<VocabWorkspaceContextType | undefined>(undefined);

export function VocabWorkspaceProvider({ 
  children,
  initialSetId = null
}: { 
  children: React.ReactNode;
  initialSetId?: string | null;
}) {
  const [setId, setSetIdState] = useState<string | null>(initialSetId || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setDetails, setSetDetails] = useState<WordSetDetails | null>(null);
  const [allWords, setAllWords] = useState<WordItem[]>([]);
  const [filteredWords, setFilteredWords] = useState<WordItem[]>([]);
  
  const [userCoins, setUserCoins] = useState(150);
  const [isPro, setIsPro] = useState(false);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [quantityFilter, setQuantityFilter] = useState("20");
  const [orderFilter, setOrderFilter] = useState("DEFAULT");
  const [tableSearch, setTableSearch] = useState("");

  const isResolvingDefault = useRef(false);

  // Sync initialSetId if prop changes
  useEffect(() => {
    if (initialSetId && initialSetId !== setId) {
      setSetIdState(initialSetId);
    }
  }, [initialSetId]);

  // Client-side hydration from URL query param or localStorage if setId is not set
  useEffect(() => {
    if (!setId && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSetId = urlParams.get("setId");
      const storedSetId = localStorage.getItem("vocab_current_set_id");
      const targetId = urlSetId || storedSetId;
      if (targetId) {
        setSetIdState(targetId);
      }
    }
  }, [setId]);

  const setSetId = useCallback((id: string) => {
    setSetIdState(id);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("vocab_current_set_id", id);
        const url = new URL(window.location.href);
        url.searchParams.set("setId", id);
        window.history.replaceState(null, "", url.toString());
      } catch (e) {
        // Ignore URL replace errors
      }
    }
  }, []);

  const fetchSetData = useCallback(async () => {
    if (!setId) return;
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        status: statusFilter,
        limit: quantityFilter,
        sort: orderFilter,
      });

      const [res, shopRes] = await Promise.all([
        fetch(`/api/vocab/sets/${setId}?${queryParams.toString()}`, { cache: 'no-store' }),
        fetch("/api/vocab/shop", { cache: 'no-store' }).catch(() => null),
      ]);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải bộ từ");

      setSetDetails(data.wordSet);
      setAllWords(data.allWords || []);
      setFilteredWords(data.filteredWords || []);

      if (shopRes && shopRes.ok) {
        const shopData = await shopRes.json();
        setUserCoins(shopData.userCoins || 100);
        setIsPro(Boolean(shopData.isPro));
      }
    } catch (err: any) {
      console.error("fetchSetData error:", err);
      setError(err.message || "Đã xảy ra lỗi khi tải bài học");
    } finally {
      setLoading(false);
    }
  }, [setId, statusFilter, quantityFilter, orderFilter]);

  // Trigger fetch whenever setId or filters change
  useEffect(() => {
    if (setId) {
      fetchSetData();
    }
  }, [setId, fetchSetData]);

  // If setId is still missing after mount, resolve default from course
  useEffect(() => {
    async function resolveDefaultSet() {
      if (setId || isResolvingDefault.current) return;
      isResolvingDefault.current = true;
      try {
        setLoading(true);
        // Try ielts-vocabulary first
        let res = await fetch("/api/vocab/courses/ielts-vocabulary", { cache: 'no-store' });
        let firstSetId: string | null = null;
        if (res.ok) {
          const data = await res.json();
          firstSetId = data.course?.wordSets?.[0]?.id || null;
        }

        // If not found, list courses and get the first one with wordSets
        if (!firstSetId) {
          const coursesRes = await fetch("/api/vocab/courses", { cache: 'no-store' });
          if (coursesRes.ok) {
            const cData = await coursesRes.json();
            const validCourse = cData.courses?.find((c: any) => c.wordSets?.length > 0) || cData[0];
            firstSetId = validCourse?.wordSets?.[0]?.id || null;
          }
        }

        if (firstSetId) {
          setSetId(firstSetId);
        } else {
          setError("Không tìm thấy bài học nào trong hệ thống");
          setLoading(false);
        }
      } catch (e: any) {
        console.error("resolveDefaultSet error:", e);
        setError("Không thể tải thông tin bài học");
        setLoading(false);
      } finally {
        isResolvingDefault.current = false;
      }
    }

    // Only run if setId is not set
    if (!setId) {
      resolveDefaultSet();
    }
  }, [setId, setSetId]);

  const toggleFavorite = async (wordId: string, currentFav: boolean) => {
    try {
      await fetch(`/api/vocab/words/${wordId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !currentFav }),
      });

      setAllWords((prev) =>
        prev.map((w) => (w.id === wordId ? { ...w, isFavorite: !currentFav } : w))
      );
      setFilteredWords((prev) =>
        prev.map((w) => (w.id === wordId ? { ...w, isFavorite: !currentFav } : w))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <VocabWorkspaceContext.Provider value={{
      setId, setSetId,
      loading, error, setDetails,
      allWords, filteredWords,
      userCoins, setUserCoins, isPro,
      statusFilter, setStatusFilter,
      quantityFilter, setQuantityFilter,
      orderFilter, setOrderFilter,
      tableSearch, setTableSearch,
      fetchSetData, toggleFavorite
    }}>
      {children}
    </VocabWorkspaceContext.Provider>
  );
}

export function useVocabWorkspace() {
  const context = useContext(VocabWorkspaceContext);
  if (context === undefined) {
    throw new Error("useVocabWorkspace must be used within a VocabWorkspaceProvider");
  }
  return context;
}
