import csvParser from 'csv-parse';
import fs from 'fs';
import { getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  filePath: string;
}

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  category: string;
  value: number;
}

const createMissingCategories = async (
  categories: string[],
): Promise<Category[]> => {
  const categoriesRepository = getRepository(Category);
  const existingCategories = await categoriesRepository.find({
    where: { title: In(categories) },
  });
  const newCategories = await categoriesRepository.create(
    categories
      .filter(
        category =>
          !existingCategories.map(({ title }) => title).includes(category),
      )
      .map(category => ({ title: category })),
  );
  await categoriesRepository.save(newCategories);

  return [...existingCategories, ...newCategories];
};

const saveTransactions = async (
  transactionsCsv: TransactionCSV[],
  categories: Category[],
): Promise<Transaction[]> => {
  const transactionsRepository = getRepository(Transaction);
  const transactions = await transactionsRepository.create(
    transactionsCsv.map(({ title, category, type, value }) => ({
      title,
      type,
      value,
      category: categories.find(c => c.title === category),
    })),
  );
  return transactionsRepository.save(transactions);
};
class ImportTransactionsService {
  async execute({ filePath }: Request): Promise<Transaction[]> {
    const transactionsCsv: TransactionCSV[] = [];
    const categories: string[] = [];
    const parser = csvParser({ from_line: 2 });
    const parseCsv = fs.createReadStream(filePath).pipe(parser);
    parseCsv.on('data', line => {
      const [title, type, valueString, category] = line.map((cell: string) =>
        cell.trim(),
      );
      const value = parseFloat(valueString);
      if (!categories.includes(category)) {
        categories.push(category);
      }
      transactionsCsv.push({ title, type, category, value });
    });
    await new Promise(resolve => parseCsv.on('end', resolve));

    const existingCategories = await createMissingCategories(categories);

    const transactions = await saveTransactions(
      transactionsCsv,
      existingCategories,
    );
    return transactions;
  }
}

export default ImportTransactionsService;
