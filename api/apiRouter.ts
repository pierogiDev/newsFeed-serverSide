import 'dotenv/config';

import express from "express";
import {checkJwt} from "../middleware/check-jwt.js";

import {currentTimeReadable} from "@pierogi.dev/readable_time"
import {decodeJwt} from "../functions/jwtDecode.js";

import type {feedObject} from "../types";
import {userFeeds} from "../models/userFeeds.js";

export const apiRouter = express.Router();

apiRouter.post('/addWord', checkJwt, async (req: express.Request, res: express.Response) => {
    console.log(`${currentTimeReadable()} | Access to /api/addWord endpoint.`);

    let auth0Id: string | undefined = req.headers.authorization ? decodeJwt(req.headers.authorization).sub : undefined;
    let addRequestWord: string = req.body.addWord ? req.body.addWord : '';
    let addResult: boolean = false;

    if (auth0Id) {
        addResult = await userFeeds.recordUserFeed(auth0Id, addRequestWord);
    } else {
        res.status(400).send();
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

    let auth0Id: string | undefined = req.headers.authorization ? decodeJwt(req.headers.authorization).sub : undefined;
    let deleteRequestWord: string = req.body.deleteWord ? req.body.deleteWord : '';
    let deleteResult: boolean = false;

    if (auth0Id) {
        deleteResult = await userFeeds.deleteUserFeed(auth0Id, deleteRequestWord);
    } else {
        res.status(400).send();
    }

    if (deleteResult) {
        console.log(`${currentTimeReadable()} | The user's feed word has been deleted successfully.`);
        res.status(200).send();
    } else {
        console.log(`${currentTimeReadable()} | Some error occurred while deleting a user's feed word.`);
        res.status(400).send();
    }

});

apiRouter.get('/myfeed', checkJwt, async (req: express.Request, res: express.Response) => {
    console.log(`${currentTimeReadable()} | /api/myfeed endpoint is accessed.`);

    let auth0Id: string | undefined = req.headers.authorization ? decodeJwt(req.headers.authorization).sub : undefined;

    if (auth0Id) {
        let allFeedsOfUser: feedObject = await userFeeds.getAllFeedsOfUser(auth0Id);
        res.status(200).send(allFeedsOfUser);
    } else {
        res.status(400).send();
    }

});
