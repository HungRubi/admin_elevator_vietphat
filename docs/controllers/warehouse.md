# API Warehouse (`/warehouse`)

Toàn bộ route dùng **`verifyTokenStaff`**.

## Rate limit

`RATE_LIMIT_WAREHOUSE_STAFF_PER_MINUTE` (mặc định **120**).

## `listQuery.util`

`page` / `offset`, `limit` (max 100), `sort`, `order`, `timkiem` / `q`.  
Legacy: **`warehouse=asc` / `warehouse=desc`**.

Sort: `stock`, `minimum`, `maximum`, `location`, `status`, `createdAt`, `updatedAt` (mặc định `updatedAt` desc).

## `GET /`

- Phân trang + đếm đúng `total` / `totalPages`.
- Tìm kiếm: **vị trí** (`location`) hoặc sản phẩm khớp **tên SP** / **tên danh mục** (resolve qua `productId`).  
  **Đã sửa:** trước đây `populate.match` dùng regex trên `category` (ObjectId) → không hợp lệ.
- Response: `warehouses`, `searchWarehouse` (khi có tìm — tương thích gọi cũ), `searchType`, `total`, `totalPages`, `page`, `limit`, `offset`, `currentSort`, `currentWarehouse`.

## `GET /filter`

Query:

- `status`: chỉ nhận đúng một trong `sắp hết hàng` | `còn hàng` | `hết hàng` (không dùng `RegExp` từ chuỗi tùy ý).
- `startDate`, `endDate`: lọc `createdAt` (cuối ngày `endDate` set 23:59:59).
- Cùng `listQuery` + tìm `timkiem`/`q` như `GET /`.

Response: `warehouses`, `total`, `totalPages`, `page`, `limit`, `offset`, `currentSort`, `currentWarehouse`.

## `DELETE /:id`

- Kiểm tra ObjectId; không tồn tại → **404** (trước đây 500).
