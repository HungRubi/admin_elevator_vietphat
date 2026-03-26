# API User (`/user`)

## Middleware theo nhóm route

| Nhóm | Middleware | Ghi chú |
|------|------------|--------|
| **Cập nhật hồ sơ / địa chỉ** | `verifyToken` | **Customer** chỉ được `:id` **trùng** `id` trong JWT; **admin** và **employee** được cập nhật **mọi** user. |
| **Còn lại** (danh sách, filter, xóa, tạo user, đơn, thống kê, `GET /:id`) | `verifyTokenStaff` | Chỉ admin hoặc employee. |

## Rate limit

`RATE_LIMIT_USER_STAFF_PER_MINUTE` (mặc định **120**) áp dụng **mọi** route `/user` (kể cả hai PUT dùng `verifyToken`).

## Shape `user` sau cập nhật (reducer / `GET /auth/me`)

Sau **`PUT /user/update/address/:id`** và **`PUT /user/profile/update/:id`**, field chính là **`user`**:

- Object lean, **không** `password`, **không** `refreshTokenHash`.
- **`format`**: chuỗi ngày sinh qua `importDate` (cùng ý `GET /auth/me`).

**Địa chỉ:** response gồm **`user`** và (tùy chọn tương thích) **`updatedUser`** — **cùng một object** với `user`. Trước đây chỉ có `updatedUser`; front nên merge theo **`user`**.

## `PUT /user/update/address/:id`

- **Quyền:** `verifyToken` + `canEditUserProfile` (customer = self only; admin/employee = any).
- Body: `{ "address": "..." }` (bắt buộc, đã trim).
- **200:** `{ "user", "updatedUser" (=== user), "message" }`.

## `PUT /user/profile/update/:id`

- **Quyền:** như trên.
- Body: `name`, `email`, `phone` (bắt buộc); `birth`, `avatar` (base64, tối đa 2MB) tùy chọn.
- **200:** `{ "user", "message" }` — `user` đã qua `shapeUserForClient`.

## Các API khác (staff)

- **`POST /store`**, **`DELETE /:id`**, **`GET /`**, **`GET /filter`**, **`GET /:id`**, **`GET /order/:id`**, **`GET /new`**: chỉ **staff**; xem các mục trước trong lịch sử chuẩn hóa.

## Lỗi

Thông báo 4xx/5xx dùng `message` chuỗi.
