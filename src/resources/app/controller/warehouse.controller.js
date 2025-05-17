const Warehouse = require('../model/warehouse.model');
const Product = require('../model/products.model');
const { formatDate } = require('../../util/formatDate.util');

class WarehouseController {
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
}

module.exports = new WarehouseController();