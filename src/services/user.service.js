import { User } from "../models/User.js";

export const USER_LIST_PROJECTION = "_id name email role status createdAt";

export async function listUsers({ tenantId, page = 1, limit = 20 }) {
    const query = { tenantId };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        User.find(query)
            .select(USER_LIST_PROJECTION)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(query),
    ]);

    console.log('data-->', data, total);

    return {
        data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) || 0 },
    };
}