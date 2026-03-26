const Cart = require('../model/cart.model');
const Product = require('../model/products.model');
const mongoose = require('mongoose');

const MAX_ITEMS_PER_REQUEST = 50;
const MAX_LINE_QUANTITY = 9999;

function assertCartOwner(req, cartUserIdFromParams) {
    if (!req.user || String(req.user.id) !== String(cartUserIdFromParams)) {
        return { ok: false, status: 403, message: 'Không được thao tác giỏ hàng của tài khoản khác.' };
    }
    return { ok: true };
}

function recalcTotal(cart) {
    cart.totalPrice = cart.items.reduce((total, item) => {
        return total + Number(item.price) * Number(item.quantity);
    }, 0);
}

/**
 * Gộp một dòng vào cart (đã load hoặc document mới).
 */
function mergeLineIntoCart(cart, { productId, quantity, price }) {
    const qty = Math.min(Math.max(1, Math.floor(Number(quantity))), MAX_LINE_QUANTITY);
    const pr = Number(price);
    if (!Number.isFinite(pr) || pr < 0) {
        return { ok: false, message: 'Giá không hợp lệ' };
    }

    const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId.toString()
    );

    if (existingItemIndex !== -1) {
        cart.items[existingItemIndex].quantity = Math.min(
            cart.items[existingItemIndex].quantity + qty,
            MAX_LINE_QUANTITY
        );
    } else {
        cart.items.push({ productId, quantity: qty, price: pr });
    }
    recalcTotal(cart);
    return { ok: true };
}

class CartController {
    /** [GET] /cart/:id — đọc giỏ (cùng shape `cart` + `product` như PUT /update/:id) */
    getCart = async (req, res) => {
        try {
            const userId = req.params.id;
            const ownerCheck = assertCartOwner(req, userId);
            if (!ownerCheck.ok) {
                return res.status(ownerCheck.status).json({ message: ownerCheck.message });
            }
            if (!mongoose.isValidObjectId(userId)) {
                return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
            }

            let cart = await Cart.findOne({ userId }).lean();
            if (!cart) {
                cart = {
                    userId: new mongoose.Types.ObjectId(userId),
                    items: [],
                    totalPrice: 0,
                };
            }

            const productsId = (cart.items || []).map((item) => item.productId);
            const productCart =
                productsId.length > 0 ? await Product.find({ _id: { $in: productsId } }) : [];

            return res.status(200).json({
                cart,
                product: productCart,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    };

    /** [PUT] /cart/update/:id */
    updateCart = async (req, res) => {
        try {
            const userId = req.params.id;
            const ownerCheck = assertCartOwner(req, userId);
            if (!ownerCheck.ok) {
                return res.status(ownerCheck.status).json({ message: ownerCheck.message });
            }

            if (!mongoose.isValidObjectId(userId)) {
                return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
            }

            const { items } = req.body;
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: 'Không có sản phẩm trong giỏ hàng' });
            }

            if (items.length > MAX_ITEMS_PER_REQUEST) {
                return res.status(400).json({
                    message: `Tối đa ${MAX_ITEMS_PER_REQUEST} dòng sản phẩm mỗi request`,
                });
            }

            const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];
            const products = await Product.find({ _id: { $in: productIds } });
            const productSet = new Set(products.map((p) => p._id.toString()));

            for (const line of items) {
                const { productId, quantity, price } = line;
                if (!productId || !mongoose.isValidObjectId(productId)) {
                    return res.status(400).json({ message: 'productId không hợp lệ' });
                }
                if (!productSet.has(String(productId))) {
                    return res.status(404).json({ message: `Sản phẩm không tồn tại: ${productId}` });
                }
            }

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                cart = new Cart({ userId, items: [], totalPrice: 0 });
            }

            for (const line of items) {
                const { productId, quantity, price } = line;
                const merged = mergeLineIntoCart(cart, { productId, quantity, price });
                if (!merged.ok) {
                    return res.status(400).json({ message: merged.message });
                }
            }

            await cart.save();
            const productsId = cart.items.map((item) => item.productId);
            const productCart = await Product.find({ _id: { $in: productsId } });

            return res.status(200).json({
                message: 'Cập nhật giỏ hàng thành công',
                cart,
                product: productCart,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    };

    /** [PUT] /cart/delete/:id */
    deleteCartItem = async (req, res) => {
        try {
            const userId = req.params.id;
            const ownerCheck = assertCartOwner(req, userId);
            if (!ownerCheck.ok) {
                return res.status(ownerCheck.status).json({ message: ownerCheck.message });
            }

            if (!mongoose.isValidObjectId(userId)) {
                return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
            }

            const { productId } = req.body;
            if (productId === undefined || productId === null) {
                return res.status(400).json({ message: 'Thiếu productId' });
            }

            const idsToRemove = (Array.isArray(productId) ? productId : [productId]).map(String);
            if (idsToRemove.length > MAX_ITEMS_PER_REQUEST) {
                return res.status(400).json({
                    message: `Tối đa ${MAX_ITEMS_PER_REQUEST} productId mỗi request`,
                });
            }

            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
            }

            cart.items = cart.items.filter(
                (item) => !idsToRemove.includes(item.productId.toString())
            );
            recalcTotal(cart);

            await cart.save();

            const productsId = cart.items.map((item) => item.productId);
            const productCart = await Product.find({ _id: { $in: productsId } });

            res.status(200).json({
                message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
                cart,
                product: productCart,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    };
}

module.exports = new CartController();
