import { verifyAccessToken } from "../utils/jwt.js";
import { User } from "../models/User.js";
import { unauthorized } from "../utils/errors.js";

export async function authenticate(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;

        if (!token) throw unauthorized("Missing access token");

        let payload;
        try {
            payload = verifyAccessToken(token);
        } catch {
            throw unauthorized("Invalid or expired access token");
        }

        const user = await User.findById(payload.sub);
        if (!user || user.status !== "active") {
            throw unauthorized("User not found or inactive");
        }

        req.user = user;
        req.tokenTenantId = payload.tenantId;
        next();
    } catch (err) {
        next(err);
    }
}
