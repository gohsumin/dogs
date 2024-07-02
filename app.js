import cors from '@koa/cors';
import koaFavicon from 'koa-favicon';
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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let prevSearch = "";
let scrollLeft = 0;
const breeds = await getBreeds();

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
    debug: false,
})

// routes //
router.get('/', index);
router.post('/', search);
router.get('/404', notFound);
router.get('/:breed', showImage);

// list of things
async function index(ctx) {
    await ctx.render('index', {
        breeds: breeds,
        prevSearch: prevSearch,
        scrollLeft: scrollLeft
    });
}

// apply search
async function search(ctx) {
    const body = ctx.request.body;
    const breed = body.breed;
    scrollLeft = body.scrollLeft;
    prevSearch = breed;
    ctx.redirect('/' + breed);
}

// show dog image
async function showImage(ctx) {
    const breed = ctx.request.params.breed.toLowerCase().trim();
    const activity = await getActivity();
    let res = null;
    let noError = true;
    try {
        res = await getImage(breed);
    }
    catch (err) {
        console.log(err);
        noError = false;
    }
    if (noError && res && (res.status === "success")) {
        await ctx.render('dog', {
            breeds: breeds,
            breed: breed,
            activity: activity,
            image: res.message,
            prevSearch: breed,
            scrollLeft: scrollLeft
        });
    }
    else {
        ctx.redirect('/404');
    }
}

// 404 page
async function notFound(ctx) {
    await ctx.render('notFound', {
        breeds: breeds,
        prevSearch: prevSearch,
        scrollLeft: scrollLeft
    });
}

// return random image url for the dog breed
async function getImage(breed) {
	const res = await fetch(`https://dog.ceo/api/breed/${breed}/images/random`);
	const json = await res.json();
	return json;
}

// return random activity
async function getActivity() {
    try {
        const res = await fetch('https://api.adviceslip.com/advice');
        const json = await res.json();
        return json.slip.advice;
    }
    catch (err) {
        return "Drink tea";
    }
}

// return every dog breed that can be found on dog.ceo
async function getBreeds() {
    try {
        const res = await fetch('https://dog.ceo/api/breeds/list/all');
        const json = await res.json();
        const keys = Object.keys(json.message);
        return keys;
    }
    catch (err) {
        return new Error(err);
    }
}

// middleware for serving a favicon
app.use(koaFavicon(__dirname + '/public/assets/favicon.ico'));

// middleware for serving static files to client
app.use(serve(__dirname + '/public'));

// middleware for routing
app.use(router.routes()).use(router.allowedMethods());

app.listen(process.env.PORT||3011, '0.0.0.0');
