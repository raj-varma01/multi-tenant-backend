import { forbidden } from "../utils/errors.js";

export function requireRole(...allowedRoles) {
    const normalized = allowedRoles.map((r) => r.toLowerCase());
    return (req, res, next) => {
        const role = req.user?.role?.toLowerCase();
        console.log('role ===>>>', role);
        if (!role || !normalized.includes(role)) {
            return next(forbidden("Insufficient role for this action"));
        }
        next();
    };
}
