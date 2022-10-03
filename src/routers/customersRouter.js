import { Router } from 'express';

import {
	getCustomer,
	postCustomer,
	getCustomerById,
	putCustomerById,
} from '../controllers/customersController.js';

const customersRouter = Router();

customersRouter.post('/customers', postCustomer);

customersRouter.get('/customers', getCustomer);

customersRouter.get('/customers/:id', getCustomerById);

customersRouter.put('/customers/:id', putCustomerById);

export default customersRouter;
