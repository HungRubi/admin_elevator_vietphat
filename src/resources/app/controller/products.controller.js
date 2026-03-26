const mongoose = require('mongoose');
const Product = require('../model/products.model');
const Warehouse = require('../model/warehouse.model');
const CategoryProduct = require('../model/categoryProduct.model');
const { importDate } = require('../../util/importDate.util');
const { createSlug } = require('../../util/createSlug.util');
const Comment = require('../model/comments.model');
const { parseListQuery, clampLimit } = require('../../util/listQuery.util');

const SORT_PRODUCT_ADMIN = [
    'name',
    'createdAt',
    'updatedAt',
    'price',
    'sale',
    'minimum',
    'slug',
];
const SORT_PRODUCT_PUBLIC = [
    'name',
    'createdAt',
    'updatedAt',
    'price',
    'sale',
    'minimum',
];

const PRODUCT_UPDATE_KEYS = [
    'name',
    'description',
    'sale',
    'price',
    'cog',
    'shipping_cost',
    'supplier',
    'unit',
    'category',
    'minimum',
    'thumbnail_main',
    'thumbnail_1',
    'thumbnail_2',
    'thumbnail_3',
    'warranty_period',
];

const MAX_SELECTED_IDS = 50;

/** Lấy map productId → tồn kho (một dòng warehouse / sản phẩm; nếu không có bản ghi thì không có trong map) */
async function fetchWarehouseStockMap(productIds) {
    const idStrs = [...new Set((productIds || []).map((id) => id?.toString()).filter(Boolean))];
    if (idStrs.length === 0) return new Map();
    const objectIds = idStrs.map((id) => new mongoose.Types.ObjectId(id));
    const rows = await Warehouse.find({ productId: { $in: objectIds } })
        .select('productId stock minimum maximum status')
        .lean();
    const map = new Map();
    for (const w of rows) {
        map.set(w.productId.toString(), {
            stock: w.stock,
            minimum: w.minimum,
            maximum: w.maximum,
            status: w.status,
        });
    }
    return map;
}

function mergeWarehouseStock(plainProduct, stockMap) {
    const key = plainProduct._id?.toString();
    const w = key ? stockMap.get(key) : null;
    return {
        ...plainProduct,
        warehouseStock: w ? Number(w.stock) : 0,
        warehouse: w || null,
    };
}

async function attachWarehouseStockToProducts(plainProducts) {
    if (!plainProducts || plainProducts.length === 0) return plainProducts;
    const stockMap = await fetchWarehouseStockMap(plainProducts.map((p) => p._id));
    return plainProducts.map((p) => mergeWarehouseStock(p, stockMap));
}

class ProductsController {
    /** [GET] /products/admin — staff */
    async index(req, res) {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                req.query,
                {
                    allowedSortFields: SORT_PRODUCT_ADMIN,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            const filter = search ? { name: { $regex: search, $options: 'i' } } : {};

            const [rows, total] = await Promise.all([
                Product.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .populate('category')
                    .populate('supplier')
                    .lean(),
                Product.countDocuments(filter),
            ]);

            const withFormat = rows.map((p) => ({
                ...p,
                formatDate: importDate(p.createdAt),
            }));
            const productFormat = await attachWarehouseStockToProducts(withFormat);

            const totalPage = Math.max(1, Math.ceil(total / limit));

            return res.status(200).json({
                data: {
                    productFormat,
                    searchType: Boolean(search),
                    searchProduct: search ? productFormat : undefined,
                    total,
                    totalPage,
                    page,
                    limit,
                    offset: skip,
                    currentSort: sortField,
                    currentProduct: orderLabel,
                },
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau :((',
            });
        }
    }

    /** [GET] /products — public */
    getProduct = async (req, res) => {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                req.query,
                {
                    allowedSortFields: SORT_PRODUCT_PUBLIC,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 12,
                }
            );

            const filter = search ? { name: { $regex: search, $options: 'i' } } : {};

            const [products, total] = await Promise.all([
                Product.find(filter).sort(sort).skip(skip).limit(limit).populate('category').lean(),
                Product.countDocuments(filter),
            ]);

            const withFormat = products.map((p) => ({
                ...p,
                formatDate: importDate(p.createdAt),
            }));
            const formatProducts = await attachWarehouseStockToProducts(withFormat);

            const totalPage = Math.max(1, Math.ceil(total / limit));
            const data = {
                products: formatProducts,
                total,
                totalPage,
                page,
                limit,
                offset: skip,
                currentSort: sortField,
                currentOrder: orderLabel,
            };
            res.status(200).json({ data });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server khi tải sản phẩm' });
        }
    };

