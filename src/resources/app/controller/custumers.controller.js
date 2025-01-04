const Custumer = require('../model/custumers.model');
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

    /* [GET] /custumer/add */
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

    /** [PUT] /custumer/:id */
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
}

module.exports = new CustomersController();