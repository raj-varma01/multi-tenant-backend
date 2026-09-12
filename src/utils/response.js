export function ok(res, data, statusCode = 200) {
    return res.status(statusCode).json({ success: true, data });
}

export function created(res, data) {
    return ok(res, data, 201);
}

export function accepted(res, data) {
    return ok(res, data, 202);
}

export function paginated(res, data, pagination) {
    return res.status(200).json({ success: true, data, pagination });
}

export function fail(res, message, statusCode = 400) {
    return res.status(statusCode).json({ success: false, message });
}
