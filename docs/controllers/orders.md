# API Orders (`/order`)

## Quy tắc (AGENTS)

- **Staff** (`verifyTokenStaff`): danh sách, filter, biểu đồ, `GET /:id`, `PUT /:id`, `PUT /admin/:id`, `DELETE /:id`, `GET /details/:id`, `GET /add`.
- **Customer + token** (`verifyToken`): **`POST /store`** — `user_id` phải khớp JWT trừ khi staff đặt hộ (đã có trong controller).

## Rate limit

| Env | Mặc định | Áp dụng |
|-----|------------|---------|
| `RATE_LIMIT_ORDER_STORE_PER_MINUTE` | 30 | `POST /store` |
| `RATE_LIMIT_ORDER_STAFF_PER_MINUTE` | 120 | Mọi route staff |

## List / filter — `listQuery.util`

Tham số: `page`, `offset`, `limit` (max 100), `sort`, `order`, `timkiem` / `q`.

- **`GET /`**: tìm `order_code` (regex); sort whitelist: `createdAt`, `updatedAt`, `order_date`, `total_price`, `status`, `order_code`, `payment_method`. Default `limit=10`, `createdAt` desc.
- **`GET /filter`**: lọc `status`, `payment_method`, `from_date`/`to_date` (`order_date`), cộng tìm `order_code` qua `timkiem`/`q`; cùng sort/limit.

**Lưu ý:** `order=desc`/`asc` dùng **chuẩn `listQuery`** (desc = mới nhất trước với `createdAt`), khác logic cũ (`order === 'desc' ? 1 : -1`).

## Sửa lỗi / an toàn

1. **`DELETE /:id` (`deleteDetails`)**: Trước xóa order rồi mới đọc chi tiết → luôn rỗng; vòng `for..in` dùng index làm object → sai. Nay: lấy chi tiết **trước**, hoàn kho (**chỉ khi** đơn không phải `Thất bại` — khớp logic tạo đơn không trừ kho), rồi xóa chi tiết + đơn.
2. **`PUT /:id` (`update`)**: Không còn `updateOne` toàn `req.body`; whitelist field; thông báo khi **đổi `status`**; danh sách trả về theo **`user_id` của đơn**, không tin `userId` trong body.
3. **`PUT /admin/:id`**: Chỉ `$set` field cho phép (không mass assignment).
4. **`GET /:id` (`edit`)**: 404 nếu không có đơn; **bỏ** gửi notification trên GET (sai HTTP); notification đổi trạng thái chuyển sang **`PUT /:id`**.
5. **`POST /store`**: Bắt buộc `items` là mảng không rỗng; thông báo admin dùng `Promise.all` thay `forEach` async.
6. **`GET /add`**: `Product.find` giới hạn **500** bản ghi để tránh quá tải.
7. **`GET /details/:id`**: Trả **JSON** `{ order, orderDetailsFormat }` thay `res.render` (breaking nếu còn view cũ).

## Response `GET /` thêm

`total`, `page`, `limit`, `offset`, `searchOrder` khi có tìm kiếm.
