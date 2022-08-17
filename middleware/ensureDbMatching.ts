import express from "express";
import jwt_decode from "jwt-decode";
import {pool} from "../connections/getMysqlConnection";

import type {NextFunction, RequestHandler} from "express";
import type {mysqlRes} from "../connections/getMysqlConnection";


export const ensureDbMatching: RequestHandler = async (req:express.Request, res: express.Response, next: NextFunction) => {

    let mysqlRes: mysqlRes;
    let auth0Id: string = '';

    if (req.headers.authorization) {
        let encodedString: string = req.headers.authorization.replace('Bearer ', '');
        auth0Id = jwt_decode(encodedString);
    }

    mysqlRes = await pool.query(`SELECT auth0Id
                                 FROM newsFeed.users
                                 WHERE auth0Id = ${auth0Id}`);
    console.log(mysqlRes);
    if (mysqlRes[0] === undefined) {
        await pool.query('INSERT INTO newsFeed.users SET ?', {auth0Id: auth0Id});
        console.log('A new user auth0Id is recorded.');
    }

    next();
}

