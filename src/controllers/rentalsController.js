import connection from '../postgres/postgres.js';
import dayjs from 'dayjs';

const postRentals = async (req, res) => {
	const { customerId, gameId, daysRented } = req.body;
	let now = dayjs();
	const rentDate = now.format('YYYY-MM-DD');
	const returnDate = null;
	const delayFee = null;

	const existe = await connection.query(
		`
	SELECT * FROM customers WHERE customers.id = $1;
	`,
		[customerId]
	);

	if (existe.rows.length === 0) {
		return res.status(400).send('Usuário não cadastrado!');
	}

	if (daysRented <= 0) {
		return res.status(400).send('Número de dias de aluguel inválido!');
	}
	const gamesTotal = await connection.query(
		`
	SELECT 
        games."stockTotal" 
	FROM
        games WHERE games.id = $1`,
		[gameId]
	);

	const gamesRented = await connection.query(
		`
	SELECT 
		rentals.*, games."stockTotal" 
	FROM rentals 
	  JOIN games 
	    ON games.id = rentals."gameId" 
	  WHERE "gameId" = $1;`,
		[gameId]
	);

	const available = gamesTotal.rows[0].stockTotal - gamesRented.rows.length;

	if (available === 0) {
		return res.status(400).send('Jogo fora de estoque!');
	}

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
};

const postRentalsReturnById = async (req, res) => {
	const { id } = req.params;
	let now = dayjs();
	const returnDate = now.format('YYYY-MM-DD');

	const existe = await connection.query(
		`
	SELECT * FROM rentals WHERE id = $1;`,
		[id]
	);

	if (existe.rows.length === 0) {
		return res.status(404).send('Aluguel não existente!');
	}

	const rentalChecked = await connection.query(
		`SELECT rentals.*, games."stockTotal" FROM rentals JOIN games ON games.id = rentals."gameId" WHERE rentals.id = $1;
	`,
		[id]
	);

	if (rentalChecked.rows[0].returnDate !== null) {
		return res.status(400).send('Aluguel finalizado');
	}

	const pricePerDayByRental = await connection.query(
		`
	SELECT games."pricePerDay"
	FROM rentals
		JOIN games
			ON rentals."gameId" = games.id WHERE rentals.id = $1;`,
		[id]
	);

	const rentDateByRental = await connection.query(
		`
	SELECT rentals."rentDate"
	FROM rentals WHERE id = $1;`,
		[id]
	);

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

		if (lateDays > 0) {
			const rental = await connection.query(
				`
				UPDATE rentals SET
					"returnDate" = $1,
					"delayFee" = $2
						WHERE id = $3;`,
				[returnDate, pricePerDayByRental.rows[0].pricePerDay * lateDays, id]
			);

			res.sendStatus(200);
		} else {
			const rental = await connection.query(
				`
				UPDATE rentals SET
					"returnDate" = $1,
					"delayFee" = $2
						WHERE id = $3;`,
				[returnDate, 0, id]
			);

			res.sendStatus(200);
		}
	} catch (error) {
		console.log(error);
	}
};

const getRentals = async (req, res) => {
	const { customerId, gameId } = req.query;

	if (customerId) {
		const customersRentals = await connection.query(
			`
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
			ON games."categoryId" = categories.id WHERE "customerId" = $1;`,
			[customerId]
		);

		return res.send(customersRentals.rows);
	}

	if (gameId) {
		const gamesRentals = await connection.query(
			`
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
			ON games."categoryId" = categories.id WHERE "gameId" = $1;`,
			[gameId]
		);

		return res.send(gamesRentals.rows);
	}

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
};

const deleteRentals = async (req, res) => {
	const { id } = req.params;

	const existe = await connection.query(
		`
	SELECT * FROM rentals WHERE id = $1;`,
		[id]
	);

	if (existe.rows.length === 0) {
		return res.status(404).send('Aluguel não existente!');
	}

	const rentalChecked = await connection.query(
		`SELECT rentals.*, games."stockTotal" FROM rentals JOIN games ON games.id = rentals."gameId" WHERE rentals.id = $1;
	`,
		[id]
	);

	if (rentalChecked.rows[0].returnDate === null) {
		return res.status(400).send('Aluguel em aberto');
	}
	try {
		const deleteRental = await connection.query(
			`
		DELETE FROM rentals WHERE id = $1;
		`,
			[id]
		);

		res.send(200);
	} catch (error) {
		console.log(error);
	}
};

export { postRentals, postRentalsReturnById, getRentals, deleteRentals };
