# API Report (`/report`)

Toàn bộ route dùng **`verifyTokenStaff`** (dashboard nội bộ, không public).

## Rate limit

`RATE_LIMIT_REPORT_STAFF_PER_MINUTE` (mặc định **90**) — báo cáo gồm nhiều aggregate / populate, giới hạn chặt hơn một chút so với CRUD thường.

## `GET /`

Query:

- **`date`**: `hôm nay` | `hôm qua` | `tuần này` | `tháng này` | `năm này` — lọc `Order.createdAt` (đã **sửa**: trước đây so sánh `createdAt` với chuỗi từ `formatTime.util` → sai).
- **`startDate`**, **`endDate`**: khoảng tùy chọn (ghi đè khi cả hai có).
- **`category`**: (tùy chọn) ObjectId danh mục — lọc phần **`dataCategoryChart`** (chi tiết đơn thành công theo sản phẩm thuộc danh mục đó).

Response gồm: tổng quan đơn/doanh thu (kèm % so với kỳ trước khi có `date`), top user, top sản phẩm, biểu đồ đánh giá sao, **tối đa 400** bản ghi kho (sort `stock` tăng).

### Đã sửa logic

- **`getPreviousPeriod`**: trước đây hai nhánh `hôm nay` / `hôm qua` gán vào biến `query` không tồn tại trong hàm → kỳ trước không bao giờ đúng; `getDateRange(2)` / `(4)` không được util hỗ trợ.
- So sánh sao comment: dùng `Number(r._id) === star` (tránh lệch kiểu).
- Typo nội bộ: `prevTotalOrderFasle` → `prevTotalOrderFalse`.

## `GET /week`

Doanh thu 7 ngày gần nhất (đơn **Thành công**, theo `order_date`). Response: `{ result: [{ date, revenue, target }] }`.
