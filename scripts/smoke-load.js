/**
 * Smoke: nạp Express + toàn bộ router/controller (không listen, không cần MongoDB).
 * Chạy: yarn smoke
 */
require('dotenv').config();
const express = require('express');
const route = require('../src/resources/router/index.route');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

route(app);

function countRouteEntries(stack, depth = 0) {
    let n = 0;
    if (!stack) return 0;
    for (const layer of stack) {
        n += 1;
        if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            n += countRouteEntries(layer.handle.stack, depth + 1);
        }
    }
    return n;
}

const total = countRouteEntries(app._router && app._router.stack);
console.log('[smoke-load] OK — đã mount route, ~layer count:', total);
