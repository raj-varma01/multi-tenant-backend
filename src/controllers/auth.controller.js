import { env } from "../config/env.js";
import * as authService from "../services/auth.service.js";
import { requireFields, isValidEmail, isValidPassword } from "../utils/validation.js";
import { badRequest } from "../utils/errors.js";
import { created } from "../utils/response.js";

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