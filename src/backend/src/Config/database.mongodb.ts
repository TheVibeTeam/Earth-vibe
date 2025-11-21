import mongoose from "mongoose";
import logger from "../Utils/logger";

export default class MongoDB {
    private static db: mongoose.Mongoose | null = null
    private static promise: Promise<mongoose.Mongoose> | null = null

    static async init(): Promise<mongoose.Mongoose> {
        if (this.db) return this.db

        const MONGODB_URL = process.env.MONGODB_URL
        const DB_NAME = process.env.MONGODB_DB_NAME

        if (!MONGODB_URL) {
            throw new Error('MONGODB_URL environment variable is not defined')
        }
        if (!DB_NAME) {
            throw new Error('MONGODB_DB_NAME environment variable is not defined')
        }

        if (!this.promise) {
            mongoose.set("strictQuery", true)

            this.promise = mongoose.connect(MONGODB_URL, {
                dbName: DB_NAME,
                bufferCommands: false,
                connectTimeoutMS: 30000,
            })
        }
        
        this.db = await this.promise
        return this.db
    }
}