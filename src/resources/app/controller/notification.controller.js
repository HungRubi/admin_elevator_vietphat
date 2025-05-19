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
}

module.exports = new NotificationController();