import 'dotenv/config';

import express from "express";
import axios from "axios";
import {pool} from "../connections/getMysqlConnection.js";
import {checkJwt} from "../middleware/check-jwt.js";

import {currentTimeReadable} from "@pierogi.dev/readable_time"
import {decodeJwt} from "../functions/jwtDecode.js";

import type {AxiosResponse} from "axios";
import type {article, arrayOfArticle, feedObject, returnOfMyfeed} from "../types";
import type {RowDataPacket, OkPacket} from "../connections/getMysqlConnection";

export const apiRouter = express.Router();

apiRouter.post('/addWord', checkJwt, async (req: express.Request, res: express.Response) => {
    console.log(`${currentTimeReadable()} | Access to /api/addWord endpoint.`);

    let mysqlRes: RowDataPacket[] | OkPacket = [];
    let auth0Id: string | undefined = req.headers.authorization ? decodeJwt(req.headers.authorization).sub : '';
    let addRequestWord: string = req.body.addWord ? req.body.addWord : '';
    let feedWordId: number = 0;

    //Check user id(auth0Id) has already been recorded or not.
    try {
        [mysqlRes] = await pool.query<RowDataPacket[]>(`SELECT auth0Id
                                                        from newsFeed.users
                                                        WHERE auth0Id = ?`, auth0Id);
    } catch {
        console.log('An error occurred during an executing select auth0Id query.');
    }

    if (mysqlRes.length === 0) {
        try {
            await pool.query<OkPacket>('INSERT INTO newsFeed.users SET ?', {auth0Id: auth0Id});
            console.log(`${currentTimeReadable()} | A new user\'s auth0Id is recorded.`);
        } catch (error) {
            console.error(error);
        }
    } else {
        console.log(`${currentTimeReadable()} | The auth0Id has already recorded.`);
    }

    //Check the word has already been recorded or not.
    try {
        [mysqlRes] = await pool.query<RowDataPacket[]>(`SELECT feedWordId
                                                        from newsFeed.words
                                                        WHERE word = ?`, addRequestWord);
    } catch {
        console.log('An error occurred during an executing select feed word query.');
    }

    if (mysqlRes.length === 0) {
        try {
            [mysqlRes] = await pool.query<OkPacket>(`INSERT INTO newsFeed.words
                                                     SET ?`, {word: addRequestWord});
            feedWordId = mysqlRes.insertId;
        } catch {
            console.log('An error occurred during an executing insert add request word.');
        }
    } else {
        feedWordId = mysqlRes[0].feedWordId;
    }

    if (auth0Id && feedWordId) {
        try {
            await pool.query<OkPacket>(`INSERT INTO newsFeed.userFeedWords
                                        SET ?`, {auth0Id: auth0Id, feedWordId: feedWordId});
            console.log(`${currentTimeReadable()} | The user's feed word is recorded successfully.`);
            res.status(200).send();
        } catch {
            console.log(`${currentTimeReadable()} | The word has already been recorded.`);
            res.status(400).send();
        }
    }

});

apiRouter.post('/deleteWord', checkJwt, async (req: express.Request, res: express.Response) => {
    console.log(`${currentTimeReadable()} | Access to /api/deleteWord endpoint.`);
    console.log(`${currentTimeReadable()} | Request word : ${req.body.deleteWord}`);

    let mysqlRes: RowDataPacket[] | OkPacket = [];
    let auth0Id: string | undefined = req.headers.authorization ? decodeJwt(req.headers.authorization).sub : '';
    let deleteRequestWord: string = req.body.deleteWord ? req.body.deleteWord : '';
    let feedWordId: number = 0;
    let deleteWordId: RowDataPacket[] = [];

    try {
        [deleteWordId] = await pool.query<RowDataPacket[]>(`SELECT feedWordId
                                                             FROM newsFeed.words
                                                             WHERE word = ?`, deleteRequestWord);
    } catch (error) {
        console.error(error);
    }

    if (deleteWordId.length !== 0) {
        try {
            await pool.query<OkPacket>(`DELETE
                                        FROM newsFeed.userFeedWords
                                        WHERE feedWordId = ?`, deleteWordId[0].feedWordId);
            res.status(200).send();
        } catch (error) {
            console.error(error);
            res.status(400).send();
        }
    }

});

apiRouter.get('/ensureDbMatching', checkJwt, async (req: express.Request, res: express.Response) => {
    console.log('/api/ensureDbMatching endpoint is accessed.');

    let mysqlRes: RowDataPacket[] = [];
    let auth0Id: string | undefined = req.headers.authorization ? decodeJwt(req.headers.authorization).sub : '';

    try {
        [mysqlRes] = await pool.query<RowDataPacket[]>(`SELECT auth0Id
                                                        FROM newsFeed.users
                                                        WHERE auth0Id = ?`, auth0Id);
    } catch {
        console.log(`${currentTimeReadable()} | An error occurred during an executing select auth0Id query.`);
    }

    if (mysqlRes.length === 0) {

        try {
            await pool.query<OkPacket>('INSERT INTO newsFeed.users SET ?', {auth0Id: auth0Id});
            console.log(`${currentTimeReadable()} | A new user\'s auth0Id is recorded.`);
        } catch {
            console.log(`${currentTimeReadable()} | An error occurred during an executing insert auth0Id query.`);
        }

    } else {
        console.log(`${currentTimeReadable()} | The auth0Id has already recorded.`);
    }
});

apiRouter.get('/myfeed', checkJwt, async (req: express.Request, res: express.Response) => {
    console.log(`${currentTimeReadable()} | /api/myfeed endpoint is accessed.`);

    let mysqlRes: RowDataPacket[] = [];
    let auth0Id: string | undefined = req.headers.authorization ? decodeJwt(req.headers.authorization).sub : '';
    let words: Array<string> = [];

    try {
        [mysqlRes] = await pool.query<RowDataPacket[]>(`SELECT word
                                                        from newsFeed.words
                                                        WHERE feedWordId = ANY
                                                              (SELECT feedWordId FROM newsFeed.userFeedWords WHERE auth0Id = ?)`, auth0Id);
    } catch {
        console.log(`${currentTimeReadable()} | There is no feed words.`);
    }

    mysqlRes.forEach((word) => {
        words.push(word.word);
    });

    let myfeedArticles: returnOfMyfeed = [];

    for (const word of words) {
        try {
            let response: AxiosResponse = await axios.get(encodeURI(`https://newsapi.org/v2/everything?q=${word}&apiKey=86414c1e4e4b4e7195657297a5f7a53d`));
            let feedObject: feedObject = {};
            feedObject[word] = response.data.articles;
            myfeedArticles.push(feedObject);
        } catch (e) {
            console.error(e);
        }
    }

    res.send(myfeedArticles);

});