    /** [GET] /products/:id — staff */
    async getProductEdit(req, res) {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({ message: 'ID không hợp lệ' });
            }
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            }
            const categoryProduct = await CategoryProduct.find().limit(500).lean();
            const baseProduct = {
                ...product.toObject(),
                lastUpdate: importDate(product.updatedAt),
            };
            const [formatProduct] = await attachWarehouseStockToProducts([baseProduct]);
            res.status(200).json({
                data: {
                    category: categoryProduct,
                    product: formatProduct,
                },
            });
        } catch (err) {
            res.status(500).json({ message: err.message || 'Lỗi server' });
        }
    }

    /** [GET] /products/fe/:slug — public */
    async getProductEditFe(req, res) {
        try {
            const product = await Product.findOne({ slug: req.params.slug });
            if (!product) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            }

            const sampleSize = Math.min(clampLimit(req.query.limit_suggest, 8), 20);
            const productSuggestRaw = await Product.aggregate([{ $sample: { size: sampleSize } }]);

            const baseProduct = {
                ...product.toObject(),
                lastUpdate: importDate(product.updatedAt),
            };
            const stockMap = await fetchWarehouseStockMap([
                product._id,
                ...productSuggestRaw.map((p) => p._id),
            ]);
            const formatProduct = mergeWarehouseStock(baseProduct, stockMap);
            const productSuggest = productSuggestRaw.map((p) =>
                mergeWarehouseStock(
                    {
                        ...p,
                        formatDate: p.createdAt ? importDate(p.createdAt) : undefined,
                    },
                    stockMap
                )
            );

            const comment = await Comment.find({ product_id: product._id }).populate('user_id');
            const formatComments = comment.map((c) => ({
                ...c.toObject(),
                lastUpdate: importDate(c.updatedAt),
            }));

            res.status(200).json({
                data: {
                    product: formatProduct,
                    comment: formatComments,
                    productSuggest,
                    limit_suggest: sampleSize,
                },
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server khi tải sản phẩm' });
        }
    }

    /** [POST] /products/selected — public */
    getProductSelected = async (req, res) => {
        try {
            const productId = req.body.productId;
            if (!Array.isArray(productId) || productId.length === 0) {
                return res.status(400).json({ message: 'productId phải là mảng id hợp lệ' });
            }
            if (productId.length > MAX_SELECTED_IDS) {
                return res.status(400).json({
                    message: `Tối đa ${MAX_SELECTED_IDS} sản phẩm mỗi request`,
                });
            }
            const validIds = productId.filter((id) => mongoose.isValidObjectId(id));
            if (validIds.length !== productId.length) {
                return res.status(400).json({ message: 'Có productId không hợp lệ' });
            }

            const product = await Product.find({ _id: { $in: validIds } })
                .populate('category')
                .populate('supplier')
                .lean();

            if (product.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            }

            const productWithStock = await attachWarehouseStockToProducts(product);
            res.status(200).json({ product: productWithStock });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    };

    /** [POST] /products/store — staff */
    async store(req, res) {
        try {
            const {
                name,
                description,
                sale,
                price,
                cog,
                shipping_cost,
                supplier,
                unit,
                category,
                minimum,
                thumbnail_main,
                thumbnail_1,
                thumbnail_2,
                thumbnail_3,
                warranty_period,
            } = req.body;
            const slug = createSlug(name);
            const product = new Product({
                name,
                description,
                sale,
                warranty_period,
                price,
                shipping_cost,
                supplier,
                cog,
                unit,
                category,
                minimum,
                thumbnail_main,
                thumbnail_1,
                thumbnail_2,
                thumbnail_3,
                slug,
            });
            await product.save();
            res.status(200).json({
                message: 'Thêm sản phẩm thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server xin thử lại sau :((',
            });
        }
    }

    /** [PUT] /products/:id — staff */
    async updateProduct(req, res) {
        try {
            const productId = req.params.id;
            if (!mongoose.isValidObjectId(productId)) {
                return res.status(400).json({ message: 'ID không hợp lệ' });
            }

            const $set = {};
            for (const key of PRODUCT_UPDATE_KEYS) {
                if (req.body[key] !== undefined) {
                    $set[key] = req.body[key];
                }
            }
            if ($set.name !== undefined) {
                $set.slug = createSlug($set.name);
            }
            if (Object.keys($set).length === 0) {
                return res.status(400).json({ message: 'Không có trường hợp lệ để cập nhật' });
            }

            const result = await Product.updateOne({ _id: productId }, { $set });
            if (result.matchedCount === 0) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            }

            res.status(200).json({
                message: 'Cập nhật sản phẩm thành công :))',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau :((',
            });
        }
    }

    /** [DELETE] /products/:id — staff */
    async destroyProduct(req, res) {
        try {
            const productId = req.params.id;
            if (!mongoose.isValidObjectId(productId)) {
                return res.status(400).json({ message: 'ID không hợp lệ' });
            }
            const result = await Product.deleteOne({ _id: productId });
            if (result.deletedCount === 0) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            }
            res.status(200).json({
                message: 'Bạn vừa xóa thành công 1 sản phẩm!',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau :((',
            });
        }
    }

    /** [GET] /products/filter — public */
    async filterProduct(req, res) {
        try {
            const { category, startDate, endDate, timkiem, q } = req.query;
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                { ...req.query, timkiem: timkiem || q },
                {
                    allowedSortFields: SORT_PRODUCT_PUBLIC,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            const query = {};
            if (category) {
                query.category = category;
            }
            if (startDate && endDate) {
                query.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            }
            if (search) {
                query.name = { $regex: search, $options: 'i' };
            }

            const [products, total] = await Promise.all([
                Product.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .populate('category')
                    .lean(),
                Product.countDocuments(query),
            ]);

            const withFormat = products.map((p) => ({
                ...p,
                formatDate: importDate(p.createdAt),
            }));
            const productFormat = await attachWarehouseStockToProducts(withFormat);

            const totalPage = Math.max(1, Math.ceil(total / limit));
            res.status(200).json({
                productFormat,
                total,
                totalPage,
                page,
                limit,
                offset: skip,
                currentSort: sortField,
                currentOrder: orderLabel,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau :((',
            });
        }
    }
}

module.exports = new ProductsController();
