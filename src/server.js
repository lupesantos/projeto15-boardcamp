import express from 'express';
import cors from 'cors';
import categoriesRouter from './routers/categoriesRouter.js';
import customersRouter from './routers/customersRouter.js';
import gamesRouter from './routers/gamesRouter.js';
import rentalsRouter from './routers/rentalsRouter.js';

const server = express();
server.use(cors());
server.use(express.json());

server.use(categoriesRouter);
server.use(customersRouter);
server.use(gamesRouter);
server.use(rentalsRouter);

server.listen(4000, () => {
	console.log('Magic happens on 4000!');
});
