import express from 'express';
import cors from 'cors';
import {
	getCategories,
	postCategories,
} from './controllers/categoriesController.js';
import { getGames, postGames } from './controllers/gamesController.js';
import {
	getCustomer,
	postCustomer,
	getCustomerById,
	putCustomerById,
} from './controllers/customersController.js';
import {
	postRentals,
	getRentals,
	deleteRentals,
	postRentalsReturnById,
} from './controllers/rentalsController.js';

const server = express();
server.use(cors());
server.use(express.json());

server.post('/categories', postCategories);

server.get('/categories', getCategories);

server.post('/games', postGames);

server.get('/games', getGames);

server.post('/customers', postCustomer);

server.get('/customers', getCustomer);

server.get('/customers/:id', getCustomerById);

server.put('/customers/:id', putCustomerById);

server.post('/rentals', postRentals);

server.post('/rentals/:id/return', postRentalsReturnById);

server.get('/rentals', getRentals);

server.delete('/rentals/:id', deleteRentals);

server.listen(4000, () => {
	console.log('Magic happens on 4000!');
});
