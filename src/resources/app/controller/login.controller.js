const fs = require('fs');
const path = require('path');

const {importDate} = require('../../util/importDate.util');
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
                const date = importDate(user.birth);
                user.birth = date;
                if(user.authour === 'admin' || user.authour === 'employee'){
                    req.session.user = user;
                    req.session.save((err) => {
                        if (err) {
                            console.error('Lỗi khi lưu session:', err);
                            return next(err);
                        }
                        res.redirect('/'); 
                    });
                }else{
                    req.session.customer = user;
                    req.session.save((err) => {
                        if (err) {
                            console.error('Lỗi khi lưu session:', err);
                            return next(err);
                        }
                        res.redirect('http://localhost:3000/'); 
                    });
                }
            } else {
                res.status(401).send('Tên đăng nhập hoặc mật khẩu không đúng');
            }
        })
        .catch(next);
    }

    /** [GET] /login/api/user/infor */
    getUser(req, res, next) {
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
    /** [GET] /login/profile */
    profile(req, res) {
        const user = req.session.user || req.session.customer;
        if (!user) {
            return res.status(401).json({ 
                error: "Chưa đăng nhập",
                success: false
            });
        }
        res.json({ 
            message: "Bạn đang đăng nhập!", 
            success: false,
            user 
        });
    }
}

module.exports = new LoginController();