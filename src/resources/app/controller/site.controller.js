const Article = require('../model/article.model');
const Banner = require('../model/banner.model');
const Product = require('../model/products.model');
const categoryProduct = require('../model/categoryProduct.model');
const Video = require('../model/video.model');
const { formatDate } = require('../../util/formatDate.util');
const moment = require('moment');
const dotenv = require('dotenv');
dotenv.config();
const crypto = require('crypto');
const { parseListQuery } = require('../../util/listQuery.util');

const SEARCH_MIN_LENGTH = 2;
const VNP_AMOUNT_MIN = 1000;
const VNP_AMOUNT_MAX = 500000000;

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sortObject(obj) {
    const sorted = {};
    const str = [];

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();

    for (let i = 0; i < str.length; i++) {
        sorted[str[i]] = encodeURIComponent(obj[str[i]]).replace(/%20/g, '+');
    }
    return sorted;
}

function paymentRedirectBase() {
    const base = String(process.env.FRONTEND_URL || process.env.VNP_PAYMENT_REDIRECT_BASE || 'http://localhost:4000').replace(/\/$/, '');
    return base;
}

/** Giống qs.stringify(obj, { encode: false }) — tham số VNPay đã được encode trong sortObject */
function stringifyVnpParams(obj) {
    return Object.keys(obj)
        .map((k) => `${k}=${obj[k]}`)
        .join('&');
}

