const categoryProduct = require('../model/categoryProduct.model');
const Product = require('../model/products.model')
const Article = require('../model/article.model');
const Banner = require('../model/banner.model');
const { formatDate } = require('../../util/formatDate.util');
class Api {

    /** [GET] /api/home */
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
    
            const data = { products, article, banner };
    
            res.json({ data });
        } catch (err) {
            next(err);
        }
    };

    /** [GET] /api/product */
    getProduct = async (req, res,next) => {
        let page = parseInt(req.query.page) || 1
        let limit = 12;
        let skip = (page - 1) * limit;
        try{
            const [products] = await Promise.all([
                Product.find()
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            ]);

            const totalProduct = await Product.countDocuments();
            const totalPage = Math.ceil(totalProduct / limit);
            const data = { 
                products,
                currentPage: page,
                totalPage,
            };
            res.json({data})
        }catch(err){
            next(err)
        }
    }

    async getArticle(req, res, next) {
        let page = parseInt(req.query.page) || 1;
        let limit = 8;
        let skip = (page - 1) * limit;
        try {
            const articles = await Article.find({ status: 'public' })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean();
    
            const formatArticle = articles.map(article => ({
                ...article,
                dateFormat: formatDate(article.updatedAt)
            }));
    
            const totalArticle = await Article.countDocuments();
            const totalPage = Math.ceil(totalArticle / limit);
            const data = {
                articles: formatArticle,
                currentPage: page,
                totalPage,
            };
    
            res.json({ data });
        } catch (err) {
            next(err);
        }
    }
    
    
}

module.exports = new Api();