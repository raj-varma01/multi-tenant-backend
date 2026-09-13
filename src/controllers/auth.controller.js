import { env } from "../config/env.js";
import * as authService from "../services/auth.service.js";
import { requireFields, isValidEmail, isValidPassword, isValidObjectId } from "../utils/validation.js";
import { badRequest } from "../utils/errors.js";
import { created, ok } from "../utils/response.js";

function setRefreshCookie(res, token) {
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        maxAge: env.refreshTokenExpiresInMs,
        path: "/api/v1/auth",
    });
}

function serializeUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        tenantId: user.tenantId,
    };
}

export async function register(req, res, next) {
    try {
        const { tenantName, name, email, password } = req.body;
        requireFields(req.body, ["tenantName", "name", "email", "password"]);
        if (!isValidEmail(email)) throw badRequest("Invalid email");
        if (!isValidPassword(password)) throw badRequest("Password must be at least 8 characters");

        const { tenant, user } = await authService.registerTenantAndOwner({
            tenantName,
            name,
            email,
            password,
        });
        const { accessToken, refreshToken } = await authService.issueTokens(user);

        setRefreshCookie(res, refreshToken);
        created(res, {
            accessToken,
            user: serializeUser(user),
            tenant: { id: tenant._id, name: tenant.name, slug: tenant.slug },
        });
    } catch (err) {
        next(err);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        requireFields(req.body, ["email", "password"]);

        const tenantId = req.headers["x-tenant-id"];
        if (!tenantId || !isValidObjectId(tenantId)) {
            throw badRequest("Missing or invalid X-Tenant-ID header");
        }

        const { accessToken, refreshToken, user } = await authService.login({
            tenantId,
            email,
            password,
        });

        setRefreshCookie(res, refreshToken);
        ok(res, { accessToken, user: serializeUser(user) });
    } catch (err) {
        next(err);
    }
}

export async function refresh(req, res, next) {
    try {
        const oldToken = req.cookies?.refreshToken;
        const { accessToken, refreshToken, user } = await authService.rotateRefreshToken(oldToken);
        setRefreshCookie(res, refreshToken);
        ok(res, { accessToken, user: serializeUser(user) });
    } catch (err) {
        next(err);
    }
}

export async function logout(req, res, next) {
    try {
        if (req.user) {
            await authService.logout(req.user._id);
        }
        res.clearCookie("refreshToken", { path: "/api/v1/auth" });
        ok(res, { message: "Logged out" });
    } catch (err) {
        next(err);
    }
}
