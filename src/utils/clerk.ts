// import jwksClient from "jwks-rsa";
// import jwt, { JwtHeader } from "jsonwebtoken";

// // Use different JWKS URIs for frontend and backend
// const getJwksUri = () => {
//   const isBackend =
//     process.env.NODE_ENV === "production" || process.env.CLERK_JWKS_URI;
//   return isBackend
//     ? process.env.CLERK_JWKS_URI || "https://clerk.dev/.well-known/jwks.json"
//     : "https://clerk.dev/.well-known/jwks.json";
// };

// const client = jwksClient({
//   jwksUri: getJwksUri(),
// });

// export interface ClerkTokenPayload {
//   sub: string; // User ID
//   email: string;
//   email_verified: boolean;
//   aud: string;
//   exp: number;
//   iat: number;
//   iss: string;
//   [key: string]: any;
// }

// export const verifyClerkToken = (token: string): Promise<ClerkTokenPayload> => {
//   return new Promise((resolve, reject) => {
//     if (!token) {
//       return reject(new Error("Token is required"));
//     }

//     try {
//       const decoded = jwt.decode(token, { complete: true });

//       if (!decoded || typeof decoded === "string" || !decoded.header.kid) {
//         return reject(new Error("Invalid token format or missing key ID"));
//       }

//       const kid = (decoded.header as JwtHeader).kid;

//       client.getSigningKey(kid, (err, key) => {
//         if (err || !key) {
//           console.error("Error getting signing key:", err);
//           return reject(new Error("Failed to retrieve signing key from Clerk"));
//         }

//         const signingKey =
//           "getPublicKey" in key ? key.getPublicKey() : (key as any).publicKey;

//         jwt.verify(
//           token,
//           signingKey,
//           {
//             algorithms: ["RS256"],
//             issuer: process.env.CLERK_ISSUER_URL || "https://clerk.dev",
//             audience: process.env.CLERK_AUDIENCE || "https://clerk.dev",
//           },
//           (err, verified) => {
//             if (err) {
//               console.error("Token verification error:", err);
//               return reject(
//                 new Error(`Token verification failed: ${err.message}`)
//               );
//             }

//             const payload = verified as ClerkTokenPayload;

//             // Validate required fields
//             if (!payload.sub || !payload.email) {
//               return reject(
//                 new Error("Token missing required fields (sub or email)")
//               );
//             }

//             resolve(payload);
//           }
//         );
//       });
//     } catch (error) {
//       console.error("Token decoding error:", error);
//       reject(new Error("Failed to decode token"));
//     }
//   });
// };

// // Helper function to extract user info from Clerk token
// export const extractUserInfoFromToken = (
//   token: string
// ): Promise<{
//   clerkId: string;
//   email: string;
//   emailVerified: boolean;
// }> => {
//   return verifyClerkToken(token).then((payload) => ({
//     clerkId: payload.sub,
//     email: payload.email,
//     emailVerified: payload.email_verified || false,
//   }));
// };

// // Helper function to validate user info object
// export const validateUserInfo = (
//   userInfo: any
// ): {
//   firstName: string;
//   lastName: string;
//   avatar: string;
// } => {
//   if (!userInfo || typeof userInfo !== "object") {
//     throw new Error("User info is required and must be an object");
//   }

//   return {
//     firstName: userInfo.firstName || "User",
//     lastName: userInfo.lastName || "",
//     avatar: userInfo.avatar || "",
//   };
// };






import { clerkClient } from '@clerk/clerk-sdk-node';

export async function extractUserInfoFromToken(token: string) {
  try {
    console.log('🔍 Attempting to verify Clerk token...');
    
    // Use Clerk's built-in verification instead of manual JWKS
    const session = await clerkClient.sessions.verifySession(token);
    console.log('✅ Clerk token verified successfully');
    
    // Get user data
    const user = await clerkClient.users.getUser(session.userId);
    console.log('✅ User data retrieved:', {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName
    });
    
    return {
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      emailVerified: user.emailAddresses[0]?.verification?.status === 'verified',
      firstName: user.firstName,
      lastName: user.lastName
    };
  } catch (error) {
    console.error('❌ Clerk token verification failed:', error);
    
    if (error.message.includes('Temporary Redirect')) {
      throw new Error('Clerk JWKS endpoint configuration error. Check your Clerk environment setup.');
    } else if (error.message.includes('Failed to retrieve signing key')) {
      throw new Error('Clerk configuration error: Check CLERK_SECRET_KEY and network connectivity');
    } else if (error.message.includes('Invalid token')) {
      throw new Error('Invalid or expired Clerk token');
    } else {
      throw new Error(`Clerk verification failed: ${error.message}`);
    }
  }
}
