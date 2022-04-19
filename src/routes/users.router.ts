import Router from '@koa/router';
import { ObjectId } from 'mongodb';

import { MongoDBError, collections } from '../services/database.services';

import User from '../models/user';

const usersRouter = new Router({ prefix: '/users' });

usersRouter.get('/:id', async (ctx) => {
  try {
    const user = await collections.users?.findOne({
      _id: new ObjectId(ctx.params.id)
    });

    if (user) {
      ctx.status = 200;
      ctx.body = user;
    }
  } catch (err) {
    ctx.status = 404;
    throw new MongoDBError(`Unable to find user with id ${ctx.params.id}`);
  }
});

usersRouter.post('/', async (ctx) => {
  try {
    const newUser = ctx.request.body as User;

    const result = await collections.users?.updateOne(
      { email: newUser.email },
      { $set: newUser },
      { upsert: true }
    );

    if (!result) {
      ctx.status = 500;
      throw new MongoDBError('Failed to create a new user');
    } else if (result.matchedCount === 0) {
      ctx.status = 404;
      throw new MongoDBError(`Unable to find user with email ${newUser.email}`);
    } else {
      ctx.status = result.matchedCount === 0 ? 201 : 200;
      ctx.body = await collections.users?.findOne({
        email: newUser.email
      });
    }
  } catch (err) {
    ctx.status = 400;
    ctx.body = (err as Error).message;
  }
});

usersRouter.put('/:id', async (ctx) => {
  try {
    const updatedUser: User = ctx.request.body;

    const result = await collections.users?.updateOne(
      { _id: new ObjectId(ctx.params.id) },
      { $set: updatedUser }
    );

    if (!result) {
      ctx.status = 304;
      throw new MongoDBError(
        `Failed to update user with id ${ctx.request.body}`
      );
    } else {
      ctx.status = 200;
      ctx.body = result;
    }
  } catch (err) {
    ctx.status = 400;
    ctx.body = (err as Error).message;
  }
});

usersRouter.delete('/:id', async (ctx) => {
  try {
    const result = await collections.users?.deleteOne({
      _id: new ObjectId(ctx.params.id)
    });

    if (!result) {
      ctx.status = 400;
      throw new MongoDBError(`Failed to remove user with id ${ctx.params.id}`);
    } else if (!result.deletedCount) {
      ctx.status = 404;
      throw new MongoDBError(`Unable to find user with id ${ctx.params.id}`);
    } else {
      ctx.status = 202;
      ctx.body = `Successfully removed user with id ${ctx.params.id}`;
    }
  } catch (err) {
    ctx.status = 400;
    ctx.body = (err as Error).message;
  }
});

export default usersRouter;
