import mongoose from "mongoose";

export const ROLES = ["owner", "admin", "editor", "viewer"];

const userSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: ROLES, default: "viewer" },
        status: {
            type: String,
            enum: ["active", "invited", "disabled"],
            default: "active",
        },
        refreshTokenHash: { type: String, select: false, default: null },
    },
    { timestamps: true }
);

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });

export const User = mongoose.model("User", userSchema);
