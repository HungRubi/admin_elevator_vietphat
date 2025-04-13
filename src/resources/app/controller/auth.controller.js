const { formatDate } = require('../../util/formatDate.util');
const User = require('../model/user.model');
const Cart = require('../model/cart.model');
const Product = require('../model/products.model');
const Order = require('../model/orders.model');
const OrderDetail = require('../model/orderDetail.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");

dotenv.config();

let refreshTokens = [];

class AuthController {
    
    /** [POST] /auth/register */
    async register(req, res, next) {
        try{
            console.log(req.body);
            const {frist,last,email,city,street,day,month,year,account,password, confirm,phone} = req.body;
            const existingUser = await User.findOne({ $or: [{ email }, { account }] });
            if (existingUser) {
                return res.status(404).json('Account already exists. Please use a different email or username.');
            }
            if(password !== confirm){
                return res.status(404).json("Password and confirm password do not match");
            }
            const name = `${frist} ${last}`;
            const y = parseInt(year, 10);
            const m = parseInt(month, 10) - 1; // Tháng trong JS bắt đầu từ 0
            const d = parseInt(day, 10);

            const birth = new Date(y, m, d);
            if (isNaN(birth.getTime())) {
                return res.status(400).json("Ngày sinh không hợp lệ");
            }
            const address = `${city}, ${street}`;

            const hashPassword = await bcrypt.hash(password, 10);

            const user = new User({
                account,
                password: hashPassword,
                name,
                address,
                phone,
                email,
                birth
            });

            await user.save();
            res.status(200).json({message: "Register successful"})
        }catch(err){
            res.status(500).json(err);
        }
    }

    /** [POST] /auth/login */
    async login(req, res, next) {
        try{
            const user = await User.findOne({account: req.body.account});
            if(!user){
                return res.status(404).json("Incorrect account")
            }
            if (!user.password.startsWith("$2b$")) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                await User.updateOne({ _id: user._id }, { password: hashedPassword });
                user.password = hashedPassword;
            }
            const validedPass = await bcrypt.compare(
                req.body.password,
                user.password
            )
            if(!validedPass){
                return res.status(404).json("Incorrect password")
            }
            if(user && validedPass){
                const accessToken = jwt.sign(
                    {
                        id: user._id,
                        author: user.authour,
                    },
                    process.env.JWT_ACCESS_KEY,
                    {expiresIn: "2h"}
                );
                const refreshToken = jwt.sign(
                    {
                        id: user._id,
                        author: user.authour,
                    },
                    process.env.JWT_REFRESH_KEY,
                    {expiresIn: "365d"} 
                );
                refreshTokens.push(refreshToken)
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: false,
                    path: "/" ,
                    sameSite: "strict",
                })
                await User.updateOne({ _id: user._id }, { lastLogin: new Date() });
                const { password, ...userWithoutPassword } = user.toObject();
                const formatUser = {
                    ...userWithoutPassword,
                    format: formatDate(user.birth)
                }
                const cart = await Cart.find({ userId: user._id });

                const productId = cart.flatMap(item => item.items.map(product => product.productId));

                const product = await Product.find({ _id: { $in: productId } });

                const orders = await Order.find({ user_id: user._id });
                const orderIds = orders.map(item => item._id);

                // Đếm số đơn hàng thất bại
                const failedOrdersCount = orders.filter(o => o.status === 'Thất bại').length;

                // Format ngày tạo
                const formattedOrders = orders.map(order => {
                return {
                    ...order.toObject(),
                    createdAtFormatted: order.createdAt.toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    }),
                };
                });

                const orderDetails = await OrderDetail.find({ order_id: { $in: orderIds } });
                const productIds = orderDetails.map(item => item.product_id);
                const products = await Product.find({ _id: { $in: productIds } });

                // Map nhanh product theo _id
                const productMap = {};
                products.forEach(p => {
                    productMap[p._id.toString()] = p;
                });

                // Gắn product vào orderDetail
                const orderDetailsWithProducts = orderDetails.map(detail => {
                const product = productMap[detail.product_id.toString()];
                return {
                    ...detail.toObject(),
                    product,
                };
                });

                // Nhóm orderDetails theo order_id
                const orderDetailMap = {};
                orderDetailsWithProducts.forEach(detail => {
                    const key = detail.order_id.toString();
                    if (!orderDetailMap[key]) {
                        orderDetailMap[key] = [];
                    }
                    orderDetailMap[key].push(detail);
                });

                // Gộp order + orderDetails
                const ordersWithDetails = formattedOrders.map(order => {
                    return {
                        ...order,
                        orderDetails: orderDetailMap[order._id.toString()] || [],
                    };
                });
                res.status(200).json({
                    orders: ordersWithDetails,
                    failedOrdersCount,
                    cart,
                    product,
                    message: "Login successful",
                    user: formatUser,
                    accessToken,
                })
            }
        }catch(error){
            console.error("🔥 Lỗi khi đăng nhập:", error); // In lỗi ra console
            res.status(500).json({message: error})
        }
    }

    /** [POST] /auth/refresh */
    requestRefreshToken (req, res, next) {
        try{
            const refreshToken = req.cookies.refreshToken;
            if(!refreshToken){
                res.status(401).json("You're not authenticated");
            }
            if(refreshTokens.includes(refreshToken)){
                res.status(403).json("Refresh token is not vaild")
            }
            jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
                if(err) {
                    res.status(403).json(err);
                }
                refreshTokens = refreshTokens.filter((token) => token !== refreshToken)
                const newAccessToken = jwt.sign(
                    {
                        id: user._id,
                        author: user.authour,
                    },
                    process.env.JWT_ACCESS_KEY,
                    {expiresIn: "2h"} 
                );
                const newRefreshToken = jwt.sign(
                    {
                        id: user._id,
                        author: user.authour,
                    },
                    process.env.JWT_REFRESH_KEY,
                    {expiresIn: "365d"} 
                );
                refreshTokens.push(newRefreshToken);
                res.status(200).json({
                    accessToken: newAccessToken,
                    newRefreshToken: newRefreshToken,
                });
            })
        }catch(err){
            res.status(500).json(err);
        }
    }

    /** [POST] /auth/logout */
    async logout(req, res, next) {
        try{
            res.clearCookie("refreshToken");
            refreshTokens = refreshTokens.filter(token => token !== req.cookies.refreshToken);
            res.status(200).json("Logout successful");
        }catch(err){
            res.status(500).json(err);
        }
    }
}

module.exports = new AuthController();