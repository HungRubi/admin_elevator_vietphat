# API Giỏ hàng (`/cart`) — controller **cart**

## Phạm vi

Controller chỉ có **ghi dữ liệu** (không có endpoint list/phân trang). Quy tắc AGENTS: dùng **`verifyToken`** + **chỉ được thao tác giỏ của chính user** (`:id` trong URL phải trùng `id` trong JWT).

## Rate limit

- PUT `/update/:id`, `/delete/:id`: **90 request/phút/IP** (mặc định), env `RATE_LIMIT_CART_PER_MINUTE`.

## `PUT /cart/update/:id`

- Header: `Authorization: Bearer <accessToken>` (hoặc header `token`).
- **`:id`**: `userId` — **bắt buộc trùng** với `id` trong token, nếu không → **403**.
- Body: `{ "items": [ { "productId", "quantity", "price" }, ... ] }`
  - `items`: mảng không rỗng, tối đa **50** dòng mỗi request.
  - Mỗi `productId` phải tồn tại trong DB.
  - `quantity`: số nguyên ≥ 1, trần **9999** mỗi dòng (cộng dồn vào dòng đã có cũng bị trần).
  - `price`: số ≥ 0.

Hành vi: trùng `productId` thì **cộng** `quantity` vào dòng hiện có (như logic cũ với một dòng); nhiều phần tử trong `items` được xử lý **lần lượt** trong cùng request (trước đây chỉ xét `items[0]`).

Response: `message`, `cart`, `product` (populate sản phẩm còn lại trong giỏ).

## `PUT /cart/delete/:id`

- **`:id`**: userId — phải trùng JWT → **403** nếu không.
- Body: `productId` — **một** id (string) hoặc **mảng** id cần xóa khỏi giỏ (tối đa 50 id).

Sửa lỗi cũ: khi `productId` là string, filter xóa dùng mảng id chuẩn, không dùng `String.includes` nhầm.

## Ghi chú

- Không dùng `listQuery.util` vì không có API danh sách/pagination cho cart.
- Nhân viên/admin **không** dùng route này để sửa giỏ khách (chỉ đúng customer + token khớp `:id`).
