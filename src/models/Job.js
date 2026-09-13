import mongoose from "mongoose";

export const JOB_STATUSES = ["queued", "processing", "completed", "failed"];
export const JOB_TYPES = ["file-processing", "file-deletion"];

const jobSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File",
            required: true,
        },
        bullJobId: { type: String, required: true },
        type: { type: String, enum: JOB_TYPES, default: "file-processing" },
        status: { type: String, enum: JOB_STATUSES, default: "queued" },
        attempts: { type: Number, default: 0 },
        error: { type: String, default: null },
    },
    { timestamps: true }
);

jobSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
jobSchema.index({ tenantId: 1, fileId: 1 });

export const Job = mongoose.model("Job", jobSchema);
