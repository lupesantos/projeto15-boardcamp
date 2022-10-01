import express from 'express';
import pg from 'pg';
import dayjs from 'dayjs';
import Joi from 'joi';

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

const categorieSchema = Joi.object({
	name: Joi.string().required(),
});

server.post('/status', (req, res) => {
	console.log('ok');
	res.send('ok2');
});

server.post('/categories', async (req, res) => {
	const { name } = req.body;
	console.log(name);

	const validation = categorieSchema.validate({ name });

	if (validation.error) {
		const errors = validation.error.details
			.map((value) => value.message)
			.join(',');

		return res.status(400).send(errors);
	}

	try {
		const existe = await connection.query(
			'SELECT categories.id FROM categories WHERE name = $1;',
			[name]
		);

		if (existe.rows.length !== 0) {
			return res.status(409).send('Categoria já existe');
		}

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
	const games = await connection.query(
		`SELECT 
			games.*, 
			categories.name AS "categoryName"
		FROM games JOIN categories ON games."categoryId" = categories.id;`
	);

	const { name } = req.query;

	if (name) {
		const gamesFiltrados = games.rows.filter(
			(game) => game.name.toLowerCase().indexOf(name.toLowerCase()) >= 0
		);

		return res.send(gamesFiltrados);
	} else {
		res.send(games.rows);
	}
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

server.post('/rentals/:id/return', async (req, res) => {
	const { id } = req.params;
	let now = dayjs();
	const returnDate = now.format('YYYY-MM-DD');

	//consulta o price per day atraves do rentals (id)
	const pricePerDayByRental = await connection.query(
		`
	SELECT games."pricePerDay"
	FROM rentals
		JOIN games
			ON rentals."gameId" = games.id WHERE rentals.id = $1;`,
		[id]
	);
	//consulta o rent date atraves do rentals (id)
	const rentDateByRental = await connection.query(
		`
	SELECT rentals."rentDate"
	FROM rentals WHERE id = $1;`,
		[id]
	);

	//consulta days rented
	const daysRented = await connection.query(
		`
	SELECT rentals."daysRented"
	FROM rentals WHERE id = $1;`,
		[id]
	);

	try {
		const data1 = new Date(rentDateByRental.rows[0].rentDate);
		const data2 = new Date(returnDate);
		const diffTime = Math.abs(data2 - data1);
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		const lateDays = diffDays - daysRented.rows[0].daysRented;

		console.log(lateDays);

		const rental = await connection.query(
			`
			UPDATE rentals SET
				"returnDate" = $1, 
				"delayFee" = $2 
					WHERE id = $3;`,
			[returnDate, pricePerDayByRental.rows[0].pricePerDay * lateDays, id]
		);

		res.send(returnDate);
	} catch (error) {
		console.log(error);
	}
});

server.get('/rentals', async (req, res) => {
	const rentals = await connection.query(`
	SELECT
		rentals.*,
		customers.id AS "customerId",
		customers.name AS "customerName",
		games.name AS "gameName",
		games."categoryId",
		categories.name AS "categoryName"
	FROM rentals
		JOIN customers
			ON rentals."customerId" = customers.id
		JOIN games
			ON rentals."gameId" = games.id
		JOIN categories
			ON games."categoryId" = categories.id;`);

	res.send(rentals.rows);
});

server.delete('/rentals/:id', async (req, res) => {
	const { id } = req.params;

	const deleteRental = await connection.query(
		`
	DELETE FROM rentals WHERE id = $1;
	`,
		[id]
	);

	res.send(200);
});

server.listen(4000, () => {
	console.log('Magic happens on 4000!');
});
