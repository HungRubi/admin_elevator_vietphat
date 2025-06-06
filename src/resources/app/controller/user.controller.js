const User = require('../model/user.model');
const Orders = require('../model/orders.model');
const OrderDetail = require('../model/orderDetail.model');
const { formatDate } = require('../../util/formatDate.util')
const { importDate } = require('../../util/importDate.util');

const Product = require('../model/products.model');
const Cart = require('../model/cart.model');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
class UserController {
    
    /** [GET] /api/user */
    async getUser(req, res, next) {
        let sortField = req.query.sort || 'name'; 
        let sortOrder = req.query.order === 'desc' ? -1 : 1;
        try{
            const searchQuery = req.query.timkiem?.trim() || '';
            if(searchQuery){
                const users = await User.find({
                        name: { $regex: searchQuery, $options: 'i' }
                }).sort({ [sortField]: sortOrder }).lean();
                const userFormart = users.map(user => ({
                    ...user,
                    birthFormat: formatDate(user.birth),
                    lastLoginFormat: formatDate(user.lastLogin),
                }));
                const data = {
                    searchType: true,
                    searchUser: userFormart,
                    currentSort: sortField,
                    currentOrder: sortOrder === 1 ? 'asc' : 'desc',
                }
                return res.status(200).json({data})

            }
            const users = await User.find()
                .sort({ [sortField]: sortOrder }) // Sắp xếp sản phẩm
                .lean();
    
            const formatUser = users.map(user => ({
                ...user,
                birthFormat: formatDate(user.birth),
                lastLoginFormat: formatDate(user.lastLogin),
            }));
    
            const totalUser = await User.countDocuments();
            const totalPage = Math.ceil(totalUser / 10);
            const data = {
                formatUser,
                totalUser: totalUser,
                totalPage,
                searchType: false,
                currentSort: sortField,
                currentOrder: sortOrder === 1 ? 'asc' : 'desc'
            }
            return res.status(200).json({data});
        }catch(err){
            next(err)
        }
    }
    
    /** [GET] /api/user/:id */
    async getUserDetail(req, res, next) {
        try{
            const user = await User.findById(req.params.id)
        
            const formatBirth = {
                    ...user.toObject(),
                    birthFormated: importDate(user.birth)
            }
            const data = {
                user: formatBirth
            }
            res.status(200).json({data})
        }
        catch(err){
            res.status(500).json({message: err})
        }
    }

    /** [PUT] /user/update/address/:id */
    async updateAddress(req, res, next) {
        const userId = req.params.id; // hoặc req.body.id nếu bạn truyền từ body
        try {
            const updatedUser = await User.findByIdAndUpdate(
            userId,
                { $set: req.body },
                { new: true } 
            );

            res.status(200).json({
                updatedUser,
                message: 'Cập nhật địa chỉ thành công',
            });
        } catch (err) {
            res.status(500).json({ message: 'Lỗi khi cập nhật địa chỉ', error: err });
        }
    }

