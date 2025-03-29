const { formatDate } = require('../../util/formatDate.util');
const Notification = require('../model/notification.model');

class NotificationController {

    /** [GET] /notification */
    async getNotification(req, res, next) {
        try{
            const notifications = await Notification.find().sort({created: -1});
            const format = notifications.map(item => ({
                ...item.toObject(),
                lastUpdate: formatDate(item.createdAt)
            }))
            res.status(200).json({
                message: "Thành công",
                notifications: format,
            })
        }catch(err){
            res.status(500).json(err);
        }
    }

    async addNotification(req, res) {
        try{
            const {type, message, relatedId} = req.body;
            if (!type || !message) {
                return res.status(400).json({ error: 'Loại thông báo và nội dung thông báo là bắt buộc!' });
            }
    
            const notification = new Notification({
                type,
                message,
                relatedId: relatedId || null,
                typeRef: type === 'Thông báo đơn hàng' ? 'Order' : type === 'Thông báo khách hàng' ? 'User' : null
            });
            await notification.save();
            res.status(200).json({
                message:"Thành công",
                notification
            })
        }catch(error){
            console.error("🔥 Lỗi khi thêm thông báo:", error); // In lỗi ra console
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new NotificationController();