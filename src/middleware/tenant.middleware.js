import { Tenant } from "../models/Tenant.js";
import { isValidObjectId } from "../utils/validation.js";
import { badRequest, unauthorized } from "../utils/errors.js";

export async function tenantMiddleware(req, res, next) {
    try {
        const headerTenantId = req.headers["x-tenant-id"];
        console.log('headerTenantId ===>>>', headerTenantId);
        if (!headerTenantId) {
            throw badRequest("Missing X-Tenant-ID header");
        }
        if (!isValidObjectId(headerTenantId)) {
            throw badRequest("Invalid X-Tenant-ID header");
        }
        const tenant = await Tenant.findById(headerTenantId);
        if (!tenant) {
            throw badRequest("Tenant not found");
        }
        if (req.user && req.user.tenantId.toString() !== tenant._id.toString()) {
            throw unauthorized("Tenant context mismatch");
        }
        req.tenant = tenant;
        req.tenantId = tenant._id.toString();
        next();
    } catch (err) {
        next(err);
    }
}
