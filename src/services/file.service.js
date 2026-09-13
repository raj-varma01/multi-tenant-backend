import { File } from "../models/File.js";

export async function listFiles({ tenantId, status, type, uploadedBy, page = 1, limit = 20 }) {
    const query = buildFileListQuery({ tenantId, status, type, uploadedBy });
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        File.find(query)
            .select(FILE_LIST_PROJECTION)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        File.countDocuments(query),
    ]);

    console.log('total ===>>>', total);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 0,
        },
    };
}