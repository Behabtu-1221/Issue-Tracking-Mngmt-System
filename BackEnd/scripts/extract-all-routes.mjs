import app, { modules } from '../src/app.js';
import healthRouter from '../src/shared/routes/health.routes.js';

function extractFromRouter(router, basePath = '') {
  const routes = [];
  if (!router || !router.stack) return routes;

  router.stack.forEach(layer => {
    if (layer.route) {
      const p = (basePath + (layer.route.path === '/' ? '' : layer.route.path)).replace(/\/+/g, '/');
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
      methods.forEach(method => {
        routes.push({ method, path: p });
      });
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      let subPath = '';
      if (layer.regexp) {
        let str = layer.regexp.source;
        // Clean regex source
        str = str.replace(/^\^\\?/, '')
                 .replace(/\\\/\?\(\?=\\\/\|\$\)\$/, '')
                 .replace(/\(\?=\\\/\|\$\)\$/, '')
                 .replace(/\/?\(\?=\/\|\$\)/, '')
                 .replace(/\\\//g, '/')
                 .replace(/\/\?$/, '')
                 .replace(/\$$/, '')
                 .replace(/\^/, '');
        if (!str.startsWith('/') && str.length > 0) str = '/' + str;
        subPath = str;
      }
      routes.push(...extractFromRouter(layer.handle, (basePath + subPath).replace(/\/+/g, '/')));
    }
  });

  return routes;
}

const allModuleRoutes = [];

// Health router
const healthRoutes = extractFromRouter(healthRouter, '/api/health');
allModuleRoutes.push({ module: 'System Health', routes: healthRoutes });

modules.forEach(mod => {
  const modRoutes = extractFromRouter(mod.router, mod.basePath);
  allModuleRoutes.push({ module: mod.name, basePath: mod.basePath, routes: modRoutes });
});

let total = 0;
allModuleRoutes.forEach(m => {
  console.log(`\n======================================================`);
  console.log(`MODULE: ${m.module} (Base: ${m.basePath || '/api/health'}) - ${m.routes.length} endpoints`);
  console.log(`======================================================`);
  m.routes.forEach(r => {
    total++;
    console.log(`${r.method.padEnd(8)} http://localhost:5000${r.path}`);
  });
});

console.log(`\nGRAND TOTAL ENDPOINTS: ${total}`);
