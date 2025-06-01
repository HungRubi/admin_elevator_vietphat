const Cart = require('../model/cart.model');
const Product = require('../model/products.model');

class CartController {

    /** [PUT] /cart/update/:id */
    updateCart = async (req, res) => {
        try {
            const { items } = req.body;
            const userId = req.params.id;

            if (!items || items.length === 0) {
                return res.status(400).json({ message: 'Không có sản phẩm trong giỏ hàng' });
            }

            const { productId, quantity, price } = items[0]; // Giả sử thêm từng sản phẩm một

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
            }

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                cart = new Cart({
                    userId,
                    items: [{
                        productId,
                        quantity,
                        price
                    }],
                    totalPrice: quantity * price
                });
            } else {
                const existingItemIndex = cart.items.findIndex(item =>
                    item.productId.toString() === productId.toString()
                );

                if (existingItemIndex !== -1) {
                    cart.items[existingItemIndex].quantity += Number(quantity);
                } else {
                    cart.items.push({ productId, quantity, price });
                }

                cart.totalPrice = cart.items.reduce((total, item) => {
                    return total + item.price * item.quantity;
                }, 0);
            }

            await cart.save();
            const productsId = cart.items.map(item => item.productId);
            const productCart = await Product.find({ _id: { $in: productsId } });

            return res.status(200).json({ 
                message: 'Cập nhật giỏ hàng thành công', 
                cart,
                product: productCart 
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    };

    /** [PUT] /cart/delete/:id */
    deleteCartItem = async (req, res) => {
        try {
            const { productId } = req.body; 
            const userId = req.params.id;

            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
            }

            cart.items = cart.items.filter(item =>
                !productId.includes(item.productId.toString())
            );

            cart.totalPrice = cart.items.reduce((total, item) => {
                return total + item.price * item.quantity;
            }, 0);

            await cart.save();

            const productsId = cart.items.map(item => item.productId);
            const productCart = await Product.find({ _id: { $in: productsId } });

            res.status(200).json({
                message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
                cart,
                product: productCart
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    };

    
}

module.exports = new CartController();