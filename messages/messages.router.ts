import express from "express";
import {
    getAdminMessage,
    getProtectedMessage,
    getPublicMessage,
} from "./messages.service.js";
import { checkJwt } from "../middleware/check-jwt.js";
import { checkPermissions } from "../middleware/check-permissions.js";
import { AdminMessagesPermissions } from "./messages-permissions.js";

const messagesRouter = express.Router();

messagesRouter.get("/public", (req, res) => {
    const message = getPublicMessage();

    res.status(200).json(message);
});

messagesRouter.get("/protected", checkJwt, (req, res) => {
    const message = getProtectedMessage();

    res.status(200).json(message);
});

messagesRouter.get(
    "/admin",
    checkJwt,
    checkPermissions(AdminMessagesPermissions.Read),
    (req, res) => {
        const message = getAdminMessage();

        res.status(200).json(message);
    }
);

export { messagesRouter };
