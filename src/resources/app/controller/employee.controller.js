const Employee = require('../model/employee.model');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util')
const { mongooseToObject } = require('../../util/mongoose.util')
const { importDate } = require('../../util/importDate.util'); 
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

    /** [GET] /employee/:id/edit */
    edit(req, res, next) {
        Employee.findById(req.params.id)
        .then(employee => {
            const formatBirth = {
                    ...employee.toObject(),
                    birthFormated: importDate(employee.birth)
                
            }
            res.render('employee/editEmployee', {
                employee: formatBirth
            })
        })
    }

    /** [PUT] /employee/:id */
    update(req, res, next) {
        Employee.findById(req.params.id)
            .then(employee => {
                if (!employee) {
                    return res.status(404).send('Employee not found');
                }
                if (employee.account === req.body.account) {
                    delete req.body.account;
                }
                return Employee.updateOne({ _id: req.params.id }, req.body);
            })
            .then(() => {
                res.redirect('/employee')
            })
            .catch(next)
    }
}

module.exports = new EmployeeController();