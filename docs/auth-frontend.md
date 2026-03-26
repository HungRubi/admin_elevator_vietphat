# Hướng dẫn Auth cho Frontend

Tài liệu mô tả API xác thực tại prefix **`/auth`** và cách gửi **access token** cho các route được bảo vệ.

## Biến môi trường (server)

Server cần (trong `.env`):

| Biến | Vai trò |
|------|---------|
| `JWT_ACCESS_KEY` | Ký / verify access token (bắt buộc) |
| `JWT_REFRESH_KEY` | Ký / verify refresh token (cookie, bắt buộc) |
| `JWT_ACCESS_EXPIRES` | (Tùy chọn) Thời hạn access token — chuỗi `jsonwebtoken`, mặc định **`2h`** (ví dụ `15m`, `1h`, `12h`) |
| `JWT_REFRESH_EXPIRES` | (Tùy chọn) Thời hạn refresh token — mặc định **`365d`** (ví dụ `30d`, `90d`) |
| `DATABASE_URL_CONNECTION` | MongoDB |
| `PORT` | Cổng HTTP (mặc định 4000) |

## Hai loại người dùng

- **Khách hàng** (`authour: customer`): đăng nhập qua `POST /auth/login`.
- **Quản trị / nhân viên** (`admin` hoặc `employee`): đăng nhập qua `POST /auth/login/admin`.

Payload JWT (access & refresh) gồm:

- `id`: chuỗi MongoDB user `_id`
- `author`: một trong `customer` | `employee` | `admin` (trong DB field là `authour`, trong token là `author`)

## CORS & cookie

- API bật `credentials: true`. Nếu front gọi từ domain khác origin trong whitelist (`src/server.js`), cấu hình `fetch` / axios với **`credentials: 'include'`** để gửi cookie refresh.
- Cookie **`refreshToken`**: `HttpOnly`, `SameSite=Strict`, `Path=/`. Trong production (`NODE_ENV=production`) cookie dùng **`Secure`**.

## Endpoint `/auth`

### `POST /auth/register`

Đăng ký khách hàng. Body JSON (tùy form hiện tại), ví dụ các field thường gặp: `first` hoặc `frist`, `last`, `email`, `city`, `street`, `day`, `month`, `year`, `account`, `password`, `confirm`, `phone`.

- **200**: `{ message: "Register successful" }`
- **400 / 404**: validation / trùng tài khoản (xem `message` trong JSON)

### `POST /auth/login`

Đăng nhập khách hàng.

- Body: `{ "account": "...", "password": "..." }`
- **200**: JSON gồm `accessToken`, `user`, `cart`, `orders`, `notification`, … (payload lớn — giữ nguyên theo response hiện tại).
- **404**: sai tài khoản hoặc mật khẩu (có thể là string hoặc object tùy nhánh lỗi).

**Frontend cần lưu `accessToken`** (memory, `sessionStorage`, hoặc store) và gửi kèm mọi request cần bảo vệ.

### `POST /auth/login/admin`

Giống login nhưng chỉ cho `employee` / `admin`. Khách `customer` bị từ chối.

### `GET /auth/me`

Lấy **hồ sơ user đang đăng nhập** từ access token (không đọc cookie refresh).

- **Vì sao dùng GET, không POST:** thao tác **chỉ đọc**, **idempotent**, không body — đúng chuẩn REST và dễ cache/tắt cache ở client; với **`Authorization: Bearer`**, rủi ro CSRF thấp hơn so với cookie-only.
- Header: `Authorization: Bearer <accessToken>` (hoặc header `token` như các route khác).
- Middleware: `verifyToken` (mọi role: `customer` | `employee` | `admin`).
- **200**: JSON gồm:
  - `user`: đã loại `password` và `refreshTokenHash`; có `format` (ngày sinh) như login.
  - **`cart`**: mảng bản ghi giỏ từ `Cart.find({ userId })` — **cùng shape** `POST /auth/login` (thường 0 hoặc 1 phần tử).
  - **`product`**: mảng sản phẩm tương ứng các dòng trong các giỏ đó (rỗng nếu giỏ trống).
- **401 / 403**: thiếu token hoặc JWT không hợp lệ.
- **404**: user đã xóa khỏi DB nhưng token còn sót.

