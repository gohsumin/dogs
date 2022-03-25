import cors from '@koa/cors';
import _fetch from 'isomorphic-fetch';
import { fileURLToPath } from 'url';
import json from 'koa-json';
import Koa from 'koa';
import koaBodyparser from 'koa-bodyparser';
import KoaRouter from 'koa-router';
import * as path from 'path';
import render from 'koa-ejs';
import serve from 'koa-static';

const app = new Koa();
const router = new KoaRouter();
const things = ["peace", "dream", "love"];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middleware to add cors origin
app.use(cors({ origin: '*' }));

// middleware to format json
app.use(json());

// middleware for body-parsing
app.use(koaBodyparser());

// middleware for more-detailed error messages
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (error) {
        ctx.status = error.statusCode || error.status || 500;
        ctx.body = {
            message: error.message
        };
    }
});


render(app, {
    root: path.join(__dirname, 'public/views'),
    layout: 'layout',
    viewExt: 'html',
    cache: false,
    debug: false
})

// routes //
router.get('/', index);
router.post('/', search);
router.get('/add', showAdd);
router.post('/add', add);
router.get('/:breed', showImage);

// list of things
async function index(ctx) {
    await ctx.render('index', {
        title: "title",
        things: things
    });
}

// apply search
async function search(ctx) {
    const body = ctx.request.body;
    ctx.redirect('/' + body.breed);
}

// show add
async function showAdd(ctx) {
    await ctx.render('add');
}

// post add change
async function add(ctx) {
    const body = ctx.request.body;
    things.push(body.thing);
    ctx.redirect('/');
}

// show dog image
async function showImage(ctx) {
    const breed = ctx.request.params.breed;
    const img = await getImage(breed);
    await ctx.render('dog', {
        breed: breed,
        image: img
    });
}

// return random image url for the dog breed
async function getImage(breed) {
    const res = await fetch(`https://dog.ceo/api/breed/${breed}/images/random`);
    const img = await res.json();
    return img.message;
}

// middleware for serving static files to client
app.use(serve(__dirname + '/public'));

// router middleware
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => console.log('Server started at http://localhost:3000'));
