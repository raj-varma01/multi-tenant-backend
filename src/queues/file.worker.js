import { Worker } from "bullmq";
import sharp from "sharp";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";

import { connectDB } from "../config/db.js";
import { redisConnectionOptions } from "../config/redis.js";
import { env } from "../config/env.js";
import { File } from "../models/File.js";
import { Job } from "../models/Job.js";
import {
    getObjectBuffer,
    uploadBuffer,
    buildStorageKey,
    deleteObject,
} from "../services/storage.service.js";
import {
    FILE_PROCESSING_QUEUE,
    FILE_DELETION_QUEUE,
    fileProcessingDLQ,
} from "./file.queue.js";
import { publishFileEvent } from "../sockets/socket.js";

const THUMBNAIL_SIZE = 200;
async function genericLabeledThumbnail(label) {
    const svg = `
    <svg width="${THUMBNAIL_SIZE}" height="${THUMBNAIL_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#EEF2FF"/>
      <rect x="20" y="20" width="${THUMBNAIL_SIZE - 40}" height="${THUMBNAIL_SIZE - 40}" fill="#FFFFFF" stroke="#6366F1" stroke-width="3"/>
      <text x="50%" y="55%" font-family="Arial" font-size="24" fill="#4338CA" text-anchor="middle" font-weight="bold">${label}</text>
    </svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
}

async function extractMetadataAndThumbnail({ buffer, mimeType }) {
    if (mimeType === "image/png" || mimeType === "image/jpeg") {
        const image = sharp(buffer);
        const { width, height } = await image.metadata();
        const thumbnailBuffer = await image
            .clone()
            .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: "inside" })
            .png()
            .toBuffer();
        return { metadata: { width, height }, thumbnailBuffer };
    }

    if (mimeType === "application/pdf") {
        let pageCount = null;
        try {
            const parsed = await pdfParse(buffer);
            pageCount = parsed.numpages;
        } catch (err) {
            console.warn("[worker] pdf-parse failed, continuing without page count:", err.message);
        }
        const thumbnailBuffer = await genericLabeledThumbnail("PDF");
        return { metadata: { pageCount }, thumbnailBuffer };
    }

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        let wordCount = null;
        try {
            const { value: text } = await mammoth.extractRawText({ buffer });
            wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        } catch (err) {
            console.warn("[worker] mammoth extraction failed:", err.message);
        }
        const thumbnailBuffer = await genericLabeledThumbnail("DOCX");
        return { metadata: { wordCount }, thumbnailBuffer };
    }

    throw new Error(`Unsupported mime type for processing: ${mimeType}`);
}

async function processFileJob(job) {
    const { fileId, tenantId } = job.data;

    const file = await File.findOne({ _id: fileId, tenantId });
    if (!file) {
        throw new Error(`File ${fileId} not found for tenant ${tenantId}`);
    }

    file.status = "processing";
    await file.save();
    await Job.findOneAndUpdate(
        { tenantId, fileId, bullJobId: job.id },
        { status: "processing", attempts: job.attemptsMade + 1 }
    );

    const buffer = await getObjectBuffer(file.storageKey);
    const { metadata, thumbnailBuffer } = await extractMetadataAndThumbnail({
        buffer,
        mimeType: file.mimeType,
    });

    const thumbnailKey = buildStorageKey({ tenantId, fileId, variant: "thumbnail.png" });
    await uploadBuffer({ key: thumbnailKey, buffer: thumbnailBuffer, contentType: "image/png" });

    file.status = "processed";
    file.metadata = metadata;
    file.thumbnailKey = thumbnailKey;
    await file.save();

    await Job.findOneAndUpdate(
        { tenantId, fileId, bullJobId: job.id },
        { status: "completed" }
    );

    await publishFileEvent({
        userId: file.uploadedBy.toString(),
        event: "file:processed",
        payload: { fileId: file._id, status: file.status, metadata: file.metadata, thumbnailKey },
    });
}

async function processDeletionJob(job) {
    const { fileId, tenantId, storageKey, thumbnailKey } = job.data;

    const file = await File.findOne({ _id: fileId, tenantId });
    if (!file) return;

    await deleteObject(storageKey);
    if (thumbnailKey) {
        await deleteObject(thumbnailKey).catch(() => { });
    }
}

async function handleFailure(job, err) {
    const { fileId, tenantId } = job.data;

    await Job.findOneAndUpdate(
        { tenantId, fileId, bullJobId: job.id },
        { status: "failed", error: err.message, attempts: job.attemptsMade }
    );

    const willRetry = job.attemptsMade < job.opts.attempts;

    if (!willRetry) {
        await File.findOneAndUpdate(
            { _id: fileId, tenantId },
            { status: "failed", "metadata.error": err.message }
        );

        await fileProcessingDLQ.add("failed-file-processing", {
            fileId,
            tenantId,
            error: err.message,
            failedAt: new Date().toISOString(),
        });

        const file = await File.findOne({ _id: fileId, tenantId });
        if (file) {
            await publishFileEvent({
                userId: file.uploadedBy.toString(),
                event: "file:failed",
                payload: { fileId: file._id, status: "failed", error: err.message },
            });
        }
    }
}

export function startWorkers() {
    const processingWorker = new Worker(
        FILE_PROCESSING_QUEUE,
        async (job) => processFileJob(job),
        { connection: redisConnectionOptions, concurrency: 5 }
    );

    processingWorker.on("completed", (job) => {
        console.log(`[worker] file-processing job ${job.id} completed`);
    });
    processingWorker.on("failed", async (job, err) => {
        console.error(`[worker] file-processing job ${job.id} failed:`, err.message);
        await handleFailure(job, err);
    });

    const deletionWorker = new Worker(
        FILE_DELETION_QUEUE,
        async (job) => processDeletionJob(job),
        { connection: redisConnectionOptions, concurrency: 5 }
    );

    deletionWorker.on("completed", (job) => {
        console.log(`[worker] file-deletion job ${job.id} completed`);
    });
    deletionWorker.on("failed", (job, err) => {
        console.error(`[worker] file-deletion job ${job.id} failed:`, err.message);
    });

    return { processingWorker, deletionWorker };
}

if (process.argv[1] && process.argv[1].endsWith("file.worker.js")) {
    connectDB()
        .then(() => {
            console.log("[worker] MongoDB ready, starting BullMQ workers...");
            startWorkers();
        })
        .catch((err) => {
            console.error("[worker] failed to start:", err.message);
            process.exit(1);
        });
}

void env;