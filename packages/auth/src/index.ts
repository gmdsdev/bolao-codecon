import { db } from "@codecon/db";
import * as schema from "@codecon/db/schema/auth";
import { env } from "@codecon/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export function createAuth() {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
      disableSignUp:
        env.AUTH_DISABLE_SIGN_UP ?? env.NODE_ENV === "production",
      maxPasswordLength: 128,
      minPasswordLength: 8,
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": {
          window: 60,
          max: 5,
        },
        "/sign-up/email": {
          window: 60,
          max: 5,
        },
      },
    },
    user: {
      additionalFields: {
        isAdmin: {
          type: "boolean",
          defaultValue: false,
          input: false,
        },
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        httpOnly: true,
      },
      ipAddress: {
        ipAddressHeaders: [
          "cf-connecting-ip",
          "x-real-ip",
          "x-forwarded-for",
        ],
      },
    },
    plugins: [],
  });
}

export const auth = createAuth();
