// app/routes/api.kronotime.jsx
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  // 🔥 CAMBIO CLAVE: ya NO es appProxy
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const variantId = url.searchParams.get("variantId");

  if (!variantId) {
    return json({ error: "Missing variantId" }, { status: 400 });
  }

  const response = await admin.graphql(`
    query {
      productVariant(id: "gid://shopify/ProductVariant/${variantId}") {
        inventoryItem {
          inventoryLevels(first: 10) {
            edges {
              node {
                location { id name }
                quantities(names: ["available"]) {
                  quantity
                }
              }
            }
          }
        }
      }
    }
  `);

  const jsonData = await response.json();

  const levels =
    jsonData?.data?.productVariant?.inventoryItem?.inventoryLevels?.edges || [];

  const formatted = levels.map((edge) => ({
    locationId: edge.node.location.id,
    locationName: edge.node.location.name,
    available: edge.node.quantities?.[0]?.quantity || 0,
  }));

  return json(formatted, {
    headers: {
      // 🔥 necesario para la extensión
      "Access-Control-Allow-Origin": "https://extensions.shopifycdn.com",
    },
  });
};

// 🔥 manejar preflight (MUY importante)
export const action = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://extensions.shopifycdn.com",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};