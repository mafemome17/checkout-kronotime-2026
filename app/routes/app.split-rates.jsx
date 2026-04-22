// app/routes/setup.jsx
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Obtén el functionId
  const functionsResponse = await admin.graphql(`
    query {
      shopifyFunctions(first: 10) {
        nodes {
          id
          title
          apiType
        }
      }
    }
  `);

  const functions = await functionsResponse.json();
  const constraintFunction = functions.data.shopifyFunctions.nodes.find(
    f => f.title === "split-rates"
  );

  // Crea la regla
  const ruleResponse = await admin.graphql(`
    mutation {
      fulfillmentConstraintRuleCreate(
        functionId: "${constraintFunction.id}"
        deliveryMethodTypes: [SHIPPING]
      ) {
        fulfillmentConstraintRule {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `);

  const rule = await ruleResponse.json();

  return new Response(JSON.stringify(rule.data), {
    headers: { "Content-Type": "application/json" }
  });
};
