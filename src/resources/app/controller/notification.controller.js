const { formatDate } = require('../../util/formatDate.util');
const Notification = require('../model/notification.model');

class NotificationController {

    /** [GET] /notification */
    async getNotification(req, res) {
        let sortField = req.query.sort || 'createdAt'; 
        let sortNotification = req.query.notification === 'desc' ? 1 : -1;
        try{
            const searchQuery = req.query.timkiem?.trim() || "";
            if(searchQuery) {
                const notifications = await Notification
                .find()
                .sort({ [sortField]: sortNotification })
                .populate({
                    path: "user_id",
                    match: {name: { $regex: searchQuery, $options: 'i' }}
                })
                .lean();
                const format = notifications.map(item => ({
                    ...item,
                    lastUpdate: formatDate(item.createdAt)
                }))
                res.status(200).json({
                    searchType: true,
                    searchNotification: format,
                    currentSort: sortField,
                    currentNotifition: sortNotification === 1 ? 'asc' : 'desc'
                })
            }
            const notifications = await Notification
            .find()
            .sort({ [sortField]: sortNotification })
            .populate("user_id")
            .lean();
            const format = notifications.map(item => ({
                ...item,
                lastUpdate: formatDate(item.createdAt)
            }))
            const totalNotification = await Notification.countDocuments();
            const totalPage = Math.ceil(totalNotification / 10);
            res.status(200).json({
                notifications: format,
                totalPage,
                currentSort: sortField,
                sortNotification: sortNotification === 1 ? 'asc' : 'desc'
            })
        }catch(err){
            console.log(err)
            res.status(500).json({
                message: "Lỗi server: " + err
            });
        }
    }

    /** [POST] /notification/add */
    async addNotification(req, res) {
        try{
            const {type, message, user_id} = req.body;
            if(user_id) {
                const notification = new Notification({
                    type,
                    message,
                    user_id
                })
                await notification.save();
            }
            const notification = new Notification({
                type,
                message,
            })
            await notification.save();
            res.status(200).json({
                message: "Thêm thông báo thành công",
            })
        }catch(error){
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
    }

    /** [GET] /notification/:id */
    async editNotification(req,res){
        try {
            const notificationId = req.params.id;
            const notifi = await Notification.findById(notificationId);
            if(!notifi) {
                return res.status(500).json({
                    message: "Thông báo không tồn tại"
                })
            }
            return res.status(200).json({
                notification: notifi
            })
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
    }

    /** [UPDATE] /notification/:id */
    async updateNotification(req,res){
        try {
            const notificationId = req.params.id;
            const notifi = await Notification.findById(notificationId);
            if(!notifi) {
                return res.status(500).json({
                    message: "Thông báo không tồn tại"
                })
            }
            await Notification.updateOne({_id: notificationId})
            return res.status(200).json({
                message: "Cập nhật thông báo thành công"
            })
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
    }

    /** [DELETE] /notification/:id */
    async deleteNotification(req,res){
        try {
            const notificationId = req.params.id;
            const notifi = await Notification.findById(notificationId);
            if(!notifi) {
                return res.status(500).json({
                    message: "Thông báo không tồn tại"
                })
            }
            await Notification.deleteOne({_id: notificationId})
            return res.status(200).json({
                message: "Xóa thông báo thành công"
            })
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
    }
}

module.exports = new NotificationController();