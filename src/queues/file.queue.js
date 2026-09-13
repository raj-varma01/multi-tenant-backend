import { Queue } from "bullmq";
import { redisConnectionOptions } from "../config/redis.js";

export const FILE_PROCESSING_QUEUE = "file-processing";
export const FILE_DELETION_QUEUE = "file-deletion";
export const FILE_PROCESSING_DLQ = "file-processing-dlq";

const defaultJobOptions = {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: false,
};

export const fileProcessingQueue = new Queue(FILE_PROCESSING_QUEUE, {
    connection: redisConnectionOptions,
    defaultJobOptions,
});

export const fileDeletionQueue = new Queue(FILE_DELETION_QUEUE, {
    connection: redisConnectionOptions,
    defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
});

export const fileProcessingDLQ = new Queue(FILE_PROCESSING_DLQ, {
    connection: redisConnectionOptions,
});

export async function enqueueFileProcessing({ fileId, tenantId }) {
    return fileProcessingQueue.add(
        "process-file",
        { fileId, tenantId },
        { jobId: `file-${fileId}` }
    );
}

export async function enqueueFileDeletion({ fileId, tenantId, storageKey, thumbnailKey }) {
    return fileDeletionQueue.add("delete-file", {
        fileId,
        tenantId,
        storageKey,
        thumbnailKey,
    });
}
