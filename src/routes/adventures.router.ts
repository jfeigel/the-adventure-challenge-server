import Router from '@koa/router';
import { writeFileSync } from 'fs';
import intersection from 'lodash/intersection.js';
import { MongoBulkWriteError, ObjectId } from 'mongodb';

import { MongoDBError, collections } from '../services/database.services';
import Adventure, { Editions } from '../models/adventure';
import path from 'path';

type PostRequest = { editions: string[]; userId: string };

const adventuresRouter = new Router({ prefix: '/adventures' });

adventuresRouter.get('/:id', async (ctx) => {
  try {
    const adventure = await collections.adventures?.findOne({
      _id: new ObjectId(ctx.params.id)
    });

    if (adventure) {
      ctx.status = 200;
      ctx.body = adventure;
    }
  } catch (err) {
    ctx.status = 404;
    throw new MongoDBError(`Unable to find adventure with id ${ctx.params.id}`);
  }
});

adventuresRouter.post('/', async (ctx) => {
  const userId: string = ctx.request.body.userId;
  const editions = (ctx.request.body.editions as string[]).map(
    (edition) => Editions[edition.toUpperCase() as keyof typeof Editions]
  );

  const invalidEditions: string[] = [];
  const editionsValid = editions.every((edition) => {
    if (!edition) invalidEditions.push(edition);
    return edition;
  });

  if (!editionsValid) {
    ctx.status = 404;
    throw new MongoDBError(
      `Unable to find edition${
        invalidEditions.length !== 1 ? 's' : ''
      } ${invalidEditions.join(', ')}`
    );
  }

  let user = undefined;
  try {
    user = await collections.users?.findOne({
      _id: new ObjectId(userId)
    });

    if (!user) {
      throw new Error();
    }

    const existingEditions = intersection(user.editions ?? [], editions);
    if (existingEditions.length !== 0) {
      ctx.status = 400;
      throw new MongoDBError(
        `Edition${
          existingEditions.length !== 1 ? 's' : ''
        } ${existingEditions.join(', ')} already exist${
          existingEditions.length === 1 ? 's' : ''
        } for user`
      );
    }
  } catch (err) {
    ctx.status = 404;
    throw new MongoDBError(`Unable to find user with id ${userId}`);
  }

  try {
    let adventuresData: Adventure[] = [];

    editions.forEach((edition) => {
      const adventures: Adventure[] = require(`../seeds/${edition}.json`);
      adventuresData = adventuresData.concat(
        adventures.map((adventure) => ({
          ...adventure,
          edition,
          userId: new ObjectId(userId)
        }))
      );
    });

    writeFileSync(
      path.join(process.cwd(), 'adventuresData.json'),
      JSON.stringify(adventuresData, null, 2)
    );

    const result = await collections.adventures?.insertMany(adventuresData);

    if (!result) {
      ctx.status = 500;
      throw new MongoDBError(`Failed to create new adventures`);
    } else {
      await collections.users?.updateOne(
        { _id: user._id },
        {
          $set: {
            ...user,
            editions: [...(user.editions ?? []), ...editions]
          }
        }
      );

      ctx.status = 201;
      ctx.body = result;
    }
  } catch (err) {
    console.log('error writing adventures to DB');
    console.log(JSON.stringify(err as MongoBulkWriteError, null, 2));
    ctx.status = 400;
    ctx.body = (err as Error).message;
  }
});

export default adventuresRouter;
