const Product = require('../model/products.model');
const CategoryProduct = require('../model/categoryProduct.model');
const {importDate} = require('../../util/importDate.util')
class ProductsController {
    /** [GET] /products */
    getProduct = async (req, res,next) => {
        try{
            const [products] = await Promise.all([
                Product.find()
                .sort({ createdAt: -1 }),
            ]);

            const totalProduct = await Product.countDocuments();
            const totalPage = Math.ceil(totalProduct / 12);
            const data = { 
                products,
                totalPage,
            };
            res.status(200).json({data})
        }catch(err){
            res.status(500).json({message: err})
        }
    }

    /** [GET] /products/:id */
    async getProductEdit(req, res, next) {
        try{
            const product = await Product.findById(req.params.id);
            const categoryProduct = await CategoryProduct.find();
            const formatProduct = {
                    ...product.toObject(),
                    lastUpdate: importDate(product.updatedAt)
            }
            console.log(formatProduct);
            const data = {
                category: categoryProduct,
                product: formatProduct
            }
            res.status(200).json({data})
        }
        catch(err){
            res.status(500).json({message: err})
        }
    }

    /** [GET] /products/fe/:slug */
    async getProductEditFe(req, res, next) {
        try{
            const product = await Product.findOne({slug: req.params.slug});
            const productSuggest = await Product.aggregate([{ $sample: { size: 8 } }]);
            const formatProduct = {
                    ...product.toObject(),
                    lastUpdate: importDate(product.updatedAt)
            }
            const data = {
                product: formatProduct,
                productSuggest
            }
            res.status(200).json({data})
        }
        catch(err){
            res.status(500).json({message: err})
        }
    }
}

module.exports = new ProductsController();