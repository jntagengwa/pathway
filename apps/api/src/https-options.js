import fs from "node:fs";
export function buildHttpsOptions(env) {
    const { keyPath, certPath } = env;
    if (!keyPath || !certPath)
        return undefined;
    if (!fs.existsSync(keyPath)) {
        throw new Error(`HTTPS key file not found at: ${keyPath}`);
    }
    if (!fs.existsSync(certPath)) {
        throw new Error(`HTTPS cert file not found at: ${certPath}`);
    }
    return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
    };
}
