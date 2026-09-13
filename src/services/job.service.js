import { Job } from "../models/Job.js";
import { fileProcessingQueue } from "../queues/file.queue.js";
import { notFound, badRequest } from "../utils/errors.js";

export async function recordJobQueued({ tenantId, fileId, bullJobId, type = "file-processing" }) {
    console.log('tenantId ===>>>', tenantId);
    console.log('fileId ===>>>', fileId);
    console.log('bullJobId ===>>>', bullJobId);
    return Job.create({ tenantId, fileId, bullJobId, type, status: "queued" });
}

export async function updateJobStatus({ tenantId, fileId, bullJobId, status, error, attempts }) {
    const query = bullJobId ? { tenantId, bullJobId } : { tenantId, fileId };
    const update = { status };
    if (error !== undefined) update.error = error;
    if (attempts !== undefined) update.attempts = attempts;
    return Job.findOneAndUpdate(query, update, { new: true, sort: { createdAt: -1 } });
}

export async function retryJob({ tenantId, jobId }) {
    console.log('tenantId ===>>>', tenantId);
    console.log('jobId ===>>>', jobId);
    const job = await Job.findOne({ _id: jobId, tenantId });
    console.log('job ===>>>', job);
    if (!job) throw notFound("Job not found");
    if (job.status !== "failed") {
        throw badRequest("Only failed jobs can be retried");
    }

    const newBullJob = await fileProcessingQueue.add(
        "process-file",
        { fileId: job.fileId.toString(), tenantId: job.tenantId.toString() },
        { jobId: `file-${job.fileId}-retry-${Date.now()}` }
    );

    job.status = "queued";
    job.error = null;
    job.bullJobId = newBullJob.id;
    await job.save();

    return job;
}
