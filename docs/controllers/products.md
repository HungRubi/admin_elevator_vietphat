# API Products (`/products`)

## Quy tắc (AGENTS)

- **Ghi dữ liệu** (`POST /store`, `PUT /:id`, `DELETE /:id`): **`verifyTokenStaff`** (admin + employee).
- **Đọc công khai**: `GET /`, `/filter`, `/fe/:slug`, `POST /selected` — không yêu cầu token; có **rate limit**.

## Rate limit

| Env | Mặc định | Áp dụng |
|-----|------------|---------|
| `RATE_LIMIT_PRODUCTS_PUBLIC_PER_MINUTE` | 120 | GET `/`, `/filter`, `/fe/:slug` và chung cho `POST /selected` (cùng nhóm public) |
| `RATE_LIMIT_PRODUCTS_SELECTED_PER_MINUTE` | 60 | `POST /selected` (thêm lớp hẹp hơn) |

## `listQuery.util`

`page` / `offset`, `limit` (max 100), `sort`, `order`, `timkiem` / `q`.  
Legacy: **`product=desc` / `product=asc`** (đã thêm trong `listQuery.util`).

## Tồn kho trên mỗi sản phẩm (response)

Các API **đọc** danh sách / chi tiết (public + staff) gắn thêm dữ liệu từ bảng **warehouse** (`productId` trỏ tới sản phẩm):

| Field | Kiểu | Ý nghĩa |
|-------|------|--------|
| `warehouseStock` | `number` | Số lượng tồn (`stock`). **0** nếu chưa có bản ghi kho cho SP đó. |
| `warehouse` | `object \| null` | `{ stock, minimum, maximum, status }` hoặc **`null`** nếu chưa có dòng kho. |

*(Một sản phẩm tương ứng một dòng kho; nếu DB có trùng `productId`, map lấy bản ghi cuối cùng trong kết quả query.)*

## Endpoint

### `GET /products/admin` (staff)

Danh sách quản trị: phân trang, tìm `name`, sort whitelist (`name`, `createdAt`, `updatedAt`, `price`, `sale`, `minimum`, `slug`). Response `data`: `productFormat`, `total`, `totalPage`, `page`, `limit`, `offset`, … — mỗi phần tử có **`warehouseStock`** / **`warehouse`**.

### `GET /products` (public)

Default `limit=12`, sort `createdAt` desc; có thể tìm `name`; response `data` thêm `total`, `page`, `limit`, `offset`. Mỗi sản phẩm có **`warehouseStock`** / **`warehouse`**.

### `GET /products/filter` (public)

Lọc `category`, `startDate`/`endDate` (`createdAt`), tìm `name` qua `timkiem`/`q`, phân trang đầy đủ — có **`warehouseStock`** / **`warehouse`**.

### `GET /products/fe/:slug` (public)

404 nếu không có slug. Gợi ý: `$sample` với `limit_suggest` (default 8, max 20).  
**Sửa lỗi:** `formatComments[].lastUpdate` dùng **`comment.updatedAt`**, không còn nhầm `product.updatedAt`.  
`data.product` và từng phần tử `data.productSuggest` đều có **`warehouseStock`** / **`warehouse`**.

### `POST /products/selected` (public)

Body: `productId`: **mảng** ObjectId, tối đa **50**; toàn bộ id phải hợp lệ. Trả `product` (mảng lean + populate) kèm **`warehouseStock`** / **`warehouse`**.

### `GET /products/:id` (staff)

404 nếu không có sản phẩm; danh mục kèm tối đa **500** bản ghi. `data.product` có **`warehouseStock`** / **`warehouse`**.

### `PUT /products/:id` / `DELETE /:id` (staff)

Không mass assignment: chỉ field trong whitelist; cập nhật `name` → tự **tạo lại `slug`**. Xóa: **404** nếu không có bản ghi. Lỗi server trả **500** (không dùng 404 cho lỗi nội bộ).

### `POST /store` (staff)

Lỗi trả **500**.

## Breaking / thay đổi

- `GET /` và `filter`: thêm meta phân trang; `getProduct` response lỗi là object `{ message }` thay vì raw error.
- `POST /selected`: bắt buộc `productId` là mảng; giới hạn 50.
- `data` của `fe/:slug` bọc trong `data` (đồng bộ với edit); thêm `limit_suggest`.
