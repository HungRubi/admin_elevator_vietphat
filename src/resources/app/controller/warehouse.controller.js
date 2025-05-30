const Warehouse = require('../model/warehouse.model');
const Product = require('../model/products.model');
const { formatDate } = require('../../util/formatDate.util');

class WarehouseController {

    /** [GET] /warehouse */
    async index(req, res) {
        let sortField = req.query.sort || 'updatedAt'; 
        let sortWarehouse = req.query.warehouse === 'desc' ? 1 : -1;
        try {
            const searchQuery = req.query.timkiem?.trim() || '';
            if(searchQuery) {
                const warehouses = await Warehouse
                .find({
                    $or: [
                        { location: { $regex: searchQuery || '', $options: 'i' } },
                    ],
                })
                .populate({
                    path: 'productId',
                    match: {
                        $or: [
                            { name: { $regex: searchQuery || '', $options: 'i' } },
                            { category: { $regex: searchQuery || '', $options: 'i' } },
                        ],
                    },
                    populate: [
                        {path: 'category'},
                        {path: 'supplier'},
                    ]
                })
                .sort({ [sortField]: sortWarehouse })
                .lean();
                res.status(200).json({
                    searchType: true,
                    searchWarehouse: warehouses,
                    currentSort: sortField,
                    currentWarehouse: sortWarehouse === 1 ? 'asc' : 'desc',
                });
            }
            const warehouses = await Warehouse
            .find()
            .populate({
                path: 'productId',
                populate: [
                    {path: 'category'},
                    {path: 'supplier'},
                ]
            })
            .sort({ [sortField]: sortWarehouse })
            .lean();
            const formatWarehouses = warehouses.map((warehouse) => ({
                ...warehouse,
                formatDate: formatDate(warehouse.updatedAt),
            }));

            const totalWarehouses = await Warehouse.countDocuments();
            const totalPage = Math.ceil(totalWarehouses / 10);
            res.status(200).json({
                searchType: false,
                warehouses: formatWarehouses,
                currentSort: sortField,
                currentWarehouse: sortWarehouse === 1 ? 'asc' : 'desc',
                totalPage,
            });
        } catch (error) {
            console.error('Error fetching warehouse data:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /** [DELETE] /warehouse/:id */
    async delete(req, res) {
        try{
            const {id} = req.params;
            const warehouseProduct = await Warehouse.findById(id);
            if(!warehouseProduct) {
                return res.status(500).json({
                    message: "Sản phẩm này không có trong kho"
                })
            }
            await Warehouse.deleteOne({_id: id})
            return res.status(200).json({
                message: "Xóa sản phẩm trong kho thành công"
            })
        }catch(error) {
            console.error('Error fetching warehouse data:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /** [GET] /warehouse/filter */
    async filterWarehouse(req, res) {
        try {
            console.log(req.query)
            const { status, startDate, endDate } = req.query;
            let query = {};
            if (status && status !== 'undefined') {
                query.status = status;
            }
            if (startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined') {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt = {
                    $gte: start,
                    $lte: end
                };
            }
            const test = await Warehouse.find(query);
            const warehouses = await Warehouse
            .find(query)
            .populate({
                path: 'productId',
                populate: [
                    {path: 'category'},
                    {path: 'supplier'},
                ]
            })
            .lean();
            const formatWarehouses = warehouses.map((warehouse) => ({
                ...warehouse,
                formatDate: formatDate(warehouse.updatedAt),
            }));
            res.status(200).json({
                warehouses: formatWarehouses
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            });
        }
    }
}

module.exports = new WarehouseController();