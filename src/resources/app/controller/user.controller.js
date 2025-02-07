const User = require('../model/user.model');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util')
const { mongooseToObject } = require('../../util/mongoose.util')
const { importDate } = require('../../util/importDate.util'); 
class UserController {
    
    /** [GET] /users */
    index(req, res, next) {
        User.find()
        .then(user => {
            const formatUser = user.map(u => {
                return{
                    ...u.toObject(),
                    formatedDate: formatDate(u.lastLogin),
                    formatedBirth: formatDate(u.birth),
                }
            })
            res.render('user/user', {
                user: formatUser,
            });
        })
    }
 
    /** [GET] /users/add */
    add(req, res, next){
        res.render('user/addUser');
    }

    /** [POST] /users/store */
    store = async(req, res, next) => {
        try{
            const {
                account,
                password,
                avatar,
                name,
                address,
                phone,
                email,
                birth,
                authour
            } = req.body;
            const user = new User({
                account,
                password,
                avatar,
                name,
                address,
                phone,
                email,
                birth,
                authour
            })
            await user.save();
            res.redirect('/users');
        }catch(error){
            next(error);
        }
    }

    /** [GET] /users/:id/edit */
    edit(req, res, next) {
        User.findById(req.params.id)
        .then(user => {
            const formatBirth = {
                    ...user.toObject(),
                    birthFormated: importDate(user.birth)
                
            }
            res.render('user/editUser', {
                user: formatBirth
            })
        })
    }

    /** [PUT] /users/:id */
    update(req, res, next) {
        User.findById(req.params.id)
            .then(user => {
                if (!user) {
                    return res.status(404).send('users not found');
                }
                if (user.account === req.body.account) {
                    delete req.body.account;
                }
                return user.updateOne({ _id: req.params.id }, req.body);
            })
            .then(() => {
                res.redirect('/users')
            })
            .catch(next)
    }

    /** [DELETE] /users/:id */
    delete(req, res, next) {
        User.deleteOne({_id: req.params.id})
        .then(() => {
            res.redirect('back');
        })
        .catch(error => {
            next(error);
        });
    }
}

module.exports = new UserController();