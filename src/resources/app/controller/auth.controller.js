const crypto = require('crypto');
const { formatDate } = require('../../util/formatDate.util');
const { importDate } = require('../../util/importDate.util')
const User = require('../model/user.model');
const Cart = require('../model/cart.model');
const Product = require('../model/products.model');
const Order = require('../model/orders.model');
const OrderDetail = require('../model/orderDetail.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
const Notification = require("../model/notification.model");
const { getTimeAgo } = require('../../util/formatTime.util');
dotenv.config();

function hashRefreshToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

class AuthController {
    
    /** [POST] /auth/register */
    async register(req, res, next) {
        try{
            console.log(req.body);
            const { frist, first, last, email, city, street, day, month, year, account, password, confirm, phone } = req.body;
            const firstName = (first || frist || "").trim();
            const lastName = (last || "").trim();
            const existingUser = await User.findOne({ $or: [{ email }, { account }] });
            if (existingUser) {
                return res.status(404).json({
                    message: "Account already exists. Please use a different email or username."
                });
            }
            if(!firstName || !lastName){
                return res.status(400).json({
                    message: "First name and last name are required"
                });
            }
            if(password !== confirm){
                return res.status(404).json({
                    message: "Password and confirm password do not match"
                });
            }
            const name = `${firstName} ${lastName}`;
            const y = parseInt(year, 10);
            const m = parseInt(month, 10) - 1; // Tháng trong JS bắt đầu từ 0
            const d = parseInt(day, 10);

            const birth = new Date(y, m, d);
            if (isNaN(birth.getTime())) {
                return res.status(400).json("Ngày sinh không hợp lệ");
            }
            const address = `${city}, ${street}`;

            const hashPassword = await bcrypt.hash(password, 10);

            const admin = await User.find({ authour: { $in: ['admin', 'employee'] } });
            await Promise.all(
                admin.map((a) =>
                    new Notification({
                        user_id: a._id,
                        type: "Thông báo khách hàng",
                        message: `Khách hàng mới vừa được thêm: ${name}-${account}.Hãy kiểm tra thông tin chi tiết và bắt đầu chăm sóc khách hàng này ngay nhé!`,
                        isRead: false,
                    }).save()
                )
            );

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
    async login(req, res) {
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
                        id: user._id.toString(),
                        author: user.authour,
                    },
                    process.env.JWT_ACCESS_KEY,
                    {expiresIn: "2h"}
                );
                const refreshToken = jwt.sign(
                    {
                        id: user._id.toString(),
                        author: user.authour,
                    },
                    process.env.JWT_REFRESH_KEY,
                    {expiresIn: "365d"} 
                );
                await User.updateOne(
                    { _id: user._id },
                    { lastLogin: new Date(), refreshTokenHash: hashRefreshToken(refreshToken) }
                );
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    path: "/" ,
                    sameSite: "strict",
                })
                const { password, ...userWithoutPassword } = user.toObject();
                const formatUser = {
                    ...userWithoutPassword,
                    format: importDate(user.birth)
                }
                const cart = await Cart.find({ userId: user._id });

                const productId = cart.flatMap(item => item.items.map(product => product.productId));

                const product = await Product.find({ _id: { $in: productId } });

                const orders = await Order.find({ user_id: user._id })
                .populate("discount_id")
                .sort({ createdAt: -1 });
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
                const notification = await Notification.find({user_id: user._id});
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

                const myNotifi = await Notification
                .find({user_id: user._id})
                .sort({createdAt: -1})
                .lean();
                const formatNotifi = myNotifi.map(item => ({
                    ...item,
                    timeAgo: getTimeAgo(item.createdAt)
                }))
                
                res.status(200).json({
                    orders: ordersWithDetails,
                    myNotifi: formatNotifi,
                    notification,
                    user: formatUser,
                    failedOrdersCount,
                    cart,
                    product,
                    message: "Login successful",
                    accessToken,
                })
            }
        }catch(error){
            console.error("🔥 Lỗi khi đăng nhập:", error); // In lỗi ra console
            res.status(500).json({message: error})
        }
    }

    /** [POST] /auth/login/admin */
    async loginAdmin(req, res) {
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
                return res.status(404).json({
                    message: "Incorrect password"
                })
            }
            if(user.authour === "customer") {
                return res.status(404).json({
                    message: "You're not authenticated"
                })
            }
            if(user && validedPass){
                const accessToken = jwt.sign(
                    {
                        id: user._id.toString(),
                        author: user.authour,
                    },
                    process.env.JWT_ACCESS_KEY,
                    {expiresIn: "2h"}
                );
                const refreshToken = jwt.sign(
                    {
                        id: user._id.toString(),
                        author: user.authour,
                    },
                    process.env.JWT_REFRESH_KEY,
                    {expiresIn: "365d"} 
                );
                await User.updateOne(
                    { _id: user._id },
                    { lastLogin: new Date(), refreshTokenHash: hashRefreshToken(refreshToken) }
                );
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    path: "/" ,
                    sameSite: "strict",
                })
                const { password, ...userWithoutPassword } = user.toObject();
                const formatUser = {
                    ...userWithoutPassword,
                    format: importDate(user.birth)
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
                const notification = await Notification.find({user_id: user._id});
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
                    notification,
                    user: formatUser,
                    orders: ordersWithDetails,
                    failedOrdersCount,
                    cart,
                    product,
                    message: "Login successful",
                    accessToken,
                })
            }
        }catch(error){
            console.error("🔥 Lỗi khi đăng nhập:", error); // In lỗi ra console
            res.status(500).json({message: error})
        }
    }

    /** [POST] /auth/refresh */
    async requestRefreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({ message: "You're not authenticated" });
            }
            let decoded;
            try {
                decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
            } catch (err) {
                return res.status(403).json({ message: "Refresh token is not valid" });
            }
            const userDoc = await User.findById(decoded.id);
            const incomingHash = hashRefreshToken(refreshToken);
            if (!userDoc || userDoc.refreshTokenHash !== incomingHash) {
                return res.status(403).json({ message: "Refresh token is not valid" });
            }
            const newAccessToken = jwt.sign(
                {
                    id: userDoc._id.toString(),
                    author: userDoc.authour,
                },
                process.env.JWT_ACCESS_KEY,
                { expiresIn: "2h" }
            );
            const newRefreshToken = jwt.sign(
                {
                    id: userDoc._id.toString(),
                    author: userDoc.authour,
                },
                process.env.JWT_REFRESH_KEY,
                { expiresIn: "365d" }
            );
            await User.updateOne(
                { _id: userDoc._id },
                { refreshTokenHash: hashRefreshToken(newRefreshToken) }
            );
            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: "/",
                sameSite: "strict",
            });
            res.status(200).json({
                accessToken: newAccessToken,
            });
        } catch (err) {
            res.status(500).json({ message: err.message || "Server error" });
        }
    }

    /** [POST] /auth/logout */
    async logout(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            res.clearCookie("refreshToken", {
                path: "/",
                sameSite: "strict",
            });
            if (refreshToken) {
                try {
                    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
                    await User.updateOne(
                        { _id: decoded.id },
                        { $set: { refreshTokenHash: null } }
                    );
                } catch {
                    /* token hết hạn / sai — bỏ qua */
                }
            }
            res.status(200).json({ message: "Logout successful" });
        } catch (err) {
            res.status(500).json({ message: err.message || "Server error" });
        }
    }

    /** [PUT] /auth/password/:id — cần Bearer token, chỉ đổi mật khẩu của chính user */
    async changePassword(req, res) {
        try{
            const {id} = req.params;
            if (!req.user || String(req.user.id) !== String(id)) {
                return res.status(403).json({
                    message: "Không được phép đổi mật khẩu tài khoản khác.",
                });
            }
            const {password, newPassword, confirmPassword} = req.body;
            const user = await User.findById(id);
            if(!user) {
                return res.status(404).json({
                    message: "Bạn chưa đăng nhập!"
                })
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    message: "Mật khẩu hiện tại không đúng!"
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    message: "Mật khẩu mới và xác nhận mật khẩu không khớp!"
                });
            }

            const isSamePassword = await bcrypt.compare(newPassword, user.password);
            if (isSamePassword) {
                return res.status(400).json({
                    message: "Mật khẩu mới không được giống mật khẩu cũ!"
                });
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            user.password = hashedPassword;
            await user.save();

            return res.status(200).json({
                message: "Đổi mật khẩu thành công!"
            });

        }catch(error) {
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
    }
}

module.exports = new AuthController();