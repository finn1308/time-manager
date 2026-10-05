"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Coins,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Crown,
  Snowflake,
  Zap,
  Palette,
} from "lucide-react";

interface ShopItemData {
  id: string;
  name: string;
  description: string;
  type: string;
  costCoins: number;
  icon: string | null;
}

export default function VocabShopPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ShopItemData[]>([]);
  const [userCoins, setUserCoins] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const fetchShop = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vocab/shop");
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
        setUserCoins(data.userCoins || 0);
        setIsPro(Boolean(data.isPro));
        setPurchasedIds(data.purchasedItemIds || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  const handleBuyItem = async (itemId: string, cost: number, itemName: string) => {
    if (userCoins < cost) {
      alert(`Bạn không đủ Xu. Cần ${cost} Xu, hiện bạn có ${userCoins} Xu. Hãy luyện từ vựng để nhận thêm Xu nhé!`);
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn mua "${itemName}" với giá ${cost} Xu?`)) {
      return;
    }

    try {
      setBuyingId(itemId);
      const res = await fetch("/api/vocab/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopItemId: itemId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      alert(data.message || "Mua vật phẩm thành công!");
      await fetchShop();
    } catch (err: any) {
      alert(err.message || "Lỗi giao dịch");
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Banner with Balance */}
      <div className="rounded-3xl bg-gradient-to-br from-[#f59e0b] via-[#d97706] to-[#b45309] text-white p-6 sm:p-8 shadow-xl shadow-[#f59e0b]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-amber-100">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cửa hàng Luyện Từ • Reward Store</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Đổi Thưởng & Mở Khóa Gói Học
          </h1>
          <p className="text-xs sm:text-sm text-amber-50 leading-relaxed max-w-lg">
            Sử dụng số Xu bạn tích lũy được từ các bài học Flashcard, Quiz, Listening để mở khóa tính năng cao cấp!
          </p>
        </div>

        {/* User Coins Card */}
        <div className="bg-white/15 backdrop-blur-md p-5 rounded-3xl border border-white/25 text-center shrink-0 min-w-[180px]">
          <span className="text-[11px] uppercase font-bold text-amber-100 block">
            Số Xu hiện có
          </span>
          <div className="flex items-center justify-center space-x-1.5 mt-1">
            <Coins className="w-6 h-6 text-amber-300" />
            <span className="text-3xl font-black">{userCoins}</span>
            <span className="text-sm font-bold text-amber-200">Xu</span>
          </div>
          {isPro && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950 mt-2">
              ★ TÀI KHOẢN PRO
            </span>
          )}
        </div>
      </div>

      {/* Items Grid */}
      <div className="space-y-4">
        <h2 className="font-extrabold text-lg text-gray-900 dark:text-white px-1">
          Vật phẩm có thể đổi
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] space-y-3">
            <RefreshCw className="w-8 h-8 text-[#f59e0b] animate-spin" />
            <p className="text-xs text-gray-400">Đang tải cửa hàng...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => {
              const isBought = purchasedIds.includes(item.id) || (item.type === "PRO_UNLOCK" && isPro);

              return (
                <div
                  key={item.id}
                  className="p-6 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-3xl shrink-0">
                      {item.icon || "🎁"}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 font-extrabold text-base">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>{item.costCoins} Xu</span>
                    </div>

                    {isBought ? (
                      <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã sở hữu</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuyItem(item.id, item.costCoins, item.name)}
                        disabled={buyingId === item.id}
                        className="px-5 py-2.5 rounded-2xl bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 active:scale-95"
                      >
                        {buyingId === item.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Coins className="w-3.5 h-3.5" />
                        )}
                        <span>Đổi ngay</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