    /** [GET] /user/order/:id */
    async getOrder(req, res) {
        try{
            const userId = req.params.id;
            const orders = await Orders.find({ user_id: userId });
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
                order: ordersWithDetails
            })
        }catch(error){
            console.log(error);
            res.status(500).json({
                message: error
            })
        }
    }

    /** [POST] /user/store */
    async store (req, res) {
        try{
            console.log(req.body)
            const {name, email, phone, address, birth, account, avatar, password, comfirm_password, authour} = req.body;
            const existingEmail = await User.findOne({email: email});
            if (existingEmail) {
                return res.status(400).json({
                    message: "Email đã được đăng ký rồi"
                });
            }
            const existingAccount = await User.findOne({account: account});
            if (existingAccount) {
                return res.status(400).json({
                    message: "Tài khoản đã được đăng ký rồi"
                });
            }
            if(password !== comfirm_password) {
                return res.status(400).json({
                    message: "Mật khẩu không trùng nhau"
                })
            }
            const finalAvatar = avatar === ''
            ? 'https://www.dropbox.com/scl/fi/896n7adhufqiu2hlt94u5/default.png?rlkey=gk9thmq6u1grzss8o0c3os39f&st=83b9myer&dl=1'
            : avatar;
            const hashPassword = await bcrypt.hash(password, 10);
            const user = new User({
                name, email, phone, address, birth, account, avatar: finalAvatar, password: hashPassword, authour
            })
            await user.save();
            res.status(200).json({
                message: "Thêm user thành công"
            })
        }catch(error) {
            console.log(error);
            res.status(404).json({
                message: error
            })
        }
    }

    /** [GET] /user/filter */
    async filterUser(req, res) {
        try{
            console.log(req.query);
            const {authour, start_date, end_date} = req.query;
            let query = {};
            if(authour){
                query.authour = authour
            }
            if (start_date && end_date) {
                query.createdAt = {
                    $gte: new Date(start_date),
                    $lte: new Date(end_date),
                };
            }
            const user = await User.find(query)
            const formatUser = user.map(u => {
                return {
                    ...u.toObject(),
                    birthFormat: formatDate(u.birth),
                    lastLoginFormat: formatDate(u.lastLogin),
                }
            })
            const totalPage = Math.ceil(user.length / 10);
            res.status(200).json({
                formatUser,
                totalPage
            })
        }catch(error){
            console.log(error);
            res.status(404).json({
                message: "Lỗi server hãy thử lại sau :(("
            })
        }
    }

    /** [DELETE] /user/:id */
    async destroy(req, res) {
        try{
            const userId = req.params.id;
            await User.deleteOne({_id: userId});
            await Cart.deleteOne({userId: userId});
            res.status(200).json({
                message: "Xóa người dùng thành công",
            })
        }catch(error){
            console.log(error)
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
    }

    /** [GET] /user/new */
    async getNewUser(req, res) {
        try {
            const { startDate, endDate, days = 7 } = req.query;
            
            let start, end;
            
            if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);
            } else {
                // Mặc định lấy 7 ngày gần nhất
                end = new Date();
                start = new Date();
                start.setDate(end.getDate() - (days - 1));
            }
            
            // Set time to start and end of day
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            
            // Aggregate để đếm số khách hàng mới mỗi ngày
            const customerStats = await User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end },
                        authour: 'customer' // Chỉ lấy khách hàng
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' }
                        },
                        customers: { $sum: 1 },
                        date: { $first: '$createdAt' }
                    }
                },
                {
                    $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
                }
            ]);
            
            // Tính tổng số khách hàng để tính trung bình
            const totalCustomers = customerStats.reduce((sum, stat) => sum + stat.customers, 0);
            const average = Math.round(totalCustomers / days);
            
            // Format dữ liệu để phù hợp với frontend
            const formattedData = [];
            const currentDate = new Date(start);
            
            for (let i = 0; i < days; i++) {
                const dateStr = formatDate(currentDate);
                const existingStat = customerStats.find(stat => {
                    const statDate = new Date(stat.date);
                    return statDate.toDateString() === currentDate.toDateString();
                });
                
                formattedData.push({
                    day: dateStr,
                    customers: existingStat ? existingStat.customers : 0,
                    average: average
                });
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Tính tổng khách hàng trong khoảng thời gian
            const totalNewCustomers = formattedData.reduce((sum, data) => sum + data.customers, 0);
            
            // Tính phần trăm tăng trưởng (so với kỳ trước)
            const previousPeriodStart = new Date(start);
            previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
            const previousPeriodEnd = new Date(start);
            previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
            
            const previousCustomers = await User.countDocuments({
                createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
                authour: 'customer'
            });
            
            const growthPercentage = previousCustomers > 0 
                ? ((totalNewCustomers - previousCustomers) / previousCustomers * 100).toFixed(1)
                : 100;
            
            res.status(200).json({
                success: true,
                chartData: formattedData,
                summary: {
                    totalNewCustomers,
                    growthPercentage: growthPercentage,
                    startDate: formatDate(start),
                    endDate: formatDate(end),
                    averagePerDay: average
                }
            });
            
        } catch (error) {
            console.error('Error fetching customer analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thống kê khách hàng',
                error: error.message
            });
        }
    }

    /** [PUT] /user/profile/update/:id */
    async updateProfileUser(req, res) {
        try{
            const user_id = req.params.id;
            const { name, email, phone, birth, avatar } = req.body;
            const user = await User.findById(user_id);
            if(!user) {
                return res.status(404).json({
                    message: "Bạn chưa đăng nhập!"
                })
            }
            let avatarPath = null;

            if (avatar && avatar.startsWith('data:image')) {
                const matches = avatar.match(/^data:(image\/\w+);base64,(.+)$/);
                if (!matches || matches.length !== 3) {
                    return res.status(400).json({ message: 'Ảnh không hợp lệ!' });
                }

                const imageBuffer = Buffer.from(matches[2], 'base64');
                const imageType = matches[1].split('/')[1]; // jpg, png, etc.
                const fileName = `avatar_${Date.now()}.${imageType}`;
                const savePath = path.join(process.cwd(), 'uploads', fileName);

                if (!fs.existsSync(path.join(process.cwd(), 'uploads'))) {
                    fs.mkdirSync(path.join(process.cwd(), 'uploads'));
                }

                fs.writeFileSync(savePath, imageBuffer);
                avatarPath = `/uploads/${fileName}`; 
                user.avatar = avatarPath;
            }
            user.birth = birth,
            user.name = name,
            user.email = email,
            user.phone = phone,
            await user.save();
            res.status(200).json({
                user, 
                message: "Cập nhật hồ sơ thành công"
            });
        }catch(error) {
            console.log(error)
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
    }
}

module.exports = new UserController();