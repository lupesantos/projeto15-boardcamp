import express from 'express';
import pg from 'pg';
import dayjs from 'dayjs';

const { Pool } = pg;

const connection = new Pool({
	user: 'postgres',
	host: 'localhost',
	port: 5432,
	database: 'boardcamp',
	password: '6792840',
});

const server = express();
server.use(express.json());

server.post('/status', (req, res) => {
	console.log('ok');
	res.send('ok2');
});

server.post('/categories', async (req, res) => {
	const { name } = req.body;
	console.log(name);

	try {
		await connection.query('INSERT INTO categories (name) VALUES ($1);', [
			name,
		]);
		res.sendStatus(201);
	} catch (error) {
		console.log(error);
	}
});

server.get('/categories', async (req, res) => {
	const categorias = await connection.query('SELECT * FROM categories;');

	console.log(categorias.rows);
	res.send(categorias.rows);
});

server.post('/games', async (req, res) => {
	const { name, image, stockTotal, categoryId, pricePerDay } = req.body;

	try {
		await connection.query(
			'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);',
			[name, image, stockTotal, categoryId, pricePerDay]
		);
		res.sendStatus(201);
	} catch (error) {
		console.log(error);
	}
});

server.get('/games', async (req, res) => {
	const games = await connection.query('SELECT * FROM games;');

	console.log(games.rows);
	res.send(games.rows);
});

server.post('/customers', async (req, res) => {
	const { name, phone, cpf, birthday } = req.body;

	try {
		await connection.query(
			'INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);',
			[name, phone, cpf, birthday]
		);
		res.sendStatus(201);
	} catch (error) {
		console.log(error);
	}
});

server.get('/customers', async (req, res) => {
	const customers = await connection.query('SELECT * FROM customers;');

	res.send(customers.rows);
});

server.get('/customers/:id', async (req, res) => {
	const { id } = req.params;
	console.log(id);
	const customer = await connection.query(
		'SELECT * FROM customers WHERE id = $1;',
		[id]
	);

	res.send(customer.rows[0]).status(200);
});

server.put('/customers/:id', async (req, res) => {
	const { name, phone, cpf, birthday } = req.body;
	const { id } = req.params;
	console.log(id);
	const customer = await connection.query(
		'UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5;',
		[name, phone, cpf, birthday, id]
	);

	res.sendStatus(200);
});

server.post('/rentals', async (req, res) => {
	const { customerId, gameId, daysRented } = req.body;
	let now = dayjs();
	const rentDate = now.format('YYYY-MM-DD');
	const returnDate = null;
	const delayFee = null;

	//consulta o price per day
	const pricePerDay = await connection.query(
		'SELECT games."pricePerDay" FROM games WHERE id = $1;',
		[gameId]
	);

	const originalPrice = pricePerDay.rows[0].pricePerDay * daysRented;

	try {
		await connection.query(
			'INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7);',
			[
				customerId,
				gameId,
				rentDate,
				daysRented,
				returnDate,
				originalPrice,
				delayFee,
			]
		);
		res.sendStatus(201);
	} catch (error) {
		console.log(error);
	}
});

server.get('/rentals', async (req, res) => {
	const rentals = await connection.query('SELECT rentals.*,  FROM rentals;');

	res.send(rentals.rows);
});

server.listen(4000, () => {
	console.log('Magic happens on 4000!');
});
