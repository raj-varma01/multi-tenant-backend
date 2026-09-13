import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Tenant } from "../models/Tenant.js";
import { User } from "../models/User.js";
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from "../utils/jwt.js";
import { badRequest, unauthorized } from "../utils/errors.js";

function slugify(name) {
    return (
        name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") + "-" + crypto.randomBytes(3).toString("hex")
    );
}
function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}


export async function registerTenantAndOwner({ tenantName, name, email, password }) {
    const session = await mongoose.startSession();
    try {
        let tenant, user;

        await session.withTransaction(async () => {
            const [createdTenant] = await Tenant.create(
                [{ name: tenantName, slug: slugify(tenantName) }],
                { session }
            );
            tenant = createdTenant;

            const passwordHash = await bcrypt.hash(password, 10);

            const [createdUser] = await User.create(
                [
                    {
                        tenantId: tenant._id,
                        name,
                        email: email.toLowerCase(),
                        passwordHash,
                        role: "owner",
                        status: "active",
                    },
                ],
                { session }
            );
            user = createdUser;
        });

        return { tenant, user };
    } finally {
        await session.endSession();
    }
}

export async function login({ tenantId, email, password }) {
    const user = await User.findOne({
        tenantId,
        email: email.toLowerCase(),
    }).select("+passwordHash");

    if (!user) throw unauthorized("Invalid email or password");
    if (user.status !== "active") throw unauthorized("User is not active");

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw unauthorized("Invalid email or password");

    return issueTokens(user);
}

export async function issueTokens(user) {
    const jti = crypto.randomBytes(16).toString("hex");
    const accessToken = signAccessToken({
        userId: user._id.toString(),
        tenantId: user.tenantId.toString(),
    });
    const refreshToken = signRefreshToken({
        userId: user._id.toString(),
        tenantId: user.tenantId.toString(),
        jti,
    });

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    return { accessToken, refreshToken, user };
}

export async function rotateRefreshToken(oldToken) {
    if (!oldToken) throw unauthorized("Missing refresh token");

    let payload;
    try {
        payload = verifyRefreshToken(oldToken);
    } catch {
        throw unauthorized("Invalid or expired refresh token");
    }

    const user = await User.findOne({
        _id: payload.sub,
        tenantId: payload.tenantId,
    }).select("+refreshTokenHash");

    if (!user || !user.refreshTokenHash) {
        throw unauthorized("Refresh token has been invalidated");
    }

    if (user.refreshTokenHash !== hashToken(oldToken)) {
        // Token reuse detected (old token replayed after rotation) - invalidate
        // the session entirely to be safe.
        user.refreshTokenHash = null;
        await user.save();
        throw unauthorized("Refresh token has been invalidated");
    }

    return issueTokens(user);
}

export async function logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
}

export function assertValidTenantContext(user, tenantId) {
    // Core multi-tenant security rule: the authenticated user's tenantId must
    // match the tenant resolved from the request. Never trust a client-supplied
    // tenant switch.
    if (user.tenantId.toString() !== tenantId.toString()) {
        throw unauthorized("Tenant context mismatch");
    }
}

export { badRequest };
