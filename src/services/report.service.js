import mongoose from "mongoose";
import { File } from "../models/File.js";
import { Job } from "../models/Job.js";
import { User } from "../models/User.js";

function startOfWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
}

export async function getTenantSummary(tenantId) {
    const tid = new mongoose.Types.ObjectId(tenantId);
    const [summary] = await File.aggregate([
        { $match: { tenantId: tid, deletedAt: null } },
        {
            $group: {
                _id: null,
                totalFiles: { $sum: 1 },
                totalStorageBytes: { $sum: "$size" },
                statuses: { $push: "$status" },
            },
        },
    ]);

    console.log('summary ===>>>', summary);

    const filesByStatus = { pending: 0, processing: 0, processed: 0, failed: 0 };
    (summary?.statuses || []).forEach((s) => {
        if (filesByStatus[s] !== undefined) filesByStatus[s] += 1;
    });

    console.log('filesByStatus ===>>>', filesByStatus);

    const weekStart = startOfWeek();
    const filesUploadedThisWeek = await File.countDocuments({
        tenantId: tid,
        deletedAt: null,
        createdAt: { $gte: weekStart },
    });

    const [activeUsers, jobsQueued] = await Promise.all([
        User.countDocuments({ tenantId: tid, status: "active" }),
        Job.countDocuments({ tenantId: tid, status: { $in: ["queued", "processing"] } }),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const uploadsByDay = await File.aggregate([
        { $match: { tenantId: tid, deletedAt: null, createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
    ]);

    return {
        totalFiles: summary?.totalFiles || 0,
        totalStorageBytes: summary?.totalStorageBytes || 0,
        filesByStatus,
        filesUploadedThisWeek,
        activeUsers,
        jobsQueued,
        uploadsByDay,
    };
}
