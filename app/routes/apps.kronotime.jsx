// app/routes/apps.kronotime/route.js

import { authenticate } from "../../shopify.server";

export async function loader({ request }) {
  // 🔥 App Proxy auth (igual que antes)
  const { admin } = await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const variantId = url.searchParams.get("variantId");

  if (!variantId) {
    return new Response(
      JSON.stringify({ error: "Missing variantId" }),
      { status: 400 }
    );
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

  const json = await response.json();

  const levels =
    json?.data?.productVariant?.inventoryItem?.inventoryLevels?.edges || [];

  const formatted = levels.map((edge) => ({
    locationId: edge.node.location.id,
    locationName: edge.node.location.name,
    available: edge.node.quantities?.[0]?.quantity || 0,
  }));

  return new Response(JSON.stringify(formatted), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}