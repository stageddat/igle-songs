import { createHash, timingSafeEqual } from "node:crypto";

// comparar en tiempo constante (hash para igualar longitudes)
function safeCompare(a: string, b: string) {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export function validateAdminPassword(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        isValid: false,
        error: "missing or invalid authorization header",
      };
    }

    const password = authHeader.substring(7);
    const masterPassword = process.env.MASTER_PASSWORD;

    if (!masterPassword) {
      console.error("master password not configured in environment variables");
      return {
        isValid: false,
        error: "server configuration error",
      };
    }

    if (!safeCompare(password, masterPassword)) {
      return {
        isValid: false,
        error: "invalid password",
      };
    }

    return {
      isValid: true,
    };
  } catch (error) {
    console.error("error validating password:", error);
    return {
      isValid: false,
      error: "authentication error",
    };
  }
}
