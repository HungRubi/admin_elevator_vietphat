const fs = require('fs');
const path = require('path');

const Employee = require('../model/employee.model');

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
    
        Employee.findOne({ account, password })
        .then(employee => {
            console.log('Kết quả từ MongoDB:', employee);
            if (employee) {
                req.session.employee = employee;
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
        console.log(JSON.stringify(req.session));
        if (req.session.employee) {
            res.json({
                success: true,
                employee: req.session.employee
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