# API Warranty (`/warranty`)

Toàn bộ route dùng **`verifyTokenStaff`**.

## Rate limit

`RATE_LIMIT_WARRANTY_STAFF_PER_MINUTE` (mặc định **120**).

## `listQuery.util`

`page` / `offset`, `limit` (max 100), `sort`, `order`, `timkiem` / `q`.  
Legacy: **`warranty=asc` / `warranty=desc`**.

Sort phiếu: `code`, `status`, `quantity`, `purchase_date`, `warranty_date`, `createdAt`, `updatedAt`.

## `GET /`

- Phân trang + `total` / `totalPages`; tìm theo **`code`** (regex đã escape).
- Response: `warranties`, `searchWarranty` (khi có tìm), `searchType`, `page`, `limit`, `offset`, `currentSort`, `currentWarranty`.

## `GET /add`

Đơn **Thành công** để tạo phiếu: **một** truy vấn `OrderDetail` theo `order_id $in` (không còn N+1).  
Có `listQuery` (mặc định limit 30): sort `createdAt`, `order_date`, `total_price`. Response thêm `total`, `totalPages`, `page`, `limit`, `offset`.

## `POST /store`

- `products`: mảng **1–50** dòng; mỗi dòng `product_id` (hoặc `_id`), `quantity` ≥ 1.
- `order_code`, `user_id` ObjectId; đơn phải tồn tại và **`status: Thành công`**.
- `status` phiếu: `đang xử lý` | `chấp thuận` | `bị hủy`.
- Lưu phiếu **tuần tự** `await` (không còn `forEach(async)`); thông báo admin **`await Promise.all`**; sau đó trừ tồn kho.

## `PUT /:id`

- Body: một nhóm sản phẩm dạng `products: { product_id | _id, quantity }` cùng các field khác như cũ.
- **Đã sửa:** trước đây biến `warranty` (payload) đè tên → `warranty.code` trong thông báo là `undefined`.
- Kho: cùng `product_id` chỉ điều chỉnh theo chênh lệch số lượng; **đổi** `product_id` → hoàn tồn sản phẩm cũ, trừ sản phẩm mới.

## `DELETE /:id`

- Validate ObjectId; thông báo admin + user chủ phiếu dùng `await` hợp lệ; cộng lại tồn kho.

## `GET /filter`

- `status` chỉ khi khớp enum; khoảng ngày + `timkiem`/`q` theo `code`; phân trang giống `GET /`.
