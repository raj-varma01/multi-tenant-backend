import mongoose from "mongoose";
import { File } from "../models/File.js";
import * as fileService from "../services/file.service.js";
import * as storageService from "../services/storage.service.js";
import * as jobService from "../services/job.service.js";
import { enqueueFileProcessing, enqueueFileDeletion } from "../queues/file.queue.js";
import { badRequest, notFound, unprocessable } from "../utils/errors.js";
import { isValidObjectId } from "../utils/validation.js";
import { ok, paginated, accepted } from "../utils/response.js";

export async function uploadFile(req, res, next) {
    try {
        if (!req.file) throw unprocessable("No file provided (expected multipart field 'file')");
        const fileId = new mongoose.Types.ObjectId();
        const storageKey = storageService.buildStorageKey({
            tenantId: req.tenantId,
            fileId: fileId.toString(),
            variant: "original",
        });
        await storageService.uploadBuffer({
            key: storageKey,
            buffer: req.file.buffer,
            contentType: req.file.mimetype,
        });

        const fileDoc = await File.create({
            _id: fileId,
            tenantId: req.tenantId,
            name: req.file.originalname,
            originalName: req.file.originalname,
            storageKey,
            size: req.file.size,
            mimeType: req.file.mimetype,
            uploadedBy: req.user._id,
            status: "pending",
        });

        const bullJob = await enqueueFileProcessing({
            fileId: fileDoc._id.toString(),
            tenantId: req.tenantId,
        });

        await jobService.recordJobQueued({
            tenantId: req.tenantId,
            fileId: fileDoc._id,
            bullJobId: bullJob.id,
        });

        accepted(res, {
            message: "File uploaded and queued for processing",
            fileId: fileDoc._id,
            jobId: bullJob.id,
        });
    } catch (err) {
        next(err);
    }
}

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

export async function getFileStatus(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw badRequest("Invalid file id");

        const file = await fileService.findTenantFile({ tenantId: req.tenantId, fileId: id });
        if (!file) throw notFound("File not found");

        ok(res, { fileId: file._id, status: file.status });
    } catch (err) {
        next(err);
    }
}

export async function downloadFile(req, res, next) {
    try {
        const { id } = req.params;
        const file = await fileService.findTenantFile({ tenantId: req.tenantId, fileId: id });
        if (!file) throw notFound("File not found");

        const url = await storageService.getPresignedGetUrl({
            key: file.storageKey,
            expiresIn: 300,
        });

        console.log('url ===>>>', url);

        ok(res, { url });
    } catch (err) {
        next(err);
    }
}

export async function deleteFile(req, res, next) {
    try {
        const { id } = req.params;
        const file = await fileService.findTenantFile({ tenantId: req.tenantId, fileId: id });
        console.log('file ===>>>', file);
        if (!file) throw notFound("File not found");

        file.deletedAt = new Date();
        await file.save();

        await enqueueFileDeletion({
            fileId: file._id.toString(),
            tenantId: req.tenantId,
            storageKey: file.storageKey,
            thumbnailKey: file.thumbnailKey,
        });

        ok(res, { message: "File scheduled for deletion", fileId: file._id });
    } catch (err) {
        next(err);
    }
}
