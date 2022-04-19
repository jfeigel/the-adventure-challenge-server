import chalk from 'chalk';
import { Db, ObjectId } from 'mongodb';

import { collections } from '../services/database.services';

const COLLECTION_NAME = process.env.ADVENTURES_COLLECTION_NAME as string;

export enum Editions {
  COUPLES = 'couples',
  FAMILY = 'family'
}

export enum Icons {
  ACTIVE = 'active',
  AWAY = 'away',
  DAYLIGHT = 'daylight',
  FILMING = 'filming',
  GETWET = 'getWet',
  HOME = 'home',
  INDOORS = 'indoors',
  MEAL = 'meal',
  MESS = 'mess',
  NIGHTTIME = 'nighttime',
  OUTDOORS = 'outdoors',
  PLANAHEAD = 'planAhead',
  SNACKS = 'snacks',
  SUPPLIES = 'supplies'
}

export default class Adventure {
  constructor(
    public userId: ObjectId,
    public name: string,
    public edition: Editions,
    public order: number,
    public icons: Icons[],
    public cost: number[],
    public timeOfDay: string,
    public duration: number[],
    public durationUnits: string,
    public completed: boolean
  ) {
    this.userId = userId;
    this.name = name;
    this.edition = edition;
    this.order = order;
    this.icons = icons;
    this.cost = cost;
    this.timeOfDay = timeOfDay;
    this.duration = duration;
    this.durationUnits = durationUnits;
    this.completed = completed;
  }
}

export async function initAdventuresCollection(db: Db) {
  await db.command({
    collMod: COLLECTION_NAME,
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: [
          'userId',
          'name',
          'edition',
          'order',
          'icons',
          'cost',
          'timeOfDay',
          'duration',
          'durationUnits',
          'completed'
        ],
        additionalProperties: false,
        properties: {
          _id: {},
          userId: {
            bsonType: 'objectId',
            description: "'userId' is required and is an objectId"
          },
          name: {
            bsonType: 'string',
            description: "'name' is required and is a string"
          },
          edition: {
            enum: ['couples', 'family'],
            description:
              "'edition' must be one of the values listed and is required"
          },
          order: {
            bsonType: 'int',
            description: "'order' is required and is an int"
          },
          icons: {
            bsonType: 'array',
            minItems: 1,
            uniqueItems: true,
            additionalProperties: false,
            items: {
              enum: [
                'active',
                'away',
                'daylight',
                'filming',
                'getWet',
                'home',
                'indoors',
                'meal',
                'mess',
                'nighttime',
                'outdoors',
                'planAhead',
                'snacks',
                'supplies'
              ],
              description:
                "'icons' must be one of the values listed and is required"
            }
          },
          cost: {
            bsonType: 'array',
            minItems: 1,
            uniqueItems: true,
            additionalProperties: false,
            items: {
              bsonType: 'int',
              description: "'cost' is required and is an int"
            }
          },
          timeOfDay: {
            bsonType: 'string',
            description: "'timeOfDay' is required and is a string"
          },
          duration: {
            bsonType: 'array',
            minItems: 1,
            uniqueItems: true,
            additionalProperties: false,
            items: {
              bsonType: 'int',
              description: "'duration' is required and is an int"
            }
          },
          durationUnits: {
            bsonType: 'string',
            description: "'durationUnits' is required and is a string"
          },
          completed: {
            bsonType: 'bool',
            description: "'completed' is required and is a bool"
          },
          photo: {
            bsonType: 'string',
            description: "'photo' is an optional field of type string"
          },
          notes: {
            bsonType: 'string',
            description: "'notes' is an optional field of type string"
          }
        }
      }
    }
  });

  collections.adventures = db.collection(COLLECTION_NAME);

  console.log(
    `Successfully initialized collection ${chalk.green.dim(
      collections.adventures.collectionName
    )}`
  );
}
