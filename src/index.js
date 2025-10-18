const Koa = require('koa');
const app = new Koa();
const server = require('http').createServer(app.callback());
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
const Router = require('koa-router');
const cors = require('koa-cors');
const bodyparser = require('koa-bodyparser');

app.use(bodyparser());
app.use(cors());
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} ${ctx.response.status} - ${ms}ms`);
});

app.use(async (ctx, next) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  await next();
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.body = { message: err.message || 'Unexpected error' };
    ctx.response.status = 500;
  }
});

class Bijuterie {
  constructor({ id, cod, categorie, pret,pietre}) {
    this.id = id;
    this.cod =cod;
    this.categorie = categorie;
    this.pret = pret;
    this.pietre=pietre;
    this.data=new Date();
  }
}

const bijuterii = [];
bijuterii.push(new Bijuterie(0,'I45','inel',125,true));
let lastId = bijuterii[bijuterii.length - 1].id;
const pageSize = 5;

const broadcast = data =>
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });

const router = new Router();

router.get('/item', ctx => {
  ctx.response.body = bijuterii;
  ctx.response.status = 200;
});

router.get('/item/:id', async (ctx) => {
  const itemId = ctx.request.params.id;
  const item = bijuterii.find(item => itemId === item.id);
  if (item) {
    ctx.response.body = item;
    ctx.response.status = 200;
  } else {
    ctx.response.body = { message: `item with id ${itemId} not found` };
    ctx.response.status = 404;
  }
});

const createItem = async (ctx) => {
  const item = ctx.request.body;
  //validation
  if (!item.cod) {
    ctx.response.body = { message: 'Code is missing' };
    ctx.response.status = 400;
    return;
  }
  if (!item.categorie) {
    ctx.response.body = { message: 'Category is missing' };
    ctx.response.status = 400;
    return;
  }
  if (!item.pret) {
    ctx.response.body = { message: 'Price is missing' };
    ctx.response.status = 400;
    return;
  }
  if (!item.pietre) {
    ctx.response.body = { message: 'Stone is missing' };
    ctx.response.status = 400;
    return;
  }
  item.id = `${parseInt(lastId) + 1}`;
  lastId = item.id;
  bijuterii.push(item);
  ctx.response.body = item;
  ctx.response.status = 201;
  broadcast({ event: 'created', payload: { item } });
};

router.post('/item', async (ctx) => {
  await createItem(ctx);
});

router.put('/item/:id', async (ctx) => {
  const id = ctx.params.id;
  const item = ctx.request.body;
  const itemId = item.id;
  if (itemId && id !== item.id) {
    ctx.response.body = { message: `Param id and body id should be the same` };
    ctx.response.status = 400;
    return;
  }
  if (!itemId) {
    await createItem(ctx);
    return;
  }
  const index = bijuterii.findIndex(item => item.id === id);
  if (index === -1) {
    ctx.response.body = { message: `item with id ${id} not found` };
    ctx.response.status = 400;
    return;
  }
  bijuterii[index] = item;
  ctx.response.body = item;
  ctx.response.status = 200;
  broadcast({ event: 'updated', payload: { item } });
});

router.del('/item/:id', ctx => {
  const id = ctx.params.id;
  const index = bijuterii.findIndex(item => id === item.id);
  if (index !== -1) {
    const item = bijuterii[index];
    bijuterii.splice(index, 1);
    broadcast({ event: 'deleted', payload: { item } });
  }
  ctx.response.status = 204;
});

app.use(router.routes());
app.use(router.allowedMethods());

server.listen(3000);
