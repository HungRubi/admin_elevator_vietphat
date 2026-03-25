# API Category (`/category`) — controller **category**

Prefix mount: `app.use('/category', …)` → ví dụ `GET /category/product/all`.

Dùng chung [`listQuery.util`](../README.md): `page` / `offset`, `limit` (max **100**), `sort`, `order`, `timkiem` / `q`.

## Rate limit (GET công khai)

Các route đọc không cần token (sản phẩm theo danh mục, danh sách danh mục, slug, banner, video): **120 req/phút/IP** (mặc định), env **`RATE_LIMIT_CATEGORY_PUBLIC_PER_MINUTE`**.

## Thay đổi hành vi / breaking (cần chỉnh FE)

1. **`GET /category/product/all`**  
   Trước: mảng JSON gốc. Nay: `{ category, total, totalPage, page, limit, offset }` — danh sách trong `category`.

2. **`GET /category/product/:slug`**  
   Trước: mảng `products`. Nay: `{ category, products, total, totalPage, page, limit, offset }`.

3. **`GET /category/product/get-product/:id`**  
   Thêm meta: `total`, `totalPage`, `page`, `limit`, `offset` (cùng `products`).

4. **Sort `order`**  
   Thống nhất với `listQuery`: `order=desc` = mới nhất trước với `createdAt` (trước đây `discount` và `banner` dùng quy ước ngược nhau).

5. **`DELETE /category/banner/:id`**  
   Trước: `res.redirect`. Nay: JSON `{ message }` và **404** nếu không có bản ghi.

6. **Class cũ** có **hai method `destroyProduct`** — method sau ghi đè; đã gộp một handler xóa danh mục, xóa method trùng (không có API xóa video trong router).

## Product / danh mục

| Route | Quyền | Ghi chú |
|--------|--------|---------|
| `GET /product` | staff | Danh mục, phân trang, tìm `name`. Default `limit=10`. |
| `GET /product/all` | public | `limit` default **100**, sort default `name` asc. |
| `GET /product/get-product/:id` | public | Sản phẩm theo `category`, default `limit=24`. |
| `GET /product/:slug` | public | 404 nếu không có slug. |
| POST/PUT/DELETE/GET edit | staff | CRUD + 404 khi không tìm thấy. |

## Discount

- `GET /discount`, `GET /discount/filter`: phân trang + sort (whitelist: `title`, `createdAt`, `updatedAt`, `start_date`, `end_date`, `value_discount`, `is_active`), default `limit=10`, `createdAt` desc.
- Filter: thêm tìm `timkiem`/`q` trên **title** (filter).

## Banner

- `GET /banner` (public): default sort **name** asc, `limit=10`; response `data` gồm `formatBanner`, `total`, `page`, …
- `GET /banner/filter`: giống pattern filter + phân trang + tìm `name`.

## Video

- `GET /video` (public): giống pattern list + search `name`.
- `GET /video/:slug`: 404 nếu không có video; `limit_sidebar` (default 4, max 20), `limit_videos` cho danh sách video kèm (default 30, max 50).
- `PUT /video/:id`: 404 nếu không khớp id.
- `addCategoryVideo`: sửa lỗi gán `status` khi `const` (dùng `let` + default `public`).

## Sửa lỗi đã rà

- `product`, `getCategoryVideo`: catch dùng đúng biến `error` (trước `err` undefined).
- `editDiscount`: `findById(req.params.id)` thay vì `findById({ _id })`.
- `getDetailVideo`: null an toàn → 404.
- `storeProduct` / cập nhật: lỗi trả **500** thay vì 200 khi thất bại.

## Mutation

Toàn bộ POST/PUT/DELETE category (trừ luồng chỉ customer) dùng **`verifyTokenStaff`** (admin + employee), thống nhất phần CMS đã thỏa thuận với bài viết.
