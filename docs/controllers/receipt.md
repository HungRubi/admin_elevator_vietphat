# API Receipt (`/receipt`)

Toàn bộ route dùng **`verifyTokenStaff`** (AGENTS: mutation + dữ liệu kho).

## Rate limit

`RATE_LIMIT_RECEIPT_STAFF_PER_MINUTE` (mặc định **120**) cho mọi endpoint.

## `listQuery.util`

`page` / `offset`, `limit` (max 100), `sort`, `order`, `timkiem` / `q`.  
Legacy: **`receipt=desc` / `receipt=asc`**.

Sort: `createdAt`, `updatedAt`, `dateEntry`, `totalPrice`, `status`, `code`.

## Logic kho (đã sửa)

- **`DELETE`**: Chỉ **trừ tồn kho** nếu phiếu **`đã xác nhận`** (trước đây luôn trừ → sai với phiếu chưa nhập kho).
- **`PUT`**: Nếu trạng thái cũ là **`đã xác nhận`**, trước khi đổi dòng chi tiết sẽ **hoàn tồn** theo chi tiết cũ, rồi cập nhật phiếu; nếu trạng thái mới là **`đã xác nhận`** thì **cộng tồn** theo dòng mới. Tránh **cộng đôi** khi sửa phiếu đã xác nhận.

## Validation

- `POST /add`, `PUT /:id`: `item` là mảng không rỗng; `product` ObjectId; `quantity` ≥ 1; `price` ≥ 0; `supplier` hợp lệ (add).
- `status` chỉ nhận enum: `chưa xác nhận` | `đã xác nhận` | `đã hủy`.
- `GET /:id`, `DELETE`, `PUT`: validate `ObjectId`.

## List / filter

- **`GET /`**: Phân trang + tìm `code`; response thêm `total`, `page`, `limit`, `offset`.
- **`GET /filter`**: Lọc `status`, `startDate`/`endDate`, tìm `code` qua `timkiem`/`q`, phân trang.

## Lỗi

Không còn nối object lỗi vào `message` response; dùng thông báo chung + log server.
