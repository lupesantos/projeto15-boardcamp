import connection from '../postgres/postgres.js';
import Joi from 'joi';

const customerSchema = Joi.object({
	name: Joi.string().required(),
	phone: Joi.string().regex(/^\d+$/).min(10).max(11),
	cpf: Joi.string().regex(/^\d+$/).min(11).max(11),
	birthday: Joi.string().isoDate(),
});

const postCustomer = async (req, res) => {
	const { name, phone, cpf, birthday } = req.body;

	const validation = customerSchema.validate(
		{ name, phone, cpf, birthday },
		{ abortEarly: false }
	);

	if (validation.error) {
		const errors = validation.error.details
			.map((value) => value.message)
			.join(',');

		return res.status(400).send(errors);
	}

	try {
		const existe = await connection.query(
			'SELECT customers.id FROM customers WHERE cpf = $1;',
			[cpf]
		);

		if (existe.rows.length !== 0) {
			return res.status(409).send('Cpf já cadastrado');
		}
		await connection.query(
			'INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);',
			[name, phone, cpf, birthday]
		);
		res.sendStatus(201);
	} catch (error) {
		console.log(error);
	}
};

const getCustomer = async (req, res) => {
	const customers = await connection.query('SELECT * FROM customers;');

	const { cpf } = req.query;

	if (cpf) {
		const cpfsFiltrados = customers.rows.filter(
			(customer) => customer.cpf.toLowerCase().indexOf(cpf.toLowerCase()) >= 0
		);

		return res.send(cpfsFiltrados);
	} else {
		res.send(customers.rows);
	}
};

const getCustomerById = async (req, res) => {
	const { id } = req.params;
	const customer = await connection.query(
		'SELECT * FROM customers WHERE id = $1;',
		[id]
	);

	if (customer.rows.length === 0) {
		return res.send('Cliente não existente').status(404);
	}

	res.send(customer.rows[0]).status(200);
};

const putCustomerById = async (req, res) => {
	const { name, phone, cpf, birthday } = req.body;
	const { id } = req.params;

	const validation = customerSchema.validate(
		{ name, phone, cpf, birthday },
		{ abortEarly: false }
	);

	if (validation.error) {
		const errors = validation.error.details
			.map((value) => value.message)
			.join(',');

		return res.status(400).send(errors);
	}

	try {
		const existe = await connection.query(
			'SELECT customers.id FROM customers WHERE cpf = $1;',
			[cpf]
		);

		if (existe.rows.length !== 0) {
			const customer = await connection.query(
				'UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5;',
				[name, phone, cpf, birthday, id]
			);

			res.sendStatus(200);
		} else {
			return res.status(409).send('Cliente não consta no sistema');
		}
	} catch (error) {
		console.log(error);
	}
};

export { postCustomer, getCustomer, getCustomerById, putCustomerById };
