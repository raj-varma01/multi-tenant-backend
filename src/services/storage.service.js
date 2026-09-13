import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/s3.js";
import { env } from "../config/env.js";

export function buildStorageKey({ tenantId, fileId, variant = "original" }) {
    return `tenants/${tenantId}/files/${fileId}/${variant}`;
}

export async function uploadBuffer({ key, buffer, contentType }) {
    await s3Client.send(
        new PutObjectCommand({
            Bucket: env.s3Bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        })
    );
    return key;
}

export async function getObjectBuffer(key) {
    const result = await s3Client.send(
        new GetObjectCommand({ Bucket: env.s3Bucket, Key: key })
    );
    const chunks = [];
    for await (const chunk of result.Body) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

export async function deleteObject(key) {
    await s3Client.send(
        new DeleteObjectCommand({ Bucket: env.s3Bucket, Key: key })
    );
}

export async function getPresignedPutUrl({ key, contentType, expiresIn = 300 }) {
    const command = new PutObjectCommand({
        Bucket: env.s3Bucket,
        Key: key,
        ContentType: contentType,
    });
    return getSignedUrl(s3Client, command, { expiresIn });
}

export async function getPresignedGetUrl({ key, expiresIn = 300 }) {
    const command = new GetObjectCommand({ Bucket: env.s3Bucket, Key: key });
    return getSignedUrl(s3Client, command, { expiresIn });
}
