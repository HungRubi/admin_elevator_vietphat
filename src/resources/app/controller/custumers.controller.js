const Custumer = require('../model/custumers.model');
const moment = require("moment");
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { mongooseToObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util')
class CustomersController {
    
    /* [GET] /custumers */
    index(req, res, next) {
        Custumer.find()
        .then(custumers => {
            const formatCustumer = custumers.map(cus => {
                return{
                    ...cus.toObject(),
                    formatedDate: formatDate(cus.lastLogin),
                    formatedBirth: formatDate(cus.birth)
                }
            })
            res.render('custumers/custumers', {
                custumers: formatCustumer,
            });
        })
    }

    /* [GET] /custumers/add */
    add(req, res, next) {
        res.render('custumers/addCustumer')
    }

    /** [POST] /custumers/store */
    store = async (req, res, next) => {
        try{
            const {
                account,
                password,
                avatar,
                name,
                address,
                phone,
                birth,
                email
            } = req.body;
    
            const custumer = new Custumer({
                account,
                password,
                avatar,
                name,
                address,
                phone,
                birth,
                email
            });
            await custumer.save();
            res.redirect('/custumers');
        }
        catch(error){
            next(error);
        }
    }
    
    /** [GET] /custumers/:id/edit */
    edit(req, res, next) {
        Custumer.findById(req.params.id)
            .then(custumers => {
                res.render('custumers/editCustumer',{
                    custumers: mongooseToObject(custumers),
                })
            })
    }

    /** [PUT] /custumers/:id */
    update(req, res, next) {
        Custumer.findById(req.params.id)
            .then(custumer => {
                if(!custumer){
                    return res.status(404).send('Custumer not found');
                }
                if (custumer.account === req.body.account) {
                    delete req.body.account;
                }
                return Custumer.updateOne({ _id: req.params.id }, req.body);
            })
            .then(() => {
                res.redirect('/custumers');
            })
            .catch(next);
    }

    /** [GET] /custumers/api/count-custumers */
    getCustomersLast7Days = async (req, res) => {
        try {
            // Lấy ngày hiện tại và tính ngày cách đây 7 ngày
            const sevenDaysAgo = moment().subtract(7, "days").startOf("day").toDate();
            const today = moment().endOf("day").toDate();
    
            // Aggregation pipeline
            const customers = await Custumer.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo, $lte: today } // Lọc khách hàng từ 7 ngày trước đến hôm nay
                    }
                },
                {
                    $group: {
                        _id: { 
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                            day: { $dayOfMonth: "$createdAt" }
                        },
                        count: { $sum: 1 } // Đếm số lượng khách hàng mỗi ngày
                    }
                },
                {
                    $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }// 1 tăng, -1 là giảm
                } 
            ]);
            res.json(customers);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lỗi server" });
        }
    }
}

module.exports = new CustomersController();