# API Article (`/articles`) — sau rà soát controller

Tài liệu cho round duyệt **article.controller** (controller đầu tiên theo thứ tự A→Z). Các controller khác sẽ làm tương tự sau khi bạn duyệt xong.

## Tiện ích dùng chung

- **`src/resources/util/listQuery.util.js`**: chuẩn hóa `page` / `offset`, `limit` (tối đa **100**), `sort`, `order`, `timkiem` hoặc `q`.
- **Rate limit** (đọc danh sách / chi tiết public): `express-rate-limit`, mặc định **120 request/phút/IP** cho các GET được gắn limiter. Tùy chỉnh: biến môi trường `RATE_LIMIT_ARTICLE_PER_MINUTE`.

## Tham số query chung (list)

| Tham số | Mô tả |
|---------|--------|
| `page` | Trang bắt đầu từ **1** (mặc định 1). Bỏ qua nếu có `offset`. |
| `offset` | Số bản ghi bỏ qua (≥ 0). Nếu có thì **ưu tiên** hơn `page`. |
| `limit` | Số bản ghi/trang, tối thiểu 1, **tối đa 100**. |
| `sort` | Trường sort; chỉ field được whitelist (xem từng endpoint). |
| `order` | `asc` hoặc `desc`. |
| `timkiem` hoặc `q` | Chuỗi tìm kiếm (tùy endpoint). |
| `article` | **Tương thích cũ**: `article=desc` → sort tăng dần (hành vi legacy giống code cũ). |

## Endpoint

### `GET /articles/` (staff)

Danh sách bài **status = public** (dùng trong admin).

- Sort cho phép: `createdAt`, `updatedAt`, `subject`.
- Mặc định: `limit=8`, sort `createdAt` desc.
- Tìm kiếm: `timkiem` / `q` trên **subject** và **content** (regex, không phân biệt hoa thường).

Response `data`:

- `articles`, `total`, `totalPage`, `page`, `limit`, `offset`, `currentSort`, `currentOrder`, `search`.

### `GET /articles/admin` (staff)

Tất cả bài (mọi status), có phân trang.

- Sort: `subject`, `createdAt`, `updatedAt`, `status`, `author`. Mặc định `limit=5`, sort `subject` + thứ tự theo `order` / legacy `article`.
- `timkiem` / `q`: lọc **subject** (regex).

Response: `total`, `totalPage`, `page`, `limit`, `offset`, `articleFormat`, `searchType`, `currentSort`, `currentArticle` (asc/desc). Khi có tìm kiếm: thêm `searchArticle` (cùng nội dung đã phân trang với `articleFormat`).

### `GET /articles/filter` (staff)

Lọc theo `status`, `startDate`, `endDate` (như cũ), cộng phân trang + sort + `timkiem`/`q` trên subject.

- Sort cho phép: `subject`, `createdAt`, `updatedAt`, `status`, `author`. Mặc định `limit=5`.

### `GET /articles/fe/:slug` (public, có rate limit)

- Nếu không có slug khớp → **404**.
- `limit_sidebar` (tùy chọn): số bài / sản phẩm kèm bên; mặc định **4**, tối đa **20** (không dùng `MAX_LIMIT` 100 để tránh payload quá lớn).

### `GET /articles/api/latest` (public, có rate limit)

- Query `limit`: mặc định **2**, tối đa **20**.
- Response: **mảng** JSON giữ tương thích client cũ (không bọc object).

### `GET /articles/:id`, `PUT`, `DELETE`, `POST /store`

- `edit`: không tìm thấy → **404**.
- `update` / `delete`: không khớp id → **404**.
- Lỗi `index` trước đây gọi `res.status.json` → đã sửa thành **500** + `message`.

## Sửa lỗi đã rà

- `index`: đếm `countDocuments` đồng bộ filter `{ status: 'public' }` (trước đây list public nhưng đếm toàn bộ).
- `getdetailproduct`: null slug → 404 thay vì throw.
- `delete`: dùng async/await, báo 404 khi không xóa được bản ghi.

## Việc chưa làm (chờ duyệt xong article)

Các controller **auth, cart, category, …** (B→Z) chưa chỉnh trong round này.
