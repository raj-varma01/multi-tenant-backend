import * as userService from "../services/user.service.js";
import { paginated } from "../utils/response.js";

export async function listUsers(req, res, next) {
    try {
        const page = Math.max(parseInt(req.query.page || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);

        console.log('page, limit ===>>>', page, limit);

        const { data, pagination } = await userService.listUsers({
            tenantId: req.tenantId,
            page,
            limit,
        });

        paginated(res, data, pagination);
    } catch (err) {
        next(err);
    }
}