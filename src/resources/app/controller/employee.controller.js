const Employee = require('../model/employee.model');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util')
const { mongooseToObject } = require('../../util/mongoose.util')
class EmployeeController {
    
    /** [GET] /employee */
    index(req, res, next) {
        Employee.find()
        .then(employee => {
            const formatEmployee = employee.map(employ => {
                return{
                    ...employ.toObject(),
                    formatedDate: formatDate(employ.lastLogin),
                    formatedBirth: formatDate(employ.birth),
                }
            })
            res.render('employee/employee', {
                employee: formatEmployee,
            });
        })
    }
 
    /** [GET] /employee/add */
    add(req, res, next){
        res.render('employee/addEmployee');
    }

    /** [POST] /employee/store */
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
            const employee = new Employee({
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
            await employee.save();
            res.redirect('/employee');
        }catch(error){
            next(error);
        }
    }
}

module.exports = new EmployeeController();