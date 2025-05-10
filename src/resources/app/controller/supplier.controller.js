const Suppliers = require('../model/supplier.model');
const { formatDate } = require('../../util/formatDate.util');

class Supplier {

    /** [GET] /supplier */
    async index (req, res) {
        let sortField = req.query.sort || 'name'; 
        let sortOrder = req.query.supplier === 'desc' ? 1 : -1;
        try{
            const searchQuery = req.query.timkiem?.trim() || '';
            if(searchQuery){
                const supplier = await Suppliers.find({
                    name: { $regex: searchQuery, $options: 'i' }
                })
                .sort({ [sortField]: sortOrder })
                .lean()
                const formatSupplier = supplier.map(item => ({
                    ...item,
                    formatDate: formatDate(item.createdAt)
                }))
                return res.status(200).json({
                    searchType: true,
                    searchSupplier: formatSupplier,
                    currentSort: sortField,
                    currentOrder: sortOrder === 1 ? 'asc' : 'desc',
                })
            }
            const supplier = await Suppliers.find()
            .sort({ [sortField]: sortOrder })
            .lean();
            const formatSupplier = supplier.map(item => ({
                ...item,
                formatDate: formatDate(item.createdAt)
            }))
            const totalBanner = await Suppliers.countDocuments();
            const totalPage = Math.ceil(totalBanner / 10)
            res.status(200).json({
                supplier: formatSupplier,
                totalPage,
                searchType: false,
                currentSort: sortField,
                currentOrder: sortOrder === 1 ? 'asc' : 'desc'
            })
        }catch(error){
            console.log(error)
            res.status(500).json({
                message: 'Lỗi server xin thử lại sau',
            })
        }
    }
    
    /** [POST] /supplier/store */
    async store(req, res) {
        try{
            const { name, phone, address, email } = req.body;
            console.log(req.body)
            const supplier = new Suppliers({
                name,
                phone,
                address,
                email,
            });
            await supplier.save();
            res.status(200).json({
                message: 'Thêm nhà cung cấp thành công',
            })
        }catch(error){
            console.log(error)
            res.status(500).json({
                message: 'Lỗi rồi: ' + error,
            })
        }
    }

    /** [GET] /supplier/edit */
    async edit(req, res) {
        try{
            const { id } = req.params;
            console.log(id)
            const supplier = await Suppliers.findById(id).lean();
            if(!supplier){
                return res.status(404).json({
                    message: 'Không tìm thấy nhà cung cấp',
                })
            }
            
            res.status(200).json({
                supplier,
            })
        }catch(error){
            console.log(error)
            res.status(500).json({
                message: 'Lỗi rồi: ' + error,
            })
        }
    }

    /** [PUT] /supplier/update/:id  */
    async update(req, res) {
        try{
            const { id } = req.params;
            const { name, phone, address, email } = req.body;
            const supplier = await Suppliers.findByIdAndUpdate({_id: id}, {
                name,
                phone,
                address,
                email,
            }, { new: true });
            if(!supplier){
                return res.status(404).json({
                    message: 'Nhà cung cấp không tồn tại',
                })
            }
            res.status(200).json({
                message: 'Cập nhật nhà cung cấp thành công',
            })


        }catch(error){
            console.log(error)
            res.status(500).json({
                message: 'Lỗi rồi: ' + error,
            })
        }
    }

    async delete(req, res) {
        try{
            const { id } = req.params;
            const supplier = await Suppliers.findByIdAndDelete(id);
            if(!supplier){
                return res.status(404).json({
                    message: 'Nhà cung cấp không tồn tại',
                })
            }
            const suppliers = await Suppliers.find().lean();
            const formatSupplier = suppliers.map(item => ({
                ...item,
                formatDate: formatDate(item.createdAt)
            }))
            res.status(200).json({
                message: 'Xóa nhà cung cấp thành công',
                suppliers: formatSupplier,
            })  
        }catch(error){
            console.log(error)
            res.status(500).json({
                message: 'Lỗi rồi: ' + error,
            })
        }
    }

}

module.exports = new Supplier();