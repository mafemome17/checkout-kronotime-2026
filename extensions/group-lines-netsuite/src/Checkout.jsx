import '@shopify/ui-extensions/preact';
import { render } from "preact";
import { useEffect } from "preact/hooks";

// 1. Export the extension
export default async () => {
  render(<Extension />, document.body)
};


function Extension() {

  const shopDomain = shopify.shop.myshopifyDomain;

  

  const getStoreAvailability = async () => {
     const { data: productData } = await shopify.query(`
      {
        product(handle: "the-collection-snowboard-hydrogen") {
          id
          title
          variants (first: 10) {
            nodes {
              id
              title
              
            }
          }  
        }
      }
    `);
    console.log("product:", productData)
  };

  useEffect(() => {

    

    const fetchData = async () => {
      const token = await shopify.sessionToken.get;

      console.log("token", token);

      try {
        const response = await fetch(
          `https://${shopify.shop.myshopifyDomain}/apps/kronotime?variantId=48521114484963`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          }
        );

        const data = await response.json();

        console.log("respuesta:", data);
      } catch (error) {
        console.error("error:", error);
      }
    };

    fetchData();


  }, []);

  // 2. Check instructions for feature availability
  if (!shopify.instructions.value.metafields.canSetCartMetafields) {
    return (
      <s-banner heading="group-lines-netsuite" tone="warning">
        {shopify.i18n.translate("metafieldChangesAreNotSupported")}
      </s-banner>
    );
  }

  // 3. Render a UI
  return (
    <s-banner heading="group-lines-netsuite">
      <s-stack gap="base">
        <s-text>
          {shopify.i18n.translate("welcome", {
            target: <s-text type="emphasis">{shopify.extension.target}</s-text>,
          })}
        </s-text>
        <s-checkbox
          onChange={onCheckboxChange}
          label={shopify.i18n.translate("iWouldLikeAFreeGiftWithMyOrder")}
        />
      </s-stack>
    </s-banner>
  );

  async function onCheckboxChange(event) {
    const isChecked = event.target.checked;
    // 4. Call the API to modify checkout
    const result = await shopify.applyMetafieldChange({
      type: "updateCartMetafield",
      metafield: {
        namespace: "$app",
        key: "requestedFreeGift",
        value: isChecked ? "true" : "false",
        type: "boolean",
      },
    });
    console.log("applyMetafieldChange result", result);
  }
}