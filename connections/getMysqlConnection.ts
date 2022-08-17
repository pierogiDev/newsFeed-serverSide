import * as dotenv from "dotenv";
dotenv.config();
import {createPool} from "mysql2/promise";

import type { Pool, FieldPacket, OkPacket, ResultSetHeader, RowDataPacket} from "mysql2/promise";
type mysqlRes = [(RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader), FieldPacket[]];

const vpn: boolean = true;
let host: string | undefined = '';

if (vpn) {
    host = process.env.MYSQL_VPN_ADDRESS;
}
else {
    host = process.env.MYSQL_LAN_ADDRESS;
}

//Connect the mysql server via VPN.
const pool: Pool = createPool({
    waitForConnections: true,
    connectionLimit: 10,
    host: host,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: 'newsFeed',
    multipleStatements: true,
    connectTimeout: 30000,
    debug: false,
    timezone: '+00:00',
});

export {pool}
export type {mysqlRes, RowDataPacket, OkPacket}
