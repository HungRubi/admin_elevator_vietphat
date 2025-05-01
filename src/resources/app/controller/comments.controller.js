const { formatDate } = require('../../util/formatDate.util');
const Comments = require('../model/comments.model');

class CommentController {

    /** GET /comment/all */
    async getComment (req, res) {
        let sortField = req.query.sort || 'createdAt'; 
        let sortOrder = req.query.comment === 'desc' ? 1 : -1;
        try{
            const searchQuery = req.query.timkiem?.trim() || '';
            if(searchQuery){
                const comment = await Comments.find()
                .populate({
                    path: 'product_id',
                    match: { name: { $regex: searchQuery, $options: 'i' } },
                    populate: {
                        path: 'category',
                        model: 'categoryProduct'
                    }
                })
                .populate('user_id')
                .sort({ [sortField]: sortOrder })
                .lean()
                const formatComment = comment.map(item => ({
                    ...item,
                    formatDate: formatDate(item.createdAt)
                }))
                return res.status(200).json({
                    searchType: true,
                    searchComment: formatComment,
                    currentSort: sortField,
                    currentOrder: sortOrder === 1 ? 'asc' : 'desc',
                })
            }
            const comment = await Comments.find()
            .populate({
                path: 'product_id',
                populate: {
                    path: 'category',
                    model: 'categoryProduct'
                }
            })
            .populate('user_id')
            .sort({ [sortField]: sortOrder })
            .lean();
            const formatComment = comment.map(item => ({
                ...item,
                formatDate: formatDate(item.createdAt)
            }))
            const totalBanner = await Comments.countDocuments();
            const totalPage = Math.ceil(totalBanner / 10)
            res.status(200).json({
                comment: formatComment,
                totalPage,
                searchType: false,
                currentSort: sortField,
                currentOrder: sortOrder === 1 ? 'asc' : 'desc'
            })
        }catch(error){
            console.log(error)
            res.status(500).json({
                message: 'Lỗi rồi: ' + error,
            })
        }
    }

    async addComment (req, res) {
        try{
            const {
                user_id,
                product_id,
                star,quality,
                isAccurate,
                message,
                img,
                video,
            } = req.body
            const comment = new Comments({
                user_id,
                product_id,
                star,quality,
                isAccurate,
                message,
                img,
                video,
            })
            await comment.save();
            res.status(200).json({
                message: 'Đánh giá thành công, cảm ơn quý khách!'
            })
        }catch(error){
            console.log(error)
            res.status(500).json({
                message: 'Lỗi rồi: ' + error,
            })
        }
    }

    async filterComment(req, res) {
        try{
            console.log(req.query)
            const {star, endDate, startDate} = req.query;
            let query = {}
            if(star) {
                query.star = star;
            }
            if(startDate && endDate) {
                query.created = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
            const comment = await Comments.find(query)
            .populate({
                path: 'product_id',
                populate: {
                    path: 'category',
                    model: 'categoryProduct'
                }
            })
            .populate('user_id')
            .lean();
            const formatComment = comment.map(item => ({
                ...item,
                formatDate: formatDate(item.createdAt)
            }))
            res.status(200).json({
                comment: formatComment
            })
        }catch(error){
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng quay lại sau :(("
            })
        }
    }
}

module.exports = new CommentController();