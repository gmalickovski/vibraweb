import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createRemoteJWKSet, jwtVerify } from "jose";

const bucket = "brand-assets";
const s3 = new S3Client({ forcePathStyle: true });
const jwks = createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL!));

function corsHeaders(request: Request): HeadersInit {
  return {
    "Access-Control-Allow-Origin": request.headers.get("origin") ?? "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

async function requireUser(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;

  try {
    const { payload } = await jwtVerify(auth.slice(7), jwks);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

async function uploadBrandLogo(request: Request): Promise<Response> {
  const userId = await requireUser(request);
  if (!userId) {
    return new Response("Unauthorized", {
      status: 401,
      headers: corsHeaders(request),
    });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return new Response("Missing file", {
      status: 400,
      headers: corsHeaders(request),
    });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "png";
  const key = `logos/${userId}/${crypto.randomUUID()}.${safeExtension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: file.type || "application/octet-stream",
    }),
  );

  const endpoint = process.env.AWS_ENDPOINT_URL_S3!.replace(/\/$/, "");
  return Response.json(
    { key, url: `${endpoint}/${bucket}/${key}` },
    { headers: corsHeaders(request) },
  );
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (request.method === "POST" && url.pathname === "/upload-brand-logo") {
      return uploadBrandLogo(request);
    }

    return Response.json(
      { ok: true, service: "Vibraweb Neon API" },
      { headers: corsHeaders(request) },
    );
  },
};
