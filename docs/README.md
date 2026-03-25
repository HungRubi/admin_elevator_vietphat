# Tài liệu dự án — admin_elevator_vietphat

Thư mục này tập trung tài liệu bổ sung cho backend. Nội dung tổng quan và cài đặt nằm ở [README.md](../README.md) gốc repo.

## Mục đích

- Ghi chú quy trình, quyết định kỹ thuật, hoặc hướng dẫn vận hành (có thể thêm file `.md` mới khi cần).
- Hỗ trợ **buổi sửa / bảo trì server** có checklist rõ ràng.

### Tài liệu có sẵn

- **[auth-frontend.md](auth-frontend.md)** — API `/auth`, JWT, cookie refresh, header `Authorization`, phân quyền route cho team frontend.
- **Controller (duyệt từng phần):** [controllers/article.md](controllers/article.md) — Article + `listQuery.util` + rate limit `/articles`.
- [controllers/cart.md](controllers/cart.md) — Cart: IDOR fix, batch tối đa 50 dòng, rate limit mutation.
- [controllers/category.md](controllers/category.md) — Category: phân trang/sort/search, rate limit public, breaking response một số GET.
- [controllers/comments.md](controllers/comments.md) — Comments: IDOR fix, filter `createdAt`, listQuery + rate limit.
- [controllers/notification.md](controllers/notification.md) — Notification: vá add/update, IDOR read/all, listQuery + rate limit.
- [controllers/orders.md](controllers/orders.md) — Orders: deleteDetails, update whitelist, listQuery, rate limit, details JSON.
- [controllers/products.md](controllers/products.md) — Products: listQuery, update whitelist, rate limit public, selected validation.
- [controllers/receipt.md](controllers/receipt.md) — Receipt: kho khi update/delete, listQuery, validation, rate limit.
- [controllers/report.md](controllers/report.md) — Report: sửa filter ngày / kỳ trước, category chart, rate limit staff.
- [controllers/site.md](controllers/site.md) — Site: home, tìm kiếm listQuery + escape regex, VNPay, rate limit.
- [controllers/supplier.md](controllers/supplier.md) — Supplier: listQuery, chặn xóa khi còn SP, rate limit staff.
- [controllers/user.md](controllers/user.md) — User: listQuery, không lộ password, siết authour/xóa, rate limit staff.
- [controllers/warehouse.md](controllers/warehouse.md) — Warehouse: listQuery, tìm kiếm đúng kiểu, filter an toàn, rate limit.
- [controllers/warranty.md](controllers/warranty.md) — Warranty: listQuery, sửa async/kho/update, batch GET add, rate limit.

## Checklist gợi ý: buổi sửa server

1. **Môi trường:** `.env` đầy đủ (`DATABASE_URL_CONNECTION`, `PORT`); Node phiên bản ổn định.
2. **Phụ thuộc:** `yarn install` sau khi đổi nhánh hoặc cập nhật `package.json` / lockfile.
3. **Kết nối DB:** xem log khi start — thông báo kết nối MongoDB thành công/thất bại từ `src/config/db/index.js`.
4. **API / CORS:** nếu front-end đổi URL hoặc port, cập nhật `origin` trong `src/server.js`.
5. **Upload / static:** đường dẫn `/uploads` và thư mục `uploads` tồn tại trên máy chủ.
6. **Sau deploy:** smoke test vài endpoint chính (đăng nhập, danh mục, v.v. tùy module đang sửa).

## Thêm tài liệu

Đặt file mới trong `docs/` với tên mô tả rõ (ví dụ `api-conventions.md`, `deployment.md`) và liên kết từ đây nếu là tài liệu quan trọng.
