# Hướng dẫn cho agent (Cursor / AI)

Tài liệu này bổ sung cho README: cách làm việc an toàn và nhất quán trên repo **admin_elevator_vietphat**.

## Ưu tiên

1. Chỉ thị rõ ràng trong tin nhắn người dùng và file này.
2. Quy ước code hiện có trong `src/` (CommonJS `require`, Express 4, Mongoose).
3. Không mở rộng phạm vi không được yêu cầu; không xóa comment hoặc logic không liên quan.

## Quy tắc mutation (ghi / thay đổi dữ liệu) — **bắt buộc nhớ mỗi lần sửa**

Mọi API **thêm, sửa, xóa** hoặc **bất kỳ thao tác nào làm thay đổi dữ liệu** (POST, PUT, PATCH, DELETE, hoặc GET mà trong controller có `save` / `update` / `delete` / `insert` / thay đổi trạng thái hệ thống) phải được bảo vệ bằng middleware quản trị:

1. **Mặc định:** chỉ **admin** — dùng `verifyTokenAdmin` trong `middleware.controller.js` (role `author === "admin"`).
2. **Ngoại lệ có chủ đích:** nếu nghiệp vụ cho **nhân viên (employee)** được phép thao tác giống admin (CMS), dùng `verifyTokenStaff` và **ghi rõ trong mô tả commit/PR** vì sao không dùng `verifyTokenAdmin`.
3. **Không** để mutation chỉ với `verifyToken` (tài khoản khách `customer`) trừ khi đặc tả nghiệp vụ rõ ràng (ví dụ: user đổi mật khẩu của chính mình, cập nhật giỏ hàng của chính mình, tạo đơn với ràng buộc `user_id` khớp JWT).

**Checklist khi thêm hoặc sửa route:**

- [ ] Method có ghi DB không? → Phải có `verifyTokenAdmin` hoặc `verifyTokenStaff` (hoặc ngoại lệ đã nêu và đã duyệt).
- [ ] Có bỏ middleware khi refactor không? → Không được làm lộ mutation ra công khai.

File middleware: `src/resources/app/controller/middleware.controller.js`. Gắn middleware **trước** controller trong file route tương ứng `src/resources/router/*.route.js`.

## Stack

- **Runtime:** Node.js  
- **Framework:** Express  
- **DB:** MongoDB qua Mongoose (`DATABASE_URL_CONNECTION` trong `.env`)  
- **Entry:** `src/server.js`, cổng `process.env.PORT || 4000`
- **Auth:** JWT access (`JWT_ACCESS_KEY`) + refresh trong cookie + hash `refreshTokenHash` trên `User`; middleware `verifyToken` / `verifyTokenStaff` / `verifyTokenAdmin` trong `middleware.controller.js`, đã gắn trên các router tương ứng.

Hướng dẫn cho frontend: [docs/auth-frontend.md](docs/auth-frontend.md).

## Trước khi sửa server (buổi bảo trì)

- Xác nhận `.env` local (hoặc môi trường deploy) có `DATABASE_URL_CONNECTION` và `PORT` đúng.
- Sau thay đổi route/controller/model: kiểm tra nhanh bằng cách chạy `yarn start` và gọi endpoint liên quan.
- CORS: mọi origin mới cho front-end cần cập nhật trong `src/server.js`.

## Tài liệu con

- Chi tiết checklist và mở rộng: thư mục [docs/](docs/).

## An toàn

- Không commit `.env`, khóa bí mật, hoặc dữ liệu nhạy cảm.
- Giữ giới hạn body/parser và upload phù hợp với production nếu có yêu cầu riêng.
