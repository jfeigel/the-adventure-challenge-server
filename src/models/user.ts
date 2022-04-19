import chalk from 'chalk';
import { Db, ObjectId } from 'mongodb';

import { collections } from '../services/database.services';
import { Editions } from '../models/adventure';

const COLLECTION_NAME = process.env.USERS_COLLECTION_NAME as string;

export type Identity = {
  connection: string;
  isSocial: boolean;
  provider: string;
  user_id: number;
};

export default class User {
  constructor(
    public name: string,
    public email: string,
    public identities?: Identity[],
    public editions?: Editions[],
    public id?: ObjectId
  ) {
    this.name = name;
    this.email = email;
    this.id = id;
    this.identities = identities;
    this.editions = editions;
  }
}

export async function initUsersCollection(db: Db) {
  await db.command({
    collMod: COLLECTION_NAME,
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'email'],
        additionalProperties: false,
        properties: {
          _id: {},
          name: {
            bsonType: 'string',
            description: "'name' is required and is a string"
          },
          email: {
            bsonType: 'string',
            description: "'email' is required and is a string"
          },
          identities: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              required: ['connection', 'isSocial', 'provider', 'user_id'],
              additionalProperties: false,
              properties: {
                connection: {
                  bsonType: 'string',
                  description: "'connection' is required and is a string"
                },
                isSocial: {
                  bsonType: 'bool',
                  description: "'isSocial' is required and is a boolean"
                },
                provider: {
                  bsonType: 'string',
                  description: "'provider' is required and is a string"
                },
                user_id: {
                  bsonType: 'int',
                  description: "'user_id' is required and is a int"
                }
              }
            }
          },
          editions: {
            bsonType: 'array',
            items: {
              enum: ['couples', 'family'],
              description:
                "'editions' must be one of the values listed and is optional"
            }
          }
        }
      }
    }
  });

  collections.users = db.collection(COLLECTION_NAME);

  console.log(
    `Successfully initialized collection ${chalk.green.dim(
      collections.users.collectionName
    )}`
  );
}
