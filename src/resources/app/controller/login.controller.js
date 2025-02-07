const fs = require('fs');
const path = require('path');

const User = require('../model/user.model');

class LoginController{

    /** [GET] /login */
    index(req, res, next) {
        const loginContent = fs.readFileSync(
            path.join(__dirname, '../../views/account/login.hbs'), 
            'utf-8'
        );
        res.render('account/login',{
            login: loginContent,
            body:null
        });
    }

    /** [PUT] /login/store */
    login(req, res, next) {
        const { account, password } = req.body;
    
        User.findOne({ account, password })
        .then(user => {
            console.log('Kết quả từ MongoDB:', user);
            if (user) {
                req.session.user = user;
                req.session.save((err) => {
                    if (err) {
                        console.error('Lỗi khi lưu session:', err);
                        return next(err);
                    }
                    res.redirect('/'); 
                });
            } else {
                res.status(401).send('Tên đăng nhập hoặc mật khẩu không đúng');
            }
        })
        .catch(next);
    }

    /** [GET] /login/api/custumer/infor */
    getEmployee(req, res, next) {
        if (req.session.user) {
            res.json({
                success: true,
                user: req.session.user
            });
        } else {
            res.json({
                success: false,
                message: 'Người dùng chưa đăng nhập'
            });
        }
    }
}

module.exports = new LoginController();