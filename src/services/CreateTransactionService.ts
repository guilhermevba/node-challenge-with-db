// import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

interface Request {
  title: string;
  type: string;
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
    // TODO
  }
}

export default CreateTransactionService;
