import { UnauthorizedException } from "@nestjs/common";
/**
  * Lightweight JWT payload decoder. We intentionally avoid signature validation
  * for now because Auth0 tokens are already verified upstream by Auth0, and we
  * want to support local DEV tokens. This should be replaced with full JWKS
  * verification when we wire Auth0 Organisations end-to-end.
  */
export function parseAuthTokenFromRequest(request) {
    const raw = request.headers.authorization;
    if (!raw) {
        throw new UnauthorizedException("Missing Authorization header");
    }
    const [scheme, token] = raw.split(" ");
    if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
        throw new UnauthorizedException("Unsupported Authorization header");
    }
    const [, payload] = token.split(".");
    if (!payload) {
        throw new UnauthorizedException("Malformed bearer token");
    }
    try {
        const decoded = Buffer.from(payload, "base64url").toString("utf8");
        return JSON.parse(decoded);
    }
    catch (error) {
        throw new UnauthorizedException(`Unable to parse bearer token payload: ${String(error)}`);
    }
}
