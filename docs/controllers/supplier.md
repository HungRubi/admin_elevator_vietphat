# API Supplier (`/supplier`)

Toàn bộ route dùng **`verifyTokenStaff`** (CMS nhà cung cấp).

## Rate limit

`RATE_LIMIT_SUPPLIER_STAFF_PER_MINUTE` (mặc định **120**) cho mọi endpoint.

## `listQuery.util`

`page` / `offset`, `limit` (max 100), `sort`, `order`, `timkiem` / `q`.  
Legacy sort: **`supplier=desc` / `supplier=asc`** (cùng quy ước controller khác).

### `GET /`

- Sort: `name` (mặc định), `createdAt`, `updatedAt`, `phone`.
- Tìm theo tên: `timkiem` / `q` (regex đã escape).
- Response: `supplier`, `total`, `totalPages`, `page`, `limit`, `offset`, `searchType`, `currentSort`, `currentOrder`.

**Đã sửa:** trước đây `find()` không `limit` → có thể trả toàn bộ bảng; `totalPage` chia cho 10 nhưng không khớp số bản ghi trả về.

## `POST /add`

Body: `name`, `phone`, `address` (bắt buộc, đã trim); `email` tùy chọn.

## `GET /edit/:id`, `PUT /update/:id`, `DELETE /delete/:id`

- Kiểm tra **ObjectId** hợp lệ.
- Lỗi 500 không còn nối object lỗi vào `message`.

## `DELETE /delete/:id`

- Nếu còn sản phẩm tham chiếu `supplier` → **409**, không xóa.
- Response thành công **chỉ** `{ message }` (không trả lại toàn danh sách như trước — tránh payload lớn).

## `GET /product/:id`

Sản phẩm của nhà cung cấp: phân trang `listQuery`, sort `name`, `createdAt`, `updatedAt`, `price`, `sale`, `minimum`, `slug` (mặc định `createdAt` desc, limit 20). Có `total`, `totalPages`, `page`, `limit`, `offset`.
