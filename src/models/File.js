import mongoose from "mongoose";
export const FILE_STATUSES = ["pending", "processing", "processed", "failed"];

const fileSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        name: { type: String, required: true },
        originalName: { type: String, required: true },
        storageKey: { type: String, required: true },
        thumbnailKey: { type: String, default: null },
        size: { type: Number, required: true },
        mimeType: { type: String, required: true },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: { type: String, enum: FILE_STATUSES, default: "pending" },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

fileSchema.index({ tenantId: 1, createdAt: -1 });
fileSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
fileSchema.index({ tenantId: 1, mimeType: 1, createdAt: -1 });
fileSchema.index({ tenantId: 1, uploadedBy: 1, createdAt: -1 });

export const File = mongoose.model("File", fileSchema);
