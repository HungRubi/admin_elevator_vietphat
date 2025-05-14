const Receipts = require('../model/receipt.model');
const ReceiptDetail = require('../model/receiptDetail.model');

class ReceiptController {
    /** [POST] /receipt/add */
    async add(req, res) {
        try{
            const { code, dateEntry, supplier, totalPrice, status, items } = req.body;
            const receipt = new Receipts({
                code,
                dateEntry,
                supplier,
                totalPrice,
                status
            })
            await receipt.save();
            const receiptId = receipt._id;
            const receiptDetails = items.map(item => ({
                receipt: receiptId,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price   
            }))
            await ReceiptDetail.insertMany(receiptDetails);
            res.status(200).json({
                message: 'Thêm hóa đơn thành công',
            })
        }catch(error){
            console.log(error)
            res.status(500).json({
                message: 'Lỗi rồi: ' + error,
            })
        }
    }
}

module.exports = new ReceiptController();