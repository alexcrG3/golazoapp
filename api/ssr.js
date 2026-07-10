// api/ssr.js - Vercel Serverless Function que envuelve el servidor SSR de TanStack Start
import server from "../dist/server/server.js";

export default async function handler(req, res) {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "localhost";
    const url = `${protocol}://${host}${req.url}`;

    // Convertir headers de Node.js a Web API Headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (key && value) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    // Leer body del request (para POST, PUT, etc.)
    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      if (chunks.length > 0) {
        body = Buffer.concat(chunks);
      }
    }

    // Crear Web API Request
    const request = new Request(url, {
      method: req.method,
      headers,
      body: body || undefined,
    });

    // Llamar al handler SSR de TanStack Start
    const response = await server.fetch(request);

    // Escribir respuesta
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
  } catch (error) {
    console.error("SSR Error:", error);
    res.statusCode = 500;
    res.end("Internal Server Error: " + error.message);
  }
}
