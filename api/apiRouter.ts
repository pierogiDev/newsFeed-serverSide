import 'dotenv/config';

import express from "express";
import {checkJwt} from "../middleware/check-jwt.js";

import {currentTimeReadable} from "@pierogi.dev/readable_time"
import {decodeJwt} from "../functions/jwtDecode.js";

import {User} from "../models/user.js"

import type {feedObject} from "../types";

export const apiRouter = express.Router();

//TODO To no use the users table.
//TODO To use then method chain with sql query.

apiRouter.post('/addWord', checkJwt, async (req: express.Request, res: express.Response) => {
    console.log(`${currentTimeReadable()} | Access to /api/addWord endpoint.`);

    let auth0Id: string | undefined = req.headers.authorization ? decodeJwt(req.headers.authorization).sub : '';
    let addRequestWord: string = req.body.addWord ? req.body.addWord : '';
    let addResult: boolean = false;

    if (!await User.ensureDbMatching(auth0Id)) {
        res.status(400).send();
    }

    if (auth0Id) {
        addResult = await User.addFeed(auth0Id, addRequestWord);
    }

    if (addResult) {
        console.log(`${currentTimeReadable()} | The user's feed word is recorded successfully.`);
        res.status(200).send()
    } else {
        console.log(`${currentTimeReadable()} | The word has already been recorded.`);
        res.status(400).send();
    }

});

apiRouter.post('/deleteWord', checkJwt, async (req: express.Request, res: express.Response) => {
    console.log(`${currentTimeReadable()} | Access to /api/deleteWord endpoint. | Request word : ${req.body.deleteWord}`);

    let auth0Id: string | undefined = req.headers.authorization ? decodeJwt(req.headers.authorization).sub : '';
    let deleteRequestWord: string = req.body.deleteWord ? req.body.deleteWord : '';
    let deleteResult: boolean = false;

    if (!await User.ensureDbMatching(auth0Id)) {
        res.status(400).send();
    }

    if (auth0Id) {
        deleteResult = await User.deleteFeed(auth0Id, deleteRequestWord);
    }

    if (deleteResult) {
        console.log(`${currentTimeReadable()} | The user's feed word has been deleted successfully.`);
        res.status(200).send();
    } else {
        res.status(400).send();
    }

});


apiRouter.get('/myfeed', checkJwt, async (req: express.Request, res: express.Response) => {
    console.log(`${currentTimeReadable()} | /api/myfeed endpoint is accessed.`);

    let auth0Id: string | undefined = req.headers.authorization ? decodeJwt(req.headers.authorization).sub : '';

    if (!await User.ensureDbMatching(auth0Id)) {
        res.status(400).send();
    }

    if (auth0Id) {
        let userFeeds: feedObject = await User.getMyFeeds(auth0Id);
        res.status(200).send(userFeeds);
    }

});
