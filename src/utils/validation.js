import mongoose from "mongoose";
import { badRequest } from "./errors.js";

export function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

export function requireFields(body, fields) {
    const missing = fields.filter((f) => {
        const val = body?.[f];
        return val === undefined || val === null || val === "";
    });
    if (missing.length) {
        throw badRequest(`Missing required field(s): ${missing.join(", ")}`);
    }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
    return typeof email === "string" && EMAIL_RE.test(email);
}

export function isValidPassword(password) {
    return typeof password === "string" && password.length >= 8;
}
