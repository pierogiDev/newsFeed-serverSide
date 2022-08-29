import * as dotenv from "dotenv";
dotenv.config();
import axios, {AxiosResponse} from "axios";
import express from "express";
import cors from "cors";
import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import path from "path";
import Helmet from "helmet";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import nocache from "nocache";
import {apiRouter} from './api/apiRouter.js'

import {currentTimeReadable} from "./functions/currentTimeReadable.js";
import {getJpNewsByCategories} from "./functions/getJpNewsByCategories.js";

import type {returnOfGetJpNewsByCategories} from './types';

const app: express.Express = express();

//
//Make the feedApi server that returns news data.
//
const allowedOrigins: Array<string> = ["http://localhost:3000"];
const options: cors.CorsOptions = {
    credentials: true,
    origin: allowedOrigins,
}

app.use(cors(options));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(cookieParser());

app.use(nocache());
app.use(Helmet());

// const apiRouter: express.Router = express.Router();
app.use('/api', apiRouter);

app.get("/", async (req: express.Request, res: express.Response) => {
    res.send(returnOfGetJpNewsByCategories);
});

app.get("/query", async (req: express.Request, res: express.Response) => {
    console.log(`${currentTimeReadable()} | Call query api. | Query : ${req.query.query}`);
    axios.get(encodeURI(`https://newsapi.org/v2/everything?q=${req.query.query}&apiKey=86414c1e4e4b4e7195657297a5f7a53d`))
        .then( (axiosResponse: AxiosResponse) => {
            console.log(`${currentTimeReadable()} | There are ${axiosResponse.data.articles.length} results.`);
            res.status(200).send(axiosResponse.data);
        }).catch( (error) => {
            console.error(error);
            res.status(400).send();
    });
});

app.get('/callback', (req: express.Request, res: express.Response) => {
    res.send('logged in');
})

let feedApiHttpServer: http.Server = http.createServer(app);
feedApiHttpServer.listen(4001);

let returnOfGetJpNewsByCategories: returnOfGetJpNewsByCategories = await getJpNewsByCategories();

//Get news periodically from the NewsAPI so as not to exceed its limitation.
// setTimeout( async () => {
//     returnOfGetJpNewsByCategories = await getJpNewsByCategories();
//     console.log(returnOfGetJpNewsByCategories.general[0]);
//     setInterval( async () => {
//         returnOfGetJpNewsByCategories = await getJpNewsByCategories();
//         console.log(returnOfGetJpNewsByCategories.general[0]);
//     }, 15 * 60 * 1000);
// }, 0);
