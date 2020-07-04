// import AppError from '../errors/AppError';

import {
  getRepository,
  getCustomRepository,
  TransactionRepository,
} from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  category: string;
  value: number;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    category,
    value,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    if (type === 'outcome') {
      const balance = await transactionRepository.getBalance();
      if (balance.total < value) {
        throw new AppError('not enough funds');
      }
    }
    const categoryRepository = getRepository(Category);
    const foundCategory = await categoryRepository.findOne({
      where: { title: category },
    });
    let category_id: string;
    if (foundCategory) {
      category_id = foundCategory.id;
    } else {
      const newCategory = await categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(newCategory);
      category_id = newCategory.id;
    }

    const transaction = await transactionRepository.create({
      title,
      type,
      value,
      category_id,
    });
    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
