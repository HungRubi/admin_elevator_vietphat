const Receipts = require('../model/receipt.model');
const ReceiptDetail = require('../model/receiptDetail.model');
const { v4: uuidv4 } = require('uuid');
const { formatDate } = require('../../util/formatDate.util');
const {importDate} = require('../../util/importDate.util');
const Warehouse = require("../model/warehouse.model")

class ReceiptController {

    /** [GET] /receipt */
    async index(req, res) {
        let sortField = req.query.sort || 'createdAt'; 
        let sortReceipt = req.query.receipt === 'desc' ? 1 : -1;
        try {
            const searchQuery = req.query.timkiem?.trim() || '';
            if(searchQuery) {
                const receipts = await Receipts.find({
                    $or: [
                        { code: { $regex: searchQuery, $options: 'i' } },
                        { supplier: { $regex: searchQuery, $options: 'i' } },
                    ]
                })
                .sort({ [sortField]: sortReceipt })
                .populate('supplier')
                .lean();
                res.status(200).json({
                    searchType: true,
                    receiptSearch: receipts,
                    currentSort: sortField,
                    currentReceipt: sortReceipt === 1 ? 'asc' : 'desc',
                })
            }
            const receipts = await Receipts
            .find()
            .populate('supplier')
            .sort({ [sortField]: sortReceipt })
            .lean();    
            const formatReceipts = receipts.map(receipt => {
                return {
                    ...receipt,
                    dateFormat: formatDate(receipt.dateEntry),
                    updateFormat: formatDate(receipt.updatedAt),
                }
            });
            const totalReceipts = await Receipts.countDocuments();
            const totalPages = Math.ceil(totalReceipts / 10);   
            res.status(200).json({
                receipts: formatReceipts,
                totalPages,
                searchType: false,
                currentSort: sortField,
                currentOrder: sortReceipt === 1 ? 'asc' : 'desc'
            })
        }catch (error) {
            console.log(error);
            res.status(500).json({
                message: 'Lỗi rồi: ' + error,
            })
        }
    }

    /** [POST] /receipt/add */
    async add(req, res) {
        try{
            console.log(req.body);
            const { supplier, totalPrice, item } = req.body;
            const code =  uuidv4();
            const receipt = new Receipts({
                code,
                supplier,
                totalPrice,
            })
            await receipt.save();
            const receiptId = receipt._id;
            const receiptDetails = item.map(item => ({
                receipt: receiptId,
                product_id: item.product,
                quantity: item.quantity,
                price: item.price   
            }))
            await ReceiptDetail.insertMany(receiptDetails);
            res.status(200).json({
                message: 'Thêm phiếu nhập thành công',
            })
        }catch(error){
            console.log(error)
            res.status(500).json({
                message: 'Lỗi rồi: ' + error,
            })
        }
    }

    /** [GET] /receipt/:id */
    async getReceipt(req, res) {
        try{
            const { id } = req.params;
            const receipt = await Receipts.findById(id).populate('supplier').lean();
            if(!receipt) {
                return res.status(404).json({
                    message: 'Không tìm thấy phiếu nhập',
                })
            }
            const receiptDetails = await ReceiptDetail
            .find({ receipt: id })
            .populate({
                path: 'product_id',
                populate: {
                    path: 'category',
                }
            })
            .lean();
            const formatReceipt = {
                ...receipt,
                dateFormat: importDate(receipt.dateEntry),
                updateFormat: formatDate(receipt.updatedAt),
            }
            res.status(200).json({
                receipt: formatReceipt,
                receiptDetails,
            })
        }catch(error){
            console.log(error);
            res.status(500).json({
                message: 'Lỗi rồi: ' + error,
            })
        }
    }

    /** [PUT] /receipt/:id */
    async updateReceipt(req, res) {
        try{
            const { id } = req.params;
            const { supplier, totalPrice, item, status, dateEntry } = req.body;
            const receipt = await Receipts.findById(id);
            if(!receipt) {
                return res.status(404).json({
                    message: 'Không tìm thấy phiếu nhập',
                })
            }
            receipt.supplier = supplier;
            receipt.totalPrice = totalPrice;
            receipt.status = status;
            receipt.dateEntry = dateEntry;
            await receipt.save();
            await ReceiptDetail.deleteMany({ receipt: id });
            const receiptDetails = item.map(item => ({
                receipt: id,
                product_id: item.product,
                quantity: item.quantity,
                price: item.price   
            }))
            await ReceiptDetail.insertMany(receiptDetails);
            if(status === "đã xác nhận"){
                for (const i of item) {
                    await Warehouse.findOneAndUpdate(
                        { productId: i.product },
                        { $inc: { stock: i.quantity } },
                        { upsert: true, new: true }
                    );
                }
            }
            res.status(200).json({
                message: 'Cập nhật phiếu nhập thành công',
            })
        }catch(error){
            console.log(error)
            res.status(500).json({
                message: 'Lỗi rồi: ' + error,
            })
        }
    }

    /** [DELETE] /receipt/:id */
    async deleteReceipt(req, res) {
        try {
            const { id } = req.params;

            const receipt = await Receipts.findById(id);
            if (!receipt) {
                return res.status(404).json({
                    message: 'Không tìm thấy phiếu nhập',
                });
            }

            // Lấy chi tiết phiếu nhập
            const details = await ReceiptDetail.find({ receipt: id });

            // Trừ lại tồn kho
            for (const detail of details) {
                await Warehouse.findOneAndUpdate(
                    { productId: detail.product_id },
                    { $inc: { stock: -detail.quantity } }
                );
            }

            await ReceiptDetail.deleteMany({ receipt: id });
            await Receipts.deleteOne({ _id: id });

            res.status(200).json({
                message: 'Xóa phiếu nhập thành công',
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: 'Lỗi rồi: ' + error,
            });
        }
    }

}

module.exports = new ReceiptController();