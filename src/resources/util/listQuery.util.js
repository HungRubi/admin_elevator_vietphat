/**
 * Tham số list chuẩn: page | offset, limit (có trần), sort + order, timkiem | q.
 * Dùng lại cho các controller sau (theo thứ tự A→Z).
 */

const MAX_LIMIT = 100;

function clampLimit(raw, defaultLimit) {
    const n = parseInt(raw, 10);
    const lim = Number.isFinite(n) && n > 0 ? n : defaultLimit;
    return Math.min(Math.max(1, lim), MAX_LIMIT);
}

function parsePage(raw) {
    const p = parseInt(raw, 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
}

function parseOffset(raw) {
    if (raw === undefined || raw === null || raw === '') return null;
    const o = parseInt(raw, 10);
    return Number.isFinite(o) && o >= 0 ? o : 0;
}

/**
 * @param {Record<string, unknown>} query - req.query
 * @param {{
 *   allowedSortFields: string[],
 *   defaultSortField?: string,
 *   defaultOrder?: 'asc' | 'desc',
 *   defaultLimit?: number,
 * }} opts
 */
function parseListQuery(query, opts) {
    const {
        allowedSortFields,
        defaultSortField = 'createdAt',
        defaultOrder = 'desc',
        defaultLimit = 20,
    } = opts;

    const limit = clampLimit(query.limit, defaultLimit);

    const offsetExplicit = parseOffset(query.offset);
    let skip;
    let page;
    if (offsetExplicit !== null) {
        skip = offsetExplicit;
        page = Math.floor(skip / limit) + 1;
    } else {
        page = parsePage(query.page);
        skip = (page - 1) * limit;
    }

    const sortField = allowedSortFields.includes(query.sort)
        ? query.sort
        : defaultSortField;

    let sortDir = defaultOrder === 'asc' ? 1 : -1;
    const orderLower = String(query.order || '').toLowerCase();
    if (orderLower === 'asc') sortDir = 1;
    else if (orderLower === 'desc') sortDir = -1;
    else if (query.article === 'desc') sortDir = 1;
    else if (query.article === 'asc') sortDir = -1;
    else if (query.comment === 'desc') sortDir = 1;
    else if (query.comment === 'asc') sortDir = -1;
    else if (query.notification === 'desc') sortDir = 1;
    else if (query.notification === 'asc') sortDir = -1;
    else if (query.product === 'desc') sortDir = 1;
    else if (query.product === 'asc') sortDir = -1;
    else if (query.receipt === 'desc') sortDir = 1;
    else if (query.receipt === 'asc') sortDir = -1;
    else if (query.site === 'desc') sortDir = 1;
    else if (query.site === 'asc') sortDir = -1;
    else if (query.supplier === 'desc') sortDir = 1;
    else if (query.supplier === 'asc') sortDir = -1;
    else if (query.user === 'desc') sortDir = 1;
    else if (query.user === 'asc') sortDir = -1;
    else if (query.warehouse === 'desc') sortDir = 1;
    else if (query.warehouse === 'asc') sortDir = -1;
    else if (query.warranty === 'desc') sortDir = 1;
    else if (query.warranty === 'asc') sortDir = -1;

    const search = String(query.timkiem || query.q || '').trim();

    return {
        limit,
        skip,
        page,
        sort: { [sortField]: sortDir },
        sortField,
        orderLabel: sortDir === 1 ? 'asc' : 'desc',
        search,
    };
}

module.exports = {
    MAX_LIMIT,
    parseListQuery,
    clampLimit,
    parsePage,
};
