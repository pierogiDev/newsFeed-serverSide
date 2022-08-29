import axios, {AxiosResponse} from "axios";
import {getMysqlConnection, OkPacket} from "@pierogi.dev/get_mysql_connection";

import type {RowDataPacket} from "@pierogi.dev/get_mysql_connection";
import type {feedObject} from "../types";
import {currentTimeReadable} from "@pierogi.dev/readable_time";

import {feedWord} from "./feedWord.js";
import {userFeeds} from "./userFeeds.js";

type user = {
    id: number,
    auth0Id: string,
}

export class User {

    constructor(
        public id: number,
        public auth0Id: string,
    ) {
    }

    static rawData(user: user): User {
        return new User(
            user.id,
            user.auth0Id,
        );
    }

    static async find(auth0Id: string): Promise<user> {
        const mysqlConnection = getMysqlConnection(true);
        let mysqlRes: RowDataPacket[] = [];
        [mysqlRes] = await mysqlConnection.query<RowDataPacket[]>(`SELECT *
                                                                   FROM newsFeed.users
                                                                   WHERE auth0Id = ?`, auth0Id);
        let userData: user = mysqlRes[0] && {id: mysqlRes[0].id, auth0Id: mysqlRes[0].auth0Id};

        return User.rawData(userData);
    }

    static async getMyFeeds(auth0Id: string): Promise<feedObject> {

        let allFeedWordsOfUser: Array<string> = [];
        let feedObject: feedObject = {};

        allFeedWordsOfUser = await userFeeds.getAllFeedWordsOfUser(auth0Id);

        for (const word of allFeedWordsOfUser) {
            try {
                let axiosResponse: AxiosResponse = await axios.get(encodeURI(`https://newsapi.org/v2/everything?q=${word}&apiKey=86414c1e4e4b4e7195657297a5f7a53d`));
                feedObject[word] = axiosResponse.data.articles;
            } catch (e) {
                console.error(e);
            }
        }

        return feedObject
    }

    static async deleteFeed(auth0Id: string, word: string): Promise<boolean> {
        let deleteResult: boolean = false;

        let deleteWordId = await feedWord.getWordId(word);

        if (deleteWordId) {
            deleteResult = await userFeeds.deleteUserFeed(auth0Id, deleteWordId);
        }

        return deleteResult;
    }

    static async addFeed(auth0Id: string, word: string): Promise<boolean> {
        let feedWordId: number | null = null;
        let addResult: boolean = false;

        //Check the word has already been recorded or not.
        let checkWord = await feedWord.isRecorded(word);

        //Set the feedWordId when the word has been recorded.
        if (checkWord) {
            feedWordId = await feedWord.getWordId(word);
        } else {
            //If the feedWordId has not been recorded, then record the word and set its id.
            feedWordId = await feedWord.recordFeedWord(word);
        }

        if (feedWordId) {
            addResult = await userFeeds.recordUserFeed(auth0Id, feedWordId)
        }

        return addResult;
    }

    static async ensureDbMatching(auth0Id: string | undefined): Promise<boolean> {

        if (auth0Id === undefined) {
            return false;
        }

        const mysqlConnection = getMysqlConnection(true);

        let [checkUser] = await mysqlConnection.query<RowDataPacket[]>(`SELECT auth0Id
                                 FROM newsFeed.users
                                 WHERE auth0Id = ?`, auth0Id);

        if (checkUser[0].length !== 0) {
            console.log(`${currentTimeReadable()} | A new user auth0Id has already been recorded.`);
            return true;
        } else {
            let insertResult = await mysqlConnection.query<OkPacket>('INSERT INTO newsFeed.users SET ?', {auth0Id: auth0Id});
            console.log(`${currentTimeReadable()} | A new user auth0Id is recorded.`);
            return !!insertResult[0].affectedRows;
        }

    }
}
