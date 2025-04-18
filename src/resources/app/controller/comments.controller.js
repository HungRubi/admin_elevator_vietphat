const Comments = require('../model/comments.model');

class CommentController {
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
}

module.exports = new CommentController();