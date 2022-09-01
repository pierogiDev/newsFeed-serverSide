//Import package
import axios from "axios";

//Import package of my own made
import {getMysqlConnection} from "@pierogi.dev/get_mysql_connection";
import {unixTimeReadable} from "@pierogi.dev/readable_time";

//Import model
import {feedWord} from "./feedWord.js";

//Import types
import type {AxiosResponse} from "axios"
import type {OkPacket, RowDataPacket, FieldPacket} from "@pierogi.dev/get_mysql_connection";
import type {feedObject} from "../types";

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

        let recordUserFeed = await mysqlConnection.query<OkPacket>(`INSERT INTO newsFeed.userFeeds
                                                                    SET ?`, {
            auth0Id: auth0Id,
            wordId: feedWordId,
            recordedAt: recordedAt
        });

        return !!recordUserFeed[0].affectedRows;
    }

    static async deleteUserFeed(auth0Id: string, word: string): Promise<boolean> {
        const mysqlConnection = getMysqlConnection(true);
        let deleteUserFeed: [OkPacket[], FieldPacket[]] = [[], []];

        let deleteWordId = await feedWord.getWordId(word);

        if (deleteWordId) {
            deleteUserFeed = await mysqlConnection.query<OkPacket[]>(`DELETE
                                                                      FROM newsFeed.userFeeds
                                                                      WHERE auth0Id = ?
                                                                        AND wordId = ?`, [auth0Id, deleteWordId]);
        }

        return !!deleteUserFeed[0].affectedRows;

    }

    static async getAllFeedsOfUser(auth0Id: string): Promise<feedObject> {
        const mysqlConnection = getMysqlConnection(true);
        let allUserFeed: Array<string> = [];
        let feedObject: feedObject = {};

        let [getAllUserFeedResult] = await mysqlConnection.query<RowDataPacket[]>(`SELECT feedWord
                                                                                   from newsFeed.feedWords
                                                                                   WHERE feedWordId = ANY
                                                                                         (SELECT wordId FROM newsFeed.userFeeds WHERE auth0Id = ?)`, auth0Id);

        if (getAllUserFeedResult.length !== 0) {
            getAllUserFeedResult.forEach((word) => {
                allUserFeed.push(word.feedWord);
            });
        }

        for (const word of allUserFeed) {
            try {
                let axiosResponse: AxiosResponse = await axios.get(encodeURI(`https://newsapi.org/v2/everything?q=${word}&apiKey=86414c1e4e4b4e7195657297a5f7a53d`));
                feedObject[word] = axiosResponse.data.articles;
            } catch (e) {
                console.error(e);
            }
        }

        return feedObject;
    }
}
