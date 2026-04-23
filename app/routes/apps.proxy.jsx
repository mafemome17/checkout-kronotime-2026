import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);

    const url = new URL(request.url);
    const variantId = url.searchParams.get("variantId");

    if (!variantId) {
      return new Response(JSON.stringify({ error: "Missing variantId" }), {
        status: 400,
      });
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

    return new Response(JSON.stringify(json), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("ERROR:", error);

    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};