class SiteController {
    /** [GET] /home */
    getHome = async (req, res, next) => {
        try {
            const categories = [
                { name: 'Linh kiện inox' },
                { name: 'Linh kiện điện' },
                { name: 'Tay vịn thang máy' },
                { name: 'COP/LOP' },
            ];

            const categoryPromises = categories.map(async (category) => {
                const categoryData = await categoryProduct.findOne({ name: category.name });
                if (!categoryData) return { category: category.name, products: [] };

                const products = await Product.find({ category: categoryData._id }).limit(8).lean();
                return { category: category.name, products };
            });

            const [products, article, banner] = await Promise.all([
                Promise.all(categoryPromises),
                Article.find().sort({ createdAt: -1 }).limit(2).lean(),
                Banner.find({ status: 'public' }).sort({ createdAt: -1 }).limit(3).lean(),
            ]);

            const video = await Video.find({}).sort({ createdAt: -1 }).limit(3).lean();
            const formatVideo = video.map((vd) => ({
                ...vd,
                format: formatDate(vd.createdAt),
            }));
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

    /** [GET] /timkiem — s | timkiem | q, listQuery (page/offset, limit, sort, order), legacy site= */
    async querySearch(req, res, next) {
        try {
            const term = String(req.query.s || req.query.timkiem || req.query.q || '').trim();
            if (term.length < SEARCH_MIN_LENGTH) {
                return res.status(200).json({
                    product: [],
                    video: [],
                    article: [],
                    totals: { product: 0, video: 0, article: 0 },
                    page: 1,
                    limit: parseListQuery(req.query, {
                        allowedSortFields: ['createdAt'],
                        defaultSortField: 'createdAt',
                        defaultOrder: 'desc',
                        defaultLimit: 20,
                    }).limit,
                    offset: 0,
                    message: `Nhập tối thiểu ${SEARCH_MIN_LENGTH} ký tự để tìm.`,
                });
            }

            const list = parseListQuery(req.query, {
                allowedSortFields: ['createdAt'],
                defaultSortField: 'createdAt',
                defaultOrder: 'desc',
                defaultLimit: 20,
            });

            const regex = new RegExp(escapeRegex(term), 'i');
            const filterProduct = { name: { $regex: regex } };
            const filterVideo = { name: { $regex: regex } };
            const filterArticle = { subject: { $regex: regex } };

            const [
                product,
                video,
                article,
                totalProduct,
                totalVideo,
                totalArticle,
            ] = await Promise.all([
                Product.find(filterProduct)
                    .sort(list.sort)
                    .skip(list.skip)
                    .limit(list.limit)
                    .lean(),
                Video.find(filterVideo).sort(list.sort).skip(list.skip).limit(list.limit).lean(),
                Article.find(filterArticle)
                    .sort(list.sort)
                    .skip(list.skip)
                    .limit(list.limit)
                    .lean(),
                Product.countDocuments(filterProduct),
                Video.countDocuments(filterVideo),
                Article.countDocuments(filterArticle),
            ]);

            const formatArticle = article.map((art) => ({
                ...art,
                dateFormat: formatDate(art.createdAt),
            }));

            res.status(200).json({
                product,
                video,
                article: formatArticle,
                totals: {
                    product: totalProduct,
                    video: totalVideo,
                    article: totalArticle,
                },
                page: list.page,
                limit: list.limit,
                offset: list.skip,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server vui lòng thử lại sau' });
        }
    }

    /** [POST] /create-payment-url — không ghi DB; giới hạn số tiền + rate limit */
    async createPaymentUrl(req, res) {
        try {
            const amountRaw = req.body?.amount;
            const amount = Number(amountRaw);
            if (
                amountRaw === undefined ||
                amountRaw === null ||
                !Number.isFinite(amount) ||
                amount < VNP_AMOUNT_MIN ||
                amount > VNP_AMOUNT_MAX
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Số tiền không hợp lệ (VND: ${VNP_AMOUNT_MIN}–${VNP_AMOUNT_MAX})`,
                });
            }

            const tmn = process.env.VNP_TMN_CODE;
            const secret = process.env.VNP_HASH_SECRET;
            const vnpUrl = process.env.VNP_URL;
            if (!tmn || !secret || !vnpUrl) {
                console.error('Thiếu cấu hình VNPay (VNP_TMN_CODE / VNP_HASH_SECRET / VNP_URL)');
                return res.status(503).json({
                    success: false,
                    message: 'Cổng thanh toán chưa được cấu hình',
                });
            }

            let ipAddr =
                req.headers['x-forwarded-for'] ||
                req.connection?.remoteAddress ||
                req.socket?.remoteAddress ||
                (req.connection?.socket ? req.connection.socket.remoteAddress : null);
            if (typeof ipAddr === 'string' && ipAddr.includes(',')) {
                ipAddr = ipAddr.split(',')[0].trim();
            }

            const date = new Date();
            const createDate = moment(date).format('YYYYMMDDHHmmss');
            const orderPayment = moment(date).format('DDHHmmss');
            const orderInfo = `Thanh toán đơn hàng ${orderPayment}`;
            const orderType = 'billpayment';
            let vnp_Params = {};
            vnp_Params.vnp_Version = '2.1.0';
            vnp_Params.vnp_Command = 'pay';
            vnp_Params.vnp_TmnCode = tmn;
            vnp_Params.vnp_Locale = 'vn';
            vnp_Params.vnp_CurrCode = 'VND';
            vnp_Params.vnp_TxnRef = orderPayment;
            vnp_Params.vnp_OrderInfo = orderInfo;
            vnp_Params.vnp_OrderType = orderType;
            vnp_Params.vnp_Amount = Math.round(amount) * 100;
            vnp_Params.vnp_ReturnUrl = process.env.VNP_RETURN_URL;
            vnp_Params.vnp_IpAddr = ipAddr || '127.0.0.1';
            vnp_Params.vnp_CreateDate = createDate;

            if (!vnp_Params.vnp_ReturnUrl) {
                return res.status(503).json({
                    success: false,
                    message: 'Thiếu VNP_RETURN_URL',
                });
            }

            vnp_Params = sortObject(vnp_Params);

            let querystring = stringifyVnpParams(vnp_Params);

            const hmac = crypto.createHmac('sha512', String(secret).trim());
            const signed = hmac.update(Buffer.from(querystring, 'utf-8')).digest('hex');
            vnp_Params.vnp_SecureHash = signed;

            const paymentUrl = `${vnpUrl}?${stringifyVnpParams(vnp_Params)}`;

            res.status(200).json({
                success: true,
                paymentUrl,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    /** [GET] /check_payment */
    async getVnPayCheckOut(req, res) {
        try {
            const secret = process.env.VNP_HASH_SECRET;
            if (!secret) {
                return res.status(503).json({ message: 'Cổng thanh toán chưa được cấu hình' });
            }

            const url = req.originalUrl || '';
            const qIdx = url.indexOf('?');
            if (qIdx === -1) {
                return res.status(400).json({ message: 'Thiếu tham số thanh toán' });
            }
            const queryString = url.slice(qIdx + 1);

            const signData = queryString
                .split('&')
                .filter((param) => !param.startsWith('vnp_SecureHash='))
                .join('&');

            const vnp_SecureHash = req.query.vnp_SecureHash;
            if (!vnp_SecureHash || typeof vnp_SecureHash !== 'string') {
                return res.status(400).json({ message: 'Thiếu chữ ký giao dịch' });
            }

            const hmac = crypto.createHmac('sha512', String(secret).trim());
            const checkSum = hmac.update(signData).digest('hex');

            if (checkSum !== vnp_SecureHash) {
                return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
            }

            if (req.query.vnp_ResponseCode === '00') {
                return res.status(200).json({ message: 'Thanh toán thành công', data: req.query });
            }
            return res.status(200).json({ message: 'Thanh toán thất bại', data: req.query });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    /** [GET] /vnpay/return */
    async getVnPayReturn(req, res) {
        try {
            const secret = process.env.VNP_HASH_SECRET;
            if (!secret) {
                const base = paymentRedirectBase();
                return res.redirect(`${base}/payment-result?success=false&message=config`);
            }

            let vnp_Params = { ...req.query };
            const secureHash = vnp_Params.vnp_SecureHash;

            delete vnp_Params.vnp_SecureHash;
            delete vnp_Params.vnp_SecureHashType;

            vnp_Params = sortObject(vnp_Params);

            const querystring = stringifyVnpParams(vnp_Params);

            const hmac = crypto.createHmac('sha512', String(secret).trim());
            const signed = hmac.update(Buffer.from(querystring, 'utf-8')).digest('hex');

            const base = paymentRedirectBase();

            if (secureHash === signed) {
                const responseCode = vnp_Params.vnp_ResponseCode;
                if (responseCode === '00') {
                    return res.redirect(
                        `${base}/payment-result?success=true&orderId=${encodeURIComponent(
                            vnp_Params.vnp_TxnRef || ''
                        )}&amount=${encodeURIComponent(vnp_Params.vnp_Amount || '')}`
                    );
                }
                return res.redirect(`${base}/payment-result?success=false&message=Payment%20failed`);
            }
            return res.redirect(`${base}/payment-result?success=false&message=Invalid%20signature`);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

module.exports = new SiteController();
