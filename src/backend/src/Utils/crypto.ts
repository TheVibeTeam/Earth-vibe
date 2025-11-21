// backend/src/utils/crypto.ts
import crypto from "crypto";
import "dotenv/config";

const SECRET_KEY = Buffer.from(process.env.SECRET_KEY!, "hex");
const IV_LENGTH = 16;

export function encrypt<T>(data: T): { iv: string; data: string } {
    const json = JSON.stringify(data);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, iv);
    let encrypted = cipher.update(json, "utf8", "base64");
    encrypted += cipher.final("base64");
    return {
        iv: iv.toString("base64"),
        data: encrypted
    };
}

export function decrypt<T>(payload: { iv: string; data: string }): T {
    const iv = Buffer.from(payload.iv, "base64");
    const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, iv);
    let decrypted = decipher.update(payload.data, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted) as T;
}