**Gợi ý SPA:** sau F5 / mở lại app, gọi `GET /auth/me` để khôi phục `user` + **giỏ**; nếu chỉ cần đồng bộ giỏ theo `userId`, có thể dùng thêm **`GET /cart/:userId`** (một object `cart` + `product` giống `PUT /cart/update`) — xem [controllers/cart.md](controllers/cart.md).

**Gợi ý SPA (token):** nếu 403 thì thử `POST /auth/refresh` rồi gọi lại `/me`.

### `POST /auth/refresh`

Làm mới access token bằng cookie `refreshToken` (không cần body).

- Gửi kèm cookie (cùng origin hoặc CORS + credentials).
- **200**: `{ "accessToken": "<jwt mới>" }` — server set lại cookie refresh (rotate).
- **401 / 403**: không cookie, hết hạn, hoặc refresh không khớp DB.

Luồng gợi ý khi `accessToken` hết hạn (403 từ API):

1. Gọi `POST /auth/refresh` với credentials.
2. Nếu thành công, lưu `accessToken` mới và **retry** request cũ.
3. Nếu thất bại, đưa user về màn hình đăng nhập.

### `POST /auth/logout`

Xóa cookie refresh và xóa hash refresh trên server.

- Nên gọi kèm credentials.
- **200**: `{ "message": "Logout successful" }`

### `PUT /auth/password/:id`

Đổi mật khẩu — **bắt buộc đã đăng nhập**.

- Header: `Authorization: Bearer <accessToken>`
- `:id` **phải trùng** `id` trong JWT (chỉ đổi mật khẩu của chính mình).
- Body: `{ "password": "mật khẩu hiện tại", "newPassword": "...", "confirmPassword": "..." }`

## Gửi access token tới API được bảo vệ

Hai cách server chấp nhận (xem `middleware.controller.js`):

1. **`Authorization: Bearer <accessToken>`** (khuyến nghị)
2. Header tùy chỉnh: **`token: <accessToken>`**

Ví dụ axios:

```javascript
api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
// hoặc từng request
api.get('/order', { headers: { Authorization: `Bearer ${accessToken}` } });
```

Ví dụ `fetch`:

```javascript
fetch(`${API_BASE}/cart/update/${cartId}`, {
  method: 'PUT',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify(payload),
});
```

## Phân quyền route (tóm tắt)

- **`verifyToken`**: bất kỳ user đã đăng nhập (có JWT hợp lệ).  
  Ví dụ: `GET /auth/me`, `PUT /cart/...`, `POST /order/store`, `PUT /notification/read/:id`, `GET /notification/all/:id`, `POST /comment/add`, `PUT /auth/password/:id`.

- **`verifyTokenStaff`**: chỉ `admin` hoặc `employee`.  
  Ví dụ: `/user/*`, `/report/*`, CRUD kho / nhà cung cấp / phiếu / bảo hành, phần quản trị sản phẩm / danh mục / bài viết / đơn (trừ `POST /order/store` là customer có token).

**Lưu ý `POST /order/store`**

- Bắt buộc có access token.
- Nếu user là **customer**: `body.user_id` phải **trùng** `id` trong JWT.
- Nếu là **admin/employee**: có thể tạo đơn thay cho khách (không bắt buộc trùng `user_id` với JWT).

## Mã lỗi thường gặp (middleware)

| HTTP | JSON (gần đúng) | Ý nghĩa |
|------|------------------|---------|
| 401 | `{ "message": "You're not authenticated" }` | Thiếu token |
| 403 | `{ "message": "Token is not valid" }` | JWT sai / hết hạn |
| 403 | `{ "message": "Access denied. Staff or admin role required." }` | Không đủ quyền staff |

## Gợi ý triển khai SPA

1. Sau login, lưu `accessToken`; mỗi request API gắn `Authorization`.
2. Reload SPA: có token thì gọi `GET /auth/me` để lấy lại `user`; lỗi token → bước 3.
3. Interceptor: nếu response 403 và message token invalid → thử `POST /auth/refresh` một lần rồi retry (và có thể gọi lại `/me`).
4. Đăng xuất: gọi `POST /auth/logout`, xóa token phía client, xóa state user.

## Base URL

Thay `API_BASE` bằng URL server thực tế, ví dụ `http://localhost:4000`.

Các nhóm route khác (không nằm trong `/auth`) được mount tại root tương đối, ví dụ: `/products`, `/category`, `/order`, … — xem `src/resources/router/index.route.js`.
