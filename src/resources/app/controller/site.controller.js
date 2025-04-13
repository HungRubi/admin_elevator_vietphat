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
    async querySearch(req, res, next) {
        try {
            const { s } = req.query;
            const search = String(s || "").trim();
    
            // 1. Truy vấn lần đầu
            let [product, video, article] = await Promise.all([
                Product.find({ name: { $regex: search, $options: 'i' } }),
                Video.find({ name: { $regex: search, $options: 'i' } }),
                Article.find({ subject: { $regex: search, $options: 'i' } }),
            ]);
            const formatArticle = article.map(art => ({
                ...art.toObject(),
                dateFormat: formatDate(art.createdAt)
            }))
            res.status(200).json({
                product,
                video,
                article: formatArticle,
            });
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }
}
module.exports = new SiteController();