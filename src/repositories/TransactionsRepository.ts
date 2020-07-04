import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();
    const balance = transactions.reduce<Balance>(
      (prev, curr) => {
        if (curr.type === 'income') {
          return {
            income: prev.income + curr.value,
            outcome: prev.outcome,
            total: prev.total + curr.value,
          };
        }
        return {
          income: prev.income,
          outcome: prev.outcome + curr.value,
          total: prev.total - curr.value,
        };
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );
    return balance;
  }
}

export default TransactionsRepository;
