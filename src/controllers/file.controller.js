import * as fileService from "../services/file.service.js";
import { paginated } from "../utils/response.js";


export async function listFiles(req, res, next) {
    try {
        const page = Math.max(parseInt(req.query.page || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);

        const { data, pagination } = await fileService.listFiles({
            tenantId: req.tenantId,
            status: req.query.status,
            type: req.query.type,
            uploadedBy: req.query.uploadedBy,
            page,
            limit,
        });

        paginated(res, data, pagination);
    } catch (err) {
        next(err);
    }
}
