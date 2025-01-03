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
 
}

module.exports = new CustomersController();