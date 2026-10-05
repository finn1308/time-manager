import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  try {
    const items = await prisma.shopItem.findMany({
      where: { isAvailable: true },
      orderBy: { costCoins: "asc" },
    });

    let userCoins = 0;
    let isPro = false;
    let purchasedItemIds: string[] = [];

    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          coins: true,
          isPro: true,
          userPurchases: { select: { shopItemId: true } },
        },
      });

      userCoins = dbUser?.coins || 0;
      isPro = Boolean(dbUser?.isPro);
      purchasedItemIds = dbUser?.userPurchases.map((p) => p.shopItemId) || [];
    }

    return NextResponse.json({
      success: true,
      items,
      userCoins,
      isPro,
      purchasedItemIds,
    });
  } catch (error: any) {
    console.error("GET /api/vocab/shop error:", error);
    return NextResponse.json(
      { error: "Lỗi tải cửa hàng: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { shopItemId } = await req.json();

    if (!shopItemId) {
      return NextResponse.json({ error: "Thiếu ID vật phẩm" }, { status: 400 });
    }

    const item = await prisma.shopItem.findUnique({
      where: { id: shopItemId },
    });

    if (!item) {
      return NextResponse.json({ error: "Vật phẩm không tồn tại" }, { status: 404 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { coins: true, isPro: true },
    });

    if ((dbUser?.coins || 0) < item.costCoins) {
      return NextResponse.json(
        {
          error: `Bạn không đủ Xu. Cần ${item.costCoins} Xu, hiện bạn có ${dbUser?.coins || 0} Xu. Hãy học từ vựng để nhận thêm Xu nhé!`,
        },
        { status: 400 }
      );
    }

    // Deduct coins and record purchase
    await prisma.user.update({
      where: { id: user.id },
      data: {
        coins: { decrement: item.costCoins },
        ...(item.type === "PRO_UNLOCK" && { isPro: true }),
      },
    });

    const purchase = await prisma.userPurchase.create({
      data: {
        userId: user.id,
        shopItemId: item.id,
        costPaid: item.costCoins,
      },
    });

    const newBalance = (dbUser?.coins || 0) - item.costCoins;

    return NextResponse.json({
      success: true,
      message: `Mua "${item.name}" thành công!`,
      purchase,
      remainingCoins: newBalance,
      isPro: item.type === "PRO_UNLOCK" ? true : dbUser?.isPro,
    });
  } catch (error: any) {
    console.error("POST /api/vocab/shop error:", error);
    return NextResponse.json(
      { error: "Lỗi mua vật phẩm: " + error.message },
      { status: 500 }
    );
  }
}
