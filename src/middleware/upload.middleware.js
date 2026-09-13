import multer from "multer";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "../services/file.service.js";
import { AppError } from "../utils/errors.js";

const storage = multer.memoryStorage();

console.log('storage ===>>>', storage);

function fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(new AppError("Unsupported file type", 422));
    }
    cb(null, true);
}

export const uploadSingleFile = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter,
}).single("file");

export function handleUploadErrors(err, req, res, next) {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("File exceeds the 10MB size limit", 422));
    }
    next(err);
}
