# API Notification (`/notification`)

Tuân thủ **AGENTS.md**:

| Route | Middleware | Ghi chú |
|--------|------------|---------|
| POST `/add`, GET `/`, `/filter`, `GET/PUT/DELETE /:id` | `verifyTokenStaff` | Quản trị |
| PUT `/read/:id`, GET `/all/:id` | `verifyToken` | Khách: **chỉ dữ liệu của chính user** |

## Rate limit

| Env | Mặc định | Áp dụng |
|-----|------------|---------|
| `RATE_LIMIT_NOTIFICATION_CUSTOMER_PER_MINUTE` | 90 | PUT `/read/:id`, GET `/all/:id` |
| `RATE_LIMIT_NOTIFICATION_STAFF_PER_MINUTE` | 120 | Mọi route staff |

## `listQuery.util`

`page` / `offset`, `limit` (max 100), `sort`, `order`, `timkiem` / `q`.  
Legacy: **`notification=desc` / `notification=asc`** (đã thêm trong `listQuery.util`).

Sort cho phép: `createdAt`, `updatedAt`, `type`, `message`, `isRead`.

## Sửa lỗi nghiêm trọng (đã vá)

1. **`POST /add`**: Trước đây luôn lưu **hai** bản ghi khi có `user_id` (một có user, một không). Nay **một** document; `message` bắt buộc; `type` phải thuộc enum nếu gửi; `user_id` tùy chọn (thông báo hệ thống không gắn user).

2. **`PUT /:id`**: Trước `updateOne` **không có** payload — đã thay bằng `$set` / `$unset` whitelist (`type`, `message`, `isRead`, `user_id`).

3. **404**: Không tìm thấy dùng **404** thay vì 500.

4. **IDOR**  
   - **`GET /all/:id`**: `:id` **phải trùng** `req.user.id`.  
   - **`PUT /read/:id`**: Chỉ cho phép nếu `notification.user_id` trùng JWT (thông báo “hệ thống” không có `user_id` **không** đánh dấu đọc qua endpoint này — tránh sửa nhầm bản ghi chung).

5. **`PUT /read/:id`**: Không tin `user_id` trong body để tải lại danh sách; dùng **`req.user.id`**.

6. **`GET /filter`**: `type` chỉ chấp nhận giá trị enum cố định (không `RegExp` từ input thô). Thêm phân trang + tìm `message` qua `timkiem`/`q`.

7. **`GET /`**: Tìm kiếm kết hợp user (theo **tên**) hoặc `message`; có phân trang và `countDocuments` đồng bộ filter.

## Breaking / thay đổi response

- `GET /` thêm: `total`, `page`, `limit`, `offset`, `currentNotification` và alias `sortNotification` (thay cho typo cũ `currentNotifition`).
- `GET /all/:id` thêm meta phân trang; **403** nếu lệch user.
- `PUT /read/:id` **403** nếu không phải thông báo cá nhân của user.
