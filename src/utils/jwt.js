import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken({ userId, tenantId }) {
    return jwt.sign({ sub: userId, tenantId }, env.jwtAccessSecret, {
        expiresIn: env.accessTokenExpiresIn,
    });
}

export function verifyAccessToken(token) {
    return jwt.verify(token, env.jwtAccessSecret);
}

export function signRefreshToken({ userId, tenantId, jti }) {
    return jwt.sign({ sub: userId, tenantId, jti }, env.jwtRefreshSecret, {
        expiresIn: env.refreshTokenExpiresIn,
    });
}

export function verifyRefreshToken(token) {
    return jwt.verify(token, env.jwtRefreshSecret);
}

export function signInviteToken({ tenantId, email, role }) {
    return jwt.sign({ tenantId, email, role }, env.inviteTokenSecret, {
        expiresIn: "24h",
    });
}

export function verifyInviteToken(token) {
    return jwt.verify(token, env.inviteTokenSecret);
}
