// /api/kronotime.js

export default async function handler(req, res) {
  // 🔥 CORS (necesario para extensión)
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://extensions.shopifycdn.com"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // 🔥 preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const { variantId } = req.query;

  if (!variantId) {
    return res.status(400).json({ error: "Missing variantId" });
  }

  try {
    // ⚠️ aquí necesitas tu cliente de Shopify Admin API
    // (esto depende de cómo tengas configurado shopify.server)

    // EJEMPLO SIMPLIFICADO:
    const data = {
      variantId,
      message: "Funciona 🚀",
    };

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: "Internal error" });
  }
}