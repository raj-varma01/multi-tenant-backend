import { retryJob } from "../services/job.service.js";
import { badRequest } from "../utils/errors.js";
import { isValidObjectId } from "../utils/validation.js";
import { ok } from "../utils/response.js";

export async function retryFailedJob(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw badRequest("Invalid job id");

        const job = await retryJob({ tenantId: req.tenantId, jobId: id });
        ok(res, { jobId: job._id, bullJobId: job.bullJobId, status: job.status });
    } catch (err) {
        next(err);
    }
}