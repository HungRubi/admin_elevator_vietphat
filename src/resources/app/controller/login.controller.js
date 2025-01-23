const fs = require('fs');
const path = require('path');

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
}

module.exports = new LoginController();