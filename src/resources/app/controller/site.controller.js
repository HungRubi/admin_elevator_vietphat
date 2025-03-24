const Article = require('../model/article.model');
const Banner = require('../model/banner.model');
const Product = require('../model/products.model');
const categoryProduct = require('../model/categoryProduct.model');
const Video = require('../model/video.model');
const { formatDate } = require('../../util/formatDate.util');
class SiteController{
    getHome = async (req, res, next) => {
        try {
            const categories = [
                { name: "Linh kiện inox" },
                { name: "Linh kiện điện" },
                { name: "Tay vịn thang máy" },
                { name: "COP/LOP" }
            ];
    
            const categoryPromises = categories.map(async (category) => {
                const categoryData = await categoryProduct.findOne({ name: category.name });
                if (!categoryData) return { category: category.name, products: [] };
    
                const products = await Product.find({ category: categoryData._id }).limit(8);
                return { category: category.name, products };
            });
    
            const [products, article, banner] = await Promise.all([
                Promise.all(categoryPromises),
                Article.find().sort({ createdAt: -1 }).limit(2),
                Banner.find({status: "public"}).sort({ createdAt: -1 }).limit(3)
            ]);
    
            const video = await Video.find({}).sort({createdAt: -1}).limit(3);
            const formatVideo = video.map(vd => ({
                ...vd.toObject(),
                format: formatDate(vd.createdAt)
            }))
            const data = { 
                video: formatVideo,
                products, 
                article, 
                banner,
            };
    
            res.json({ data });
        } catch (err) {
            next(err);
        }
    };
}
module.exports = new SiteController();