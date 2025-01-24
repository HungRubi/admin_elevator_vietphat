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
                if (custumer) {
                    req.session.custumer = {
                        id: custumer.id,
                        name: custumer.name,
                    };
                    res.redirect('/');
                } else {
                    res.status(401).send('Tên đăng nhập hoặc mật khẩu không đúng');
                }
            })
            .catch(next);
    }
}

module.exports = new LoginController();