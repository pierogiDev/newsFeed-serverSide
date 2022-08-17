import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import {checkJwt} from "../middleware/check-jwt.js";
import {pool} from "../connections/getMysqlConnection.js";
import {currentTimeReadable} from "@pierogi.dev/readable_time"

import type {RowDataPacket, OkPacket} from "../connections/getMysqlConnection";
import {decodeJwt} from "../functions/jwtDecode.js";

export const apiRouter = express.Router();

apiRouter.post('/addWord', checkJwt, async (req: express.Request, res: express.Response) => {
    console.log(`${currentTimeReadable()} | /api/addWord endpoint is accessed.`);

    let mysqlRes: RowDataPacket[] | OkPacket = [];
    let auth0Id: string | undefined = req.headers.authorization ? decodeJwt(req.headers.authorization).sub : '';
    let addRequestWord: string = req.body.addWord ? req.body.addWord : '';
    let feedWordId: number = 0;

    try {
        [mysqlRes] = await pool.query<RowDataPacket[]>(`SELECT auth0Id from newsFeed.users WHERE auth0Id = ?`, auth0Id);
    } catch {
        console.log('An error occurred during an executing select auth0Id query.');
    }

    if (mysqlRes.length === 0) {
        try {
            await pool.query('INSERT INTO newsFeed.users SET ?', {auth0Id: auth0Id});
            console.log('A new user\'s auth0Id is recorded.');
        } catch (error) {
            throw new Error('An error occurred during an executing insert auth0Id query.');
        }
    } else {
        console.log('The auth0Id has already recorded.');
    }

    try {
        [mysqlRes] = await pool.query<RowDataPacket[]>(`SELECT feedWordId from newsFeed.words WHERE word = ?`, addRequestWord);
    } catch {
        console.log('An error occurred during an executing select feed word query.');
    }

    if (mysqlRes.length === 0) {
        try {
            [mysqlRes] =　await pool.query<OkPacket>(`INSERT INTO newsFeed.words SET ?`, {word: addRequestWord});
            feedWordId = mysqlRes.insertId;
        } catch {
                console.log('An error occurred during an executing insert add request word.');
        }
    } else {
        feedWordId = mysqlRes[0].feedWordId;
    }

    if (auth0Id && feedWordId) {
        try {
            await pool.query(`INSERT INTO newsFeed.userFeedWords SET ?`, {auth0Id: auth0Id, feedWordId: feedWordId});
        } catch {
            console.log('An error occurred during an executing insert data into userFeedWords.');
        }
    }

});

apiRouter.get('/ensureDbMatching', checkJwt, async (req: express.Request, res: express.Response) => {
    console.log('/api/ensureDbMatching endpoint is accessed.');

    let mysqlRes: RowDataPacket[] = [];
    let auth0Id: string | undefined = req.headers.authorization ? decodeJwt(req.headers.authorization).sub : '';

    try {
        [mysqlRes] = await pool.query<RowDataPacket[]>(`SELECT auth0Id FROM newsFeed.users WHERE auth0Id = ?`, auth0Id);
    } catch {
        console.log('An error occurred during an executing select auth0Id query.');
    }

    if (mysqlRes.length === 0) {

        try {
            await pool.query('INSERT INTO newsFeed.users SET ?', {auth0Id: auth0Id});
            console.log('A new user\'s auth0Id is recorded.');
        } catch {
            console.log('An error occurred during an executing insert auth0Id query.');
        }

    } else {
        console.log('The auth0Id has already recorded.');
    }
});
