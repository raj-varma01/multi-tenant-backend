import { File } from "../models/File.js";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
]);

export const FILE_LIST_PROJECTION =
    "_id name size mimeType status uploadedBy metadata thumbnailKey createdAt";

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

export function buildFileListQuery({ tenantId, status, type, uploadedBy }) {
    const query = { tenantId, deletedAt: null };
    if (status) query.status = status;
    if (type) query.mimeType = type;
    if (uploadedBy) query.uploadedBy = uploadedBy;
    return query;
}

export async function findTenantFile({ tenantId, fileId, includeDeleted = false }) {
    const query = { _id: fileId, tenantId };
    if (!includeDeleted) query.deletedAt = null;
    return File.findOne(query);
}