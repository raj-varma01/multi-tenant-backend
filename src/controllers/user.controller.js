import { User, ROLES } from "../models/User.js";
import * as userService from "../services/user.service.js";
import { signInviteToken } from "../utils/jwt.js";
import { env } from "../config/env.js";
import { requireFields, isValidEmail, isValidObjectId } from "../utils/validation.js";
import { badRequest, notFound, forbidden } from "../utils/errors.js";
import { ok, created, paginated } from "../utils/response.js";

export async function listUsers(req, res, next) {
    try {
        const page = Math.max(parseInt(req.query.page || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);

        console.log('page, limit ===>>>', page, limit);

        const { data, pagination } = await userService.listUsers({
            tenantId: req.tenantId,
            page,
            limit,
        });

        paginated(res, data, pagination);
    } catch (err) {
        next(err);
    }
}

export async function inviteUser(req, res, next) {
    try {
        const { email, role } = req.body;
        requireFields(req.body, ["email", "role"]);
        if (!isValidEmail(email)) throw badRequest("Invalid email");
        if (!ROLES.includes(role)) throw badRequest(`Role must be one of: ${ROLES.join(", ")}`);
        const token = signInviteToken({ tenantId: req.tenantId, email, role });
        console.log('token ===>>>', token);
        const inviteLink = `${env.clientUrl}/accept-invite?token=${token}`;
        console.log('inviteLink ===>>>', inviteLink);
        created(res, { inviteToken: token, inviteLink, expiresIn: "24h" });
    } catch (err) {
        next(err);
    }
}

export async function changeUserRole(req, res, next) {
    try {
        const { id } = req.params;
        const { role } = req.body;
        requireFields(req.body, ["role"]);
        if (!isValidObjectId(id)) throw badRequest("Invalid user id");
        if (!ROLES.includes(role)) throw badRequest(`Role must be one of: ${ROLES.join(", ")}`);

        const targetUser = await User.findOne({ _id: id, tenantId: req.tenantId });
        console.log('targetUser ===>>>', targetUser);
        if (!targetUser) throw notFound("User not found in this tenant");

        if (targetUser.role === "owner" && role !== "owner") {
            const lastOwner = await userService.isLastOwner(req.tenantId, targetUser._id);
            if (lastOwner) {
                throw forbidden("Cannot remove the last owner of a tenant");
            }
        }
        targetUser.role = role;
        await targetUser.save();

        ok(res, {
            id: targetUser._id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
        });
    } catch (err) {
        next(err);
    }
}
