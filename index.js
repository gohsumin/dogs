import Koa from 'koa';
import Router from '@koa/router';
import serve from 'koa-static';
import cors from '@koa/cors';
import _fetch from 'isomorphic-fetch';

const app = new Koa();
const port = 3002;
const _ = new Router();
const array_size = 10;

app.use(cors({ origin: '*' }));

_.get('/:breed', ctx => {
	const type = ctx.params.breed;
	ctx.state.dog_type = type;
	_fetch(`https://dog.ceo/api/breed/${type}/images/random`)
		.then(res => {
			ctx.state.image = res.json().message;
		});
});

app.use(_.routes());

app.use(serve('./public'));

app.listen(port);