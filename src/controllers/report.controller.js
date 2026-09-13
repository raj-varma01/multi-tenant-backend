import { getTenantSummary } from "../services/report.service.js";
import { ok } from "../utils/response.js";

export async function getSummary(req, res, next) {
    try {
        const summary = await getTenantSummary(req.tenantId);
        ok(res, summary);
    } catch (err) {
        next(err);
    }
}