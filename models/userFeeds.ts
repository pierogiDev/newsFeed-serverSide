import {getMysqlConnection, OkPacket, RowDataPacket} from "@pierogi.dev/get_mysql_connection";
import {unixTimeReadable} from "@pierogi.dev/readable_time";

export class userFeeds {
    static async recordUserFeed(auth0Id: string, wordId: number): Promise<boolean> {
        const mysqlConnection = getMysqlConnection(true);

        let recordedAt = unixTimeReadable((new Date().getTime() / 1000));

        let recordUserFeed = await mysqlConnection.query<OkPacket>(`INSERT INTO newsFeed.userFeeds
        SET ?`, {auth0Id: auth0Id ,wordId: wordId, recordedAt: recordedAt});

        return !!recordUserFeed[0].affectedRows;
    }

    static async deleteUserFeed(auth0Id: string, wordId: number): Promise<boolean> {
        const mysqlConnection = getMysqlConnection(true);

        let deleteUserFeed = await mysqlConnection.query<OkPacket>(`DELETE
                                                                    FROM newsFeed.userFeeds
                                                                    WHERE auth0Id = ?
                                                                      AND wordId = ?`, [auth0Id, wordId]);

        return !!deleteUserFeed[0].affectedRows;
    }

    static async getAllFeedWordsOfUser(auth0Id: string): Promise<Array<string>> {
        const mysqlConnection = getMysqlConnection(true);
        let allUserFeed: Array<string> = [];

        let [getAllUserFeedResult] = await mysqlConnection.query<RowDataPacket[]>(`SELECT feedWord
                                                                   from newsFeed.feedWords
                                                                   WHERE feedWordId = ANY
                                                                         (SELECT wordId FROM newsFeed.userFeeds WHERE auth0Id = ?)`, auth0Id);

        if (getAllUserFeedResult.length !== 0) {
            getAllUserFeedResult.forEach((word) => {
                allUserFeed.push(word.feedWord);
            });
            return allUserFeed;
        } else {
            return [];
        }
    }
}
