//Import package
//Import types
import type {AxiosResponse} from "axios"
import axios from "axios";

import type {OkPacket, RowDataPacket} from "@pierogi.dev/get_mysql_connection";
//Import package of my own made
import {getMysqlConnection} from "@pierogi.dev/get_mysql_connection";
import {unixTimeReadable} from "@pierogi.dev/readable_time";

//Import model
import {feedWord} from "./feedWord.js";
import type {feedList, myFeed, myFeedObject} from "../types";

export class userFeeds {
    static async recordUserFeed(auth0Id: string, word: string): Promise<boolean> {
        const mysqlConnection = getMysqlConnection(true);
        let feedWordId: number | null = null;

        //Check the word has already been recorded or not.
        let checkWord = await feedWord.isRecorded(word);

        //Set the feedWordId when the word has been recorded.
        if (checkWord) {
            feedWordId = await feedWord.getWordId(word);
        } else {
            //If the feedWordId has not been recorded, then record the word and set its id.
            feedWordId = await feedWord.recordFeedWord(word);
        }

        let recordedAt: string = unixTimeReadable((new Date().getTime() / 1000));

        let result: boolean = false;

        await mysqlConnection.query<OkPacket>(`INSERT INTO newsFeed.userFeeds
                                               SET ?`, {
            auth0Id: auth0Id,
            feedWordId: feedWordId,
            recordedAt: recordedAt
        }).then(() => {
            result = true;
        }).catch(() => {
            result = false;
        });

        return result;
    }

    static async deleteUserFeed(auth0Id: string, word: string): Promise<boolean> {
        const mysqlConnection = getMysqlConnection(true);
        let result: boolean = false;

        let deleteWordId = await feedWord.getWordId(word).catch(() => {
            result = false
        });

        await mysqlConnection.query<OkPacket[]>(`DELETE
                                                 FROM newsFeed.userFeeds
                                                 WHERE auth0Id = ?
                                                   AND feedWordId = ?`, [auth0Id, deleteWordId])
            .then(() => {
                result = true
            })
            .catch(() => {
                result = false
            });

        return result;

    }

    static async getAllFeedsOfUser(auth0Id: string): Promise<myFeed> {
        const mysqlConnection = getMysqlConnection(true);
        let allFeedsOfUser: Array<string> = [];
        let myFeed: myFeed = [];
        let myFeedObject: myFeedObject = {};

        let [getAllUserFeedResult] = await mysqlConnection.query<RowDataPacket[]>(`SELECT feedWord
                                                                                   from newsFeed.feedWords
                                                                                   WHERE feedWordId = ANY
                                                                                         (SELECT feedWordId FROM newsFeed.userFeeds WHERE auth0Id = ?)`, auth0Id);

        if (getAllUserFeedResult.length !== 0) {
            getAllUserFeedResult.forEach((word) => {
                allFeedsOfUser.push(word.feedWord);
            });
        }

        for (const word of allFeedsOfUser) {
            try {
                let axiosResponse: AxiosResponse = await axios.get(encodeURI(`https://newsapi.org/v2/everything?q=${word}&sortBy=relevancy&apiKey=86414c1e4e4b4e7195657297a5f7a53d`));
                myFeedObject = {[word]: {articles: axiosResponse.data.articles}};
                myFeed.push(myFeedObject);
            } catch (e) {
                console.error(e);
            }
        }

        let feedList = await this.getFeedList(auth0Id);

        console.log(myFeed);

        myFeed.map((myFeedObject: myFeedObject) => {
            myFeedObject[Object.keys(myFeedObject)[0]].recordedAt = feedList[feedList.findIndex(({feedWord}) => feedWord === Object.keys(myFeedObject)[0])].recordedAt;
        });

        // console.log(myFeed);

        return myFeed;

    }

    static async getFeedList(auth0Id: string): Promise<feedList> {
        const mysqlConnection = getMysqlConnection(true);

        await mysqlConnection.query(`USE newsFeed;`);

        let [feedList] = await mysqlConnection.query<RowDataPacket[]>(`SELECT feedWords.feedWord, userFeeds.recordedAt
                                                                       FROM newsFeed.userFeeds
                                                                                INNER JOIN feedWords on userFeeds.feedWordId = feedWords.feedWordId
                                                                       WHERE auth0Id = ?`, auth0Id);

        const formatDate = (date: Date) => {
            return `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getUTCDate()).slice(-2)} ${('0' + date.getUTCHours()).slice(-2)}:${('0' + date.getUTCMinutes()).slice(-2)}:${('0' + date.getUTCSeconds()).slice(-2)}`;
        }

        feedList.map((feed) => {
            feed.recordedAt = formatDate(new Date(feed.recordedAt));
        });

        return feedList as feedList
    }
}
