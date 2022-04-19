import chalk from 'chalk';
import { Collection, MongoClient } from 'mongodb';

import User, { initUsersCollection } from '../models/user';
import Adventure, { initAdventuresCollection } from '../models/adventure';

export const collections: {
  users?: Collection<User>;
  adventures?: Collection<Adventure>;
} = {};

export class MongoDBError extends Error {
  constructor(message?: string) {
    super();
    this.name = 'MongoDBError';
    this.message = message ?? '';
  }
}

export async function connectToDatabase() {
  if (!process.env.DB_CONN_STRING) {
    throw new Error('Environment variable "DB_CONN_STRING" not found');
  }
  if (!process.env.DB_NAME) {
    throw new Error('Environment variable "DB_NAME" not found');
  }

  const client = new MongoClient(process.env.DB_CONN_STRING);
  await client.connect();

  const db = client.db(process.env.DB_NAME);

  console.log(
    `Successfully connected to database ${chalk.green(db.databaseName)}`
  );

  await Promise.all([initUsersCollection(db), initAdventuresCollection(db)]);
}
