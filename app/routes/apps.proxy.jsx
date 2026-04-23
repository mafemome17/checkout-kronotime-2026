import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  console.log("--- ENTRANDO AL LOADER DEL PROXY ---"); // <--- Ponlo aquí arriba
  
  try {
    const { session, admin } = await authenticate.public.appProxy(request);
    console.log("Sesión obtenida:", JSON.stringify(session));
    // ... resto del código

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // <--- CRÍTICO PARA EVITAR EL ERROR DE CORS
        },
      });
    }

    if (!admin) {
      return new Response(JSON.stringify({ error: "No admin context" }), { status: 401 });
    }

    const url = new URL(request.url);
    const variantIds = url.searchParams.get("variantIds");

    if (!variantIds) {
      return new Response(JSON.stringify({ error: "Missing variantId" }), { status: 400 });
    }

    try {
      // 2. Ejecutar la query usando el cliente admin.graphql
      const response = await admin.graphql(`
        query getInventory($id: ID!) {
          productVariant(id: $id) {
            inventoryItem {
              inventoryLevels(first: 10) {
                edges {
                  node {
                    location {
                      id
                      name
                    }
                    quantities(names: ["available"]) {
                      name
                      quantity
                    }
                  }
                }
              }
            }
          }
        }
      `, {
        variables: {
          id: `gid://shopify/ProductVariant/${variantIds}`,
        },
      });

      const responseJson = await response.json();

      // 3. Retornar los datos con cabeceras CORS para la extensión
      return new Response(JSON.stringify(responseJson.data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", 
        },
      });

    } catch (error) {
      console.error("Error en GraphQL:", error);
      return new Response(JSON.stringify({ error: "Query failed" }), { status: 500 });
    }

    // 2. Retornar datos con cabeceras CORS
    const data = { shop: session.shop, success: true };



    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Permite que la extensión lea los datos
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });

  } catch (error) {
    console.error("Error en autenticación:", error.message);
    throw new Response("Internal Server Error", { status: 500 });
  }
};

  /*const url = new URL(request.url);
  const variantId = url.searchParams.get("variantId");

  if (!variantId) {
    return new Response(JSON.stringify({ error: "Missing variantId" }), {
      status: 400,
    });
  }

  const sessions = await shopify.sessionStorage.findSessionsByShop(shop);

  console.log("sessions",JSON.stringify(sessions));


  const response = await client.query({
    data: {
      query: `
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
      `,
    },
  });

  const json = response.body;

  const levels =
    json?.data?.productVariant?.inventoryItem?.inventoryLevels?.edges || [];

  const formatted = levels.map((edge) => ({
    locationId: edge.node.location.id,
    locationName: edge.node.location.name,
    available: edge.node.quantities?.[0]?.quantity || 0,
  }));

  return new Response(JSON.stringify(formatted), {
    headers: { "Content-Type": "application/json" },
  });
};*/