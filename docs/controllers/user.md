# API User (`/user`)

Toàn bộ route dùng **`verifyTokenStaff`** (admin hoặc employee).

## Rate limit

`RATE_LIMIT_USER_STAFF_PER_MINUTE` (mặc định **120**).

## Bảo mật / nghiệp vụ đã siết

- **Không trả `password` / hash** trong list, chi tiết, cập nhật (`.select('-password')` hoặc refetch sau `save`).
- **`PUT /update/address/:id`**: chỉ cập nhật field **`address`** (đã trim), không còn `$set: req.body` (mass assignment).
- **`POST /store`**: chỉ **admin** mới được gán `authour` khác `customer` (employee tạo user luôn là `customer`). Hỗ trợ thêm typo **`confirm_password`** (cùng ý nghĩa với `comfirm_password`).
- **`DELETE /:id`**: **employee** không được xóa tài khoản **`employee`** hoặc **`admin`** (403); admin vẫn xóa được.
- **`PUT /profile/update/:id`**: kiểm tra email trùng user khác; avatar base64 giới hạn **2MB**; `mkdirSync` với `recursive: true`; response user không có password.

## `listQuery.util`

`page` / `offset`, `limit` (max 100), `sort`, `order`, `timkiem` / `q`.  
Legacy: **`user=asc` / `user=desc`**.

### `GET /`

Sort: `name` (mặc định), `createdAt`, `updatedAt`, `email`, `phone`, `lastLogin`, `authour`.  
Response `data`: `formatUser`, `searchUser` (chỉ khi có tìm kiếm — tương thích front cũ), `totalUser`, **`totalPages`**, `page`, `limit`, `offset`, `searchType`, `currentSort`, `currentOrder`.

### `GET /filter`

Query: `authour` (enum), `start_date` / `end_date` (cuối ngày `end_date` được set 23:59:59), cùng `listQuery` + tìm theo tên.

### `GET /order/:id`

Phân trang `listQuery`; sort: `createdAt`, `updatedAt`, `order_date`, `total_price`, `status`.  
`failedOrdersCount` là **tổng** đơn thất bại của user (không chỉ trang hiện tại). Thêm `total`, `totalPages`, `page`, `limit`, `offset`.

### `GET /new`

`days` mặc định 7, clamp **1–90**. Khoảng `startDate`/`endDate`: số ngày (inclusive) tính theo lịch, tối đa 90. Trung bình/ngày chia cho đúng `daySpan`.

## Lỗi

Thông báo 4xx/5xx dùng `message` chuỗi; không còn nhét object lỗi vào JSON.
