import 'dotenv/config';

import Koa from 'koa';
import koaBody from 'koa-body';
import cors from '@koa/cors';

import { connectToDatabase } from './services/database.services';
import adventuresRouter from './routes/adventures.router';
import usersRouter from './routes/users.router';

const app = new Koa();

app.use(koaBody());
app.use(cors());

app.use(async (ctx: Koa.Context, next: () => Promise<any>) => {
  try {
    await next();
  } catch (error: any) {
    ctx.status = error.statusCode || error.status;
    error.status = ctx.status;
    ctx.body = { error };
    ctx.app.emit('error', error, ctx);
  }
});

connectToDatabase()
  .then(() => {
    app.use(adventuresRouter.routes()).use(adventuresRouter.allowedMethods());
    app.use(usersRouter.routes()).use(usersRouter.allowedMethods());

    app.on('error', console.error);

    app.listen(process.env.PORT || 4000, () => console.info(`🚀 Server ready`));
  })
  .catch((err: Error) => {
    console.error('Failed to connect to the database', err);
    process.exit();
  });
