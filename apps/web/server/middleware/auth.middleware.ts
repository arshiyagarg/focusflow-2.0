import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { UserContainer } from "../lib/db.config";

export const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const token = req.cookies.jwt;

        if(!token){
            return res.status(401).json({ error: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        const existingUser = await UserContainer.item(decoded.userId).read();

        if(!existingUser.resource){
            return res.status(401).json({ error: "Unauthorized" });
        }

        req.user = existingUser.resource;
        console.log("====DEBUG====");
        console.log(req.user)
        console.log("====DEBUG====END====");
        next();
    } catch(error){
        console.log(error);
        return res.status(401).json({ error: "Unauthorized" });
    }
}