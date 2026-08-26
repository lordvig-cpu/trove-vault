// 1. Import the TypeScript type definition for Next.js configuration.
//    (In PHP terms, think of this like type-hinting an array or class so VS Code 
//     knows what keys/settings are legally allowed in this file and provides autocomplete.)
import type { NextConfig } from "next";

// 2. Define the main configuration object.
//    ': NextConfig' tells TypeScript to enforce Next.js rules on the object contents.
const nextConfig: NextConfig = {
  
  // 3. 'allowedDevOrigins' is a security whitelist for your local development server.
  //    By default, Next.js blocks incoming WebSocket connections and fast-reload requests
  //    if the address in your browser bar (e.g. 127.0.0.1) doesn't exactly match 
  //    what the server expected (localhost).
  //    Adding these origins tells Next.js: "Accept local hot-reloading traffic from both 
  //    localhost and the raw 127.0.0.1 IP address."
  allowedDevOrigins: ["localhost:3000", "127.0.0.1:3000", "127.0.0.1"],

};

// 4. Export the configuration object so Next.js can read it on startup.
//    (Similar to a PHP config file doing 'return $config;' at the end.)
export default nextConfig;