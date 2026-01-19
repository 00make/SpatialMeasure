const CACHE_NAME = 'quest-measure-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './static/css/main.css',
    './static/build/three.module.js',
    './static/jsm/webxr/XRButton.js',
    // 注意：如果你用了其他的jsm库（比如OrbitControls），也要加进来
    // 如果你的 three.js 文件结构不同，请务必检查路径！
];

// 1. 安装：缓存所有文件
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. 请求：拦截网络请求，优先从缓存读取
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((r) => {
            console.log('[Service Worker] Fetching resource: ' + e.request.url);
            return r || fetch(e.request).then((response) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    console.log('[Service Worker] Caching new resource: ' + e.request.url);
                    cache.put(e.request, response.clone());
                    return response;
                });
            });
        })
    );
});