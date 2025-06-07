const Article = require('../model/article.model');
const Banner = require('../model/banner.model');
const Product = require('../model/products.model');
const categoryProduct = require('../model/categoryProduct.model');
const Video = require('../model/video.model');
const { formatDate } = require('../../util/formatDate.util');
const moment = require('moment');
const dotenv = require("dotenv");
dotenv.config();
const qs = require('qs');
const crypto = require('crypto');


function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    
    // Lấy tất cả keys và sort theo alphabet
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    
    // Tạo object mới với keys đã được sort
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}
class SiteController{

    /** [GET] /gethome */
    getHome = async (req, res, next) => {
        try {
            const categories = [
                { name: "Linh kiện inox" },
                { name: "Linh kiện điện" },
                { name: "Tay vịn thang máy" },
                { name: "COP/LOP" }
            ];
    
            const categoryPromises = categories.map(async (category) => {
                const categoryData = await categoryProduct.findOne({ name: category.name });
                if (!categoryData) return { category: category.name, products: [] };
    
                const products = await Product.find({ category: categoryData._id }).limit(8);
                return { category: category.name, products };
            });
    
            const [products, article, banner] = await Promise.all([
                Promise.all(categoryPromises),
                Article.find().sort({ createdAt: -1 }).limit(2),
                Banner.find({status: "public"}).sort({ createdAt: -1 }).limit(3)
            ]);
    
            const video = await Video.find({}).sort({createdAt: -1}).limit(3);
            const formatVideo = video.map(vd => ({
                ...vd.toObject(),
                format: formatDate(vd.createdAt)
            }))
            const data = { 
                video: formatVideo,
                products, 
                article, 
                banner,
            };
    
            res.json({ data });
        } catch (err) {
            next(err);
        }
    };

    /** [GET] /search */
    async querySearch(req, res, next) {
        try {
            const { s } = req.query;
            const search = String(s || "").trim();
    
            // 1. Truy vấn lần đầu
            let [product, video, article] = await Promise.all([
                Product.find({ name: { $regex: search, $options: 'i' } }),
                Video.find({ name: { $regex: search, $options: 'i' } }),
                Article.find({ subject: { $regex: search, $options: 'i' } }),
            ]);
            const formatArticle = article.map(art => ({
                ...art.toObject(),
                dateFormat: formatDate(art.createdAt)
            }))
            res.status(200).json({
                product,
                video,
                article: formatArticle,
            });
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }
s
    /** [POST] /create-payment-url */
    async createPaymentUrl (req, res) {
        try{
            const { amount } = req.body;
            if (!amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin chuyển khoản'
                });
            }

            // Lấy địa chỉ IP của client
            let ipAddr = req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                (req.connection.socket ? req.connection.socket.remoteAddress : null);

            let date = new Date();
            let createDate = moment(date).format('YYYYMMDDHHmmss');
            let orderPayment = moment(date).format('DDHHmmss');
            const orderInfo = `Thanh toán đơn hàng ${orderPayment}`;
            const orderType = 'billpayment'; // Loại đơn hàng, có thể là 'topup', 'billpayment', 'shopping', 'other'
            // Cấu hình VNPay
            let vnp_Params = {};
            vnp_Params['vnp_Version'] = '2.1.0'; // Phiên bản API
            vnp_Params['vnp_Command'] = 'pay'; // Lệnh thanh toán
            vnp_Params['vnp_TmnCode'] = process.env.VNP_TMN_CODE; // Mã merchant
            vnp_Params['vnp_Locale'] = 'vn'; // Ngôn ngữ (vn/en)
            vnp_Params['vnp_CurrCode'] = 'VND'; // Đơn vị tiền tệ
            vnp_Params['vnp_TxnRef'] = orderPayment; // Mã giao dịch
            vnp_Params['vnp_OrderInfo'] = orderInfo; // Thông tin đơn hàng
            vnp_Params['vnp_OrderType'] = orderType; // Loại đơn hàng
            vnp_Params['vnp_Amount'] = amount * 100; // Số tiền (VNPay yêu cầu nhân 100)
            vnp_Params['vnp_ReturnUrl'] = process.env.VNP_RETURN_URL; // URL return
            vnp_Params['vnp_IpAddr'] = ipAddr; // IP address
            vnp_Params['vnp_CreateDate'] = createDate; // Thời gian tạo

            vnp_Params = sortObject(vnp_Params);

            // Tạo query string
            let querystring = qs.stringify(vnp_Params, { encode: false });

            // Tạo secure hash
            let hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
            let signed = hmac.update(Buffer.from(querystring, 'utf-8')).digest("hex");
            vnp_Params['vnp_SecureHash'] = signed;
            
            // Tạo URL thanh toán cuối cùng
            let paymentUrl = process.env.VNP_URL + '?' + qs.stringify(vnp_Params, { encode: false });

            res.status(200).json({
                success: true,
                paymentUrl: paymentUrl
            });

        }catch (error) {
            console.log(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    /** [GET] /check_payment*/
    async getVnPayCheckOut(req, res) {
        try{
            const url = req.originalUrl; // ví dụ: "/check_payment?...."
            const queryString = url.split('?')[1]; // lấy phần sau dấu '?'

            // Loại bỏ vnp_SecureHash và giá trị
            const signData = queryString
            .split('&')
            .filter(param => !param.startsWith('vnp_SecureHash='))
            .join('&');

            const vnp_SecureHash = req.query.vnp_SecureHash;

            const hmac = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET.trim());
            const checkSum = hmac.update(signData).digest('hex');

            if (checkSum === vnp_SecureHash) {
            if (req.query.vnp_ResponseCode === "00") {
                return res.status(200).json({ message: "Thanh toán thành công", data: req.query });
            } else {
                return res.status(404).json({ message: "Thanh toán thất bại", data: req.query });
            }
            } else {
                return res.status(404).json({ message: "Dữ liệu không hợp lệ" });
            }
        }catch (error) {
            console.log(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    /** [GET] vnpay/return */
    async getVnPayReturn(req, res) {
        try{
            let vnp_Params = req.query;
            let secureHash = vnp_Params['vnp_SecureHash'];

            // Xóa secure hash và hash type khỏi params để verify
            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            // Sắp xếp params
            vnp_Params = sortObject(vnp_Params);
            
            // Tạo query string để verify
            let querystring = qs.stringify(vnp_Params, { encode: false });
            
            // Tạo secure hash để so sánh
            let hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
            let signed = hmac.update(Buffer.from(querystring, 'utf-8')).digest("hex");

            if (secureHash === signed) {
                let responseCode = vnp_Params['vnp_ResponseCode'];
                if (responseCode === '00') {
                    res.redirect(`http://localhost:4000/payment-result?success=true&orderId=${vnp_Params['vnp_TxnRef']}&amount=${vnp_Params['vnp_Amount']}`);
                } else {
                    res.redirect(`http://localhost:4000/payment-result?success=false&message=Payment failed`);
                }
            } else {
                res.redirect(`http://localhost:4000/payment-result?success=false&message=Invalid signature`);
            }
        }catch (error) {
            console.log(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
}
module.exports = new SiteController();