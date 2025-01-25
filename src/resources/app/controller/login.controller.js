const fs = require('fs');
const path = require('path');

const Custumers = require('../model/custumers.model');

class LoginController{
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

    login(req, res, next) {
        console.log('Form data:', req.body);
        const { account, password } = req.body;
    
        Custumers.findOne({ account, password })
        .then(custumer => {
            console.log('Kết quả từ MongoDB:', custumer);
            if (custumer) {
                req.session.custumer = {
                    id: custumer._id,
                    account: custumer.account,
                    name: custumer.name
                };
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
}

module.exports = new LoginController();