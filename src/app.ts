import express from 'express';
import path from 'path';
import 'reflect-metadata';
import { AppRouter } from './routes';
import './controllers';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(AppRouter.getInstance());
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000);

export default app;
