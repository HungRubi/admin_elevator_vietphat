# admin_elevator_vietphat — Backend API

Server Node.js (Express) cho hệ thống quản trị thang máy Việt Phát: REST API, MongoDB (Mongoose), xác thực (JWT / Passport), upload tĩnh.

## Yêu cầu

- Node.js (khuyến nghị LTS)
- MongoDB (URI kết nối qua biến môi trường)
- Yarn hoặc npm

## Cài đặt

```bash
yarn install
# hoặc: npm install
```

## Biến môi trường

Tạo file `.env` ở thư mục gốc (không commit file này):

| Biến | Mô tả |
|------|--------|
| `DATABASE_URL_CONNECTION` | Chuỗi kết nối MongoDB (bắt buộc để DB hoạt động) |
| `PORT` | Cổng HTTP (mặc định `4000` nếu không set) |
| `JWT_ACCESS_KEY` | Secret ký access token (bắt buộc cho login / middleware) |
| `JWT_REFRESH_KEY` | Secret ký refresh token (cookie) |
| `RATE_LIMIT_ARTICLE_PER_MINUTE` | (Tùy chọn) Giới hạn GET article / phút / IP (mặc định 120) |
| `RATE_LIMIT_CART_PER_MINUTE` | (Tùy chọn) Giới hạn PUT cart / phút / IP (mặc định 90) |
| `RATE_LIMIT_CATEGORY_PUBLIC_PER_MINUTE` | (Tùy chọn) GET category public / phút / IP (mặc định 120) |
| `RATE_LIMIT_COMMENT_ADD_PER_MINUTE` | (Tùy chọn) POST comment / phút / IP (mặc định 45) |
| `RATE_LIMIT_COMMENT_STAFF_PER_MINUTE` | (Tùy chọn) GET comment staff / phút / IP (mặc định 120) |
| `RATE_LIMIT_NOTIFICATION_CUSTOMER_PER_MINUTE` | (Tùy chọn) GET/PUT notification khách / phút / IP (mặc định 90) |
| `RATE_LIMIT_NOTIFICATION_STAFF_PER_MINUTE` | (Tùy chọn) Notification staff / phút / IP (mặc định 120) |
| `RATE_LIMIT_ORDER_STORE_PER_MINUTE` | (Tùy chọn) POST đặt hàng / phút / IP (mặc định 30) |
| `RATE_LIMIT_ORDER_STAFF_PER_MINUTE` | (Tùy chọn) API đơn hàng staff / phút / IP (mặc định 120) |
| `RATE_LIMIT_PRODUCTS_PUBLIC_PER_MINUTE` | (Tùy chọn) GET sản phẩm public / phút / IP (mặc định 120) |
| `RATE_LIMIT_PRODUCTS_SELECTED_PER_MINUTE` | (Tùy chọn) POST `/products/selected` / phút / IP (mặc định 60) |
| `RATE_LIMIT_RECEIPT_STAFF_PER_MINUTE` | (Tùy chọn) API phiếu nhập staff / phút / IP (mặc định 120) |
| `RATE_LIMIT_REPORT_STAFF_PER_MINUTE` | (Tùy chọn) GET `/report` staff / phút / IP (mặc định 90) |
| `RATE_LIMIT_SITE_HOME_PER_MINUTE` | (Tùy chọn) `GET /home` / phút / IP (mặc định 120) |
| `RATE_LIMIT_SITE_SEARCH_PER_MINUTE` | (Tùy chọn) `GET /timkiem` / phút / IP (mặc định 60) |
| `RATE_LIMIT_SITE_PAYMENT_URL_PER_MINUTE` | (Tùy chọn) `POST /create-payment-url` / phút / IP (mặc định 30) |
| `RATE_LIMIT_SITE_VNP_CALLBACK_PER_MINUTE` | (Tùy chọn) VNPay callback routes / phút / IP (mặc định 120) |
| `FRONTEND_URL` hoặc `VNP_PAYMENT_REDIRECT_BASE` | (Tùy chọn) Base URL redirect sau `GET /vnpay/return` (mặc định `http://localhost:4000`) |
| `RATE_LIMIT_SUPPLIER_STAFF_PER_MINUTE` | (Tùy chọn) API `/supplier` staff / phút / IP (mặc định 120) |
| `RATE_LIMIT_USER_STAFF_PER_MINUTE` | (Tùy chọn) API `/user` staff / phút / IP (mặc định 120) |
| `RATE_LIMIT_WAREHOUSE_STAFF_PER_MINUTE` | (Tùy chọn) API `/warehouse` staff / phút / IP (mặc định 120) |
| `RATE_LIMIT_WARRANTY_STAFF_PER_MINUTE` | (Tùy chọn) API `/warranty` staff / phút / IP (mặc định 120) |

Xem chi tiết luồng đăng nhập, refresh và header cho frontend: [docs/auth-frontend.md](docs/auth-frontend.md).

API Article sau chuẩn hóa list/pagination: [docs/controllers/article.md](docs/controllers/article.md).

## Chạy server

```bash
yarn start
# hoặc: npm run start
```

Mặc định: `http://localhost:4000` (hoặc `PORT` trong `.env`). Script dùng `nodemon` và `--inspect` để debug.

## Script khác

| Script | Mô tả |
|--------|--------|
| `yarn watch` | Biên dịch SCSS (`sass --watch`) |
| `yarn test` | Placeholder (chưa có test) |
| `yarn smoke` | Kiểm tra nhanh: nạp toàn bộ router/controller (không listen); xem `scripts/smoke-load.js` |

## Cấu trúc thư mục (rút gọn)

```
src/
  server.js          # Điểm vào Express
  config/db/         # Kết nối MongoDB
  resources/
    router/          # Định tuyến API
    app/
      controller/    # Xử lý request
      model/         # Schema Mongoose
    util/            # Tiện ích
```

File tĩnh upload: phục vụ qua `/uploads` (thư mục `uploads` ở cấp trên `src`).

## CORS

Đang cho phép một số origin (localhost front-end và production); chỉnh trong `src/server.js` nếu thêm môi trường mới.

## Tài liệu thêm

- [docs/README.md](docs/README.md) — mục lục tài liệu và gợi ý cho buổi bảo trì server
- [AGENTS.md](AGENTS.md) — hướng dẫn cho agent/AI khi làm việc trên repo

## Repository

https://github.com/HungRubi/admin_elevator_vietphat
