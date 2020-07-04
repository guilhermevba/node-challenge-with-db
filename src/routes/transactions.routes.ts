import { Router } from 'express';

import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import AppError from '../errors/AppError';
import uploadConfig from '../config/upload';
// import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const upload = multer(uploadConfig);
const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  try {
    const transactions = await transactionsRepository.find();
    const balance = await transactionsRepository.getBalance();
    return response.json({ transactions, balance });
  } catch (err) {
    return response.status(400).json({ status: 'error', message: err.message });
  }
});

transactionsRouter.post('/', async (request, response) => {
  const { title, type, category, value } = request.body;
  try {
    const createTransaction = new CreateTransactionService();
    const transaction = await createTransaction.execute({
      title,
      type,
      category,
      value,
    });
    return response.json(transaction);
  } catch (err) {
    if (err instanceof AppError) {
      return response
        .status(err.statusCode)
        .json({ message: err.message, status: 'error' });
    }
    console.error(err);
    return response.status(500).json(err);
  }
});

transactionsRouter.delete('/:id', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  await transactionsRepository.delete(request.params.id);
  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const importTransactions = new ImportTransactionsService();
    try {
      const transactions = await importTransactions.execute({
        filePath: request.file.path,
      });
      return response.json(transactions);
    } catch (err) {
      if (err instanceof AppError) {
        return response
          .status(err.statusCode)
          .json({ status: 'error', message: err.message });
      }
      console.error(err);
      return response.status(500).json({ error: err });
    }
  },
);

export default transactionsRouter;
