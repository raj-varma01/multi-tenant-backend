import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Tenant } from "../models/Tenant.js";
import { User } from "../models/User.js";
import { badRequest } from "../utils/errors.js";

function slugify(name) {
    return (
        name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") + "-" + crypto.randomBytes(3).toString("hex")
    );
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

export { badRequest };
