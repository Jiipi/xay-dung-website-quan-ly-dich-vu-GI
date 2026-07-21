/**
 * Domain module: Favorites (Wishlist).
 *
 * Quy tắc nghiệp vụ:
 *  - Mỗi cặp (userId, serviceId) là duy nhất (unique constraint).
 *  - Thêm / xóa là idempotent: nếu đã tồn tại -> không lỗi (addFavorite) hoặc
 *    coi như đã xóa (removeFavorite).
 *  - `toggleFavorite` trả về trạng thái SAU khi toggle.
 *  - Dịch vụ bị xóa sẽ cascade xóa favorite nhờ FK `onDelete: Cascade` ở schema.
 */

import { db } from "@/lib/db";
import type { Favorite, Prisma } from "@prisma/client";
import { NotFoundError } from "@/modules/_shared/errors";

/* ============================================================================
 *  Public service functions
 * ========================================================================== */

/**
 * Thêm dịch vụ vào danh sách yêu thích.
 * Idempotent — nếu đã tồn tại thì bỏ qua.
 *
 * @throws NotFoundError khi service không tồn tại.
 */
export async function addFavorite(
  userId: string,
  serviceId: string
): Promise<void> {
  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { id: true },
  });
  if (!service) {
    throw new NotFoundError("Dịch vụ không tồn tại");
  }

  await db.favorite.upsert({
    where: { userId_serviceId: { userId, serviceId } },
    update: {},
    create: { userId, serviceId },
  });
}

/**
 * Xóa dịch vụ khỏi danh sách yêu thích.
 * Idempotent — nếu chưa có thì không lỗi.
 */
export async function removeFavorite(
  userId: string,
  serviceId: string
): Promise<void> {
  await db.favorite
    .delete({
      where: { userId_serviceId: { userId, serviceId } },
    })
    .catch((err: unknown) => {
      // Prisma P2025: record not found -> bỏ qua (idempotent).
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "P2025"
      ) {
        return;
      }
      throw err;
    });
}

/**
 * Toggle trạng thái yêu thích. Trả về trạng thái SAU khi thực hiện.
 */
export async function toggleFavorite(
  userId: string,
  serviceId: string
): Promise<{ favorited: boolean }> {
  const existing = await db.favorite.findUnique({
    where: { userId_serviceId: { userId, serviceId } },
    select: { id: true },
  });

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }

  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { id: true },
  });
  if (!service) {
    throw new NotFoundError("Dịch vụ không tồn tại");
  }
  await db.favorite.create({ data: { userId, serviceId } });
  return { favorited: true };
}

/**
 * Kiểm tra nhanh user có đang favorite dịch vụ hay không.
 */
export async function isFavorited(
  userId: string,
  serviceId: string
): Promise<boolean> {
  const row = await db.favorite.findUnique({
    where: { userId_serviceId: { userId, serviceId } },
    select: { id: true },
  });
  return row !== null;
}

export interface ListUserFavoritesOpts {
  page?: number;
  pageSize?: number;
}

export interface ListUserFavoritesResult {
  favorites: Array<
    Favorite & {
      service: {
        id: string;
        name: string;
        description: string;
        imageUrl: string | null;
        categoryId: string;
        isActive: boolean;
        priceOptions: Array<{
          id: string;
          name: string;
          price: number;
          originalPrice: number | null;
        }>;
      };
    }
  >;
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Danh sách favorite của user — kèm thông tin dịch vụ + giá.
 */
export async function listUserFavorites(
  userId: string,
  opts: ListUserFavoritesOpts = {}
): Promise<ListUserFavoritesResult> {
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts.pageSize ?? 20)));
  const skip = (page - 1) * pageSize;

  const where: Prisma.FavoriteWhereInput = { userId };

  const [favorites, total] = await db.$transaction([
    db.favorite.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            categoryId: true,
            isActive: true,
            priceOptions: {
              select: {
                id: true,
                name: true,
                price: true,
                originalPrice: true,
              },
              orderBy: { price: "asc" },
            },
          },
        },
      },
    }),
    db.favorite.count({ where }),
  ]);

  return { favorites, total, page, pageSize };
}
