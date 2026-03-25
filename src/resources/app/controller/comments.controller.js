const mongoose = require('mongoose');
const { formatDate } = require('../../util/formatDate.util');
const { parseListQuery } = require('../../util/listQuery.util');
const Comments = require('../model/comments.model');
const Product = require('../model/products.model');
const { saveBase64Image } = require('../../util/convertBase64');

const SORT_COMMENT = ['createdAt', 'updatedAt', 'star', 'quality', 'message'];

function assertCommentAuthor(req, bodyUserId) {
    if (!req.user || String(req.user.id) !== String(bodyUserId)) {
        return {
            ok: false,
            status: 403,
            message: 'Chỉ được gửi đánh giá với tài khoản đang đăng nhập.',
        };
    }
    return { ok: true };
}

function normalizeProductIds(product_id) {
    if (product_id == null) return [];
    return Array.isArray(product_id) ? product_id : [product_id];
}

class CommentController {
    /** GET /comment/all — staff */
    async getComment(req, res) {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                req.query,
                {
                    allowedSortFields: SORT_COMMENT,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            let filter = {};
            if (search) {
                const products = await Product.find({
                    name: { $regex: search, $options: 'i' },
                })
                    .select('_id')
                    .lean();
                const idList = products.map((p) => p._id);
                if (idList.length === 0) {
                    return res.status(200).json({
                        comment: [],
                        searchType: true,
                        searchComment: [],
                        total: 0,
                        totalPage: 1,
                        page,
                        limit,
                        offset: skip,
                        currentSort: sortField,
                        currentOrder: orderLabel,
                    });
                }
                filter = { product_id: { $in: idList } };
            }

            const populateProduct = {
                path: 'product_id',
                populate: {
                    path: 'category',
                    model: 'categoryProduct',
                },
            };

            const [rows, total] = await Promise.all([
                Comments.find(filter)
                    .populate(populateProduct)
                    .populate('user_id')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Comments.countDocuments(filter),
            ]);

            const formatComment = rows.map((item) => ({
                ...item,
                formatDate: formatDate(item.createdAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));

            return res.status(200).json({
                comment: formatComment,
                searchType: Boolean(search),
                searchComment: search ? formatComment : undefined,
                total,
                totalPage,
                page,
                limit,
                offset: skip,
                currentSort: sortField,
                currentOrder: orderLabel,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi tải đánh giá',
            });
        }
    }

    /** POST /comment/add — customer (verifyToken), chỉ user_id khớp JWT */
    async addComment(req, res) {
        try {
            const {
                user_id,
                product_id,
                star,
                quality,
                isAccurate,
                message,
                img,
                video,
            } = req.body;

            const ownerCheck = assertCommentAuthor(req, user_id);
            if (!ownerCheck.ok) {
                return res.status(ownerCheck.status).json({ message: ownerCheck.message });
            }

            if (!mongoose.isValidObjectId(user_id)) {
                return res.status(400).json({ message: 'user_id không hợp lệ' });
            }

            const pids = normalizeProductIds(product_id).filter((id) =>
                mongoose.isValidObjectId(id)
            );
            if (pids.length === 0) {
                return res.status(400).json({ message: 'product_id không hợp lệ' });
            }

            const uniquePids = [...new Set(pids.map((id) => String(id)))].map(
                (id) => new mongoose.Types.ObjectId(id)
            );

            const starNum = Number(star);
            if (!Number.isFinite(starNum) || starNum < 1 || starNum > 5) {
                return res.status(400).json({ message: 'star phải từ 1 đến 5' });
            }

            const productCount = await Product.countDocuments({ _id: { $in: uniquePids } });
            if (productCount !== uniquePids.length) {
                return res.status(404).json({ message: 'Một hoặc nhiều sản phẩm không tồn tại' });
            }

            const comment = new Comments({
                user_id,
                product_id: uniquePids,
                star: starNum,
                quality,
                isAccurate,
                message,
                video,
            });

            const imgArr = Array.isArray(img) ? img : img != null ? [img] : [];

            if (imgArr.length > 0 && imgArr[0] && String(imgArr[0]).startsWith('data:image')) {
                const savedPath = saveBase64Image(imgArr[0], 'img');
                if (!savedPath) {
                    return res.status(400).json({ message: 'Ảnh img không hợp lệ!' });
                }
                comment.img = savedPath;
            }
            if (imgArr.length > 1 && imgArr[1] && String(imgArr[1]).startsWith('data:image')) {
                const savedPath = saveBase64Image(imgArr[1], 'img');
                if (!savedPath) {
                    return res.status(400).json({ message: 'Ảnh img không hợp lệ!' });
                }
                comment.img_1 = savedPath;
            }
            if (imgArr.length > 2 && imgArr[2] && String(imgArr[2]).startsWith('data:image')) {
                const savedPath = saveBase64Image(imgArr[2], 'img');
                if (!savedPath) {
                    return res.status(400).json({ message: 'Ảnh img không hợp lệ!' });
                }
                comment.img_2 = savedPath;
            }

            await comment.save();
            res.status(200).json({
                message: 'Đánh giá thành công, cảm ơn quý khách!',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi gửi đánh giá',
            });
        }
    }

    /** GET /comment/filter — staff */
    async filterComment(req, res) {
        try {
            const { star, endDate, startDate, timkiem, q } = req.query;
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                { ...req.query, timkiem: timkiem || q },
                {
                    allowedSortFields: SORT_COMMENT,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            const query = {};
            if (star !== undefined && star !== '') {
                const s = Number(star);
                if (Number.isFinite(s)) {
                    query.star = s;
                }
            }
            if (startDate && endDate) {
                query.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            }
            if (search) {
                query.message = { $regex: search, $options: 'i' };
            }

            const populateProduct = {
                path: 'product_id',
                populate: {
                    path: 'category',
                    model: 'categoryProduct',
                },
            };

            const [comment, total] = await Promise.all([
                Comments.find(query)
                    .populate(populateProduct)
                    .populate('user_id')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Comments.countDocuments(query),
            ]);

            const formatComment = comment.map((item) => ({
                ...item,
                formatDate: formatDate(item.createdAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                comment: formatComment,
                total,
                totalPage,
                page,
                limit,
                offset: skip,
                currentSort: sortField,
                currentOrder: orderLabel,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng quay lại sau :((',
            });
        }
    }
}

module.exports = new CommentController();
