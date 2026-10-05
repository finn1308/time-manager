"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
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
  const [setId, setSetIdState] = useState<string | null>(initialSetId);
  const [loading, setLoading] = useState(false);
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

  const setSetId = useCallback((id: string) => {
    setSetIdState(id);
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

      // Avoid aggressive Next.js fetch caching by adding a cache-busting param or setting cache: 'no-store'
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
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }, [setId, statusFilter, quantityFilter, orderFilter]);

  useEffect(() => {
    if (setId) {
      fetchSetData();
    }
  }, [setId, fetchSetData]);

  // If setId is missing, resolve the first set of A1
  useEffect(() => {
    async function resolveDefaultSet() {
      if (!setId) {
        try {
          const res = await fetch("/api/vocab/courses/a1-0-3-0", { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            const firstSet = data.course?.wordSets?.[0];
            if (firstSet) {
              setSetIdState(firstSet.id);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    resolveDefaultSet();
  }, [setId]);

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
