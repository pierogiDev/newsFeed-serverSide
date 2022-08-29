import {getMysqlConnection, OkPacket, RowDataPacket} from "@pierogi.dev/get_mysql_connection";

export class feedWord {
    static async isRecorded(word: string): Promise<boolean> {
        const mysqlConnection = getMysqlConnection(true);

        let [checkResult] = await mysqlConnection.query<RowDataPacket[]>(`SELECT feedWordId FROM newsFeed.feedWords WHERE feedWord = ?`, word);

        return checkResult.length !== 0;
    }

    static async getWordId(word: string): Promise<number | null> {
        const mysqlConnection = getMysqlConnection(true);

        let [feedWordId] = await mysqlConnection.query<RowDataPacket[]>(`SELECT feedWordId FROM newsFeed.feedWords WHERE feedWord = ?`, word);

        if (feedWordId[0].length !== 0) {
            return feedWordId[0].feedWordId;
        } else {
            return null;
        }
    }

    static async recordFeedWord (feedWord: string): Promise<number | null> {
        const mysqlConnection = getMysqlConnection(true);

        let setResult = await mysqlConnection.query<OkPacket>(`INSERT INTO newsFeed.feedWords
        SET ?`, {feedWord: feedWord});

        if (setResult[0].affectedRows) {
            return setResult[0].insertId;
        } else {
            return null;
        }
    }
}
