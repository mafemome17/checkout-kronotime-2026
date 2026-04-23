import '@shopify/ui-extensions/preact';
import { render } from "preact";
import { useEffect } from "preact/hooks";

// 1. Export the extension
export default async () => {
  render(<Extension />, document.body)
};


function Extension() {

  const getNumericVariantIdsString = (lineItems) => {
    if (!Array.isArray(lineItems)) return "";

    const ids = lineItems
      .map(line => {
        const gid = line?.merchandise?.id;
        return gid ? gid.split('/').pop() : null;
      })
      .filter(Boolean); // Mantiene solo IDs válidos

    // .join(',') une los elementos del array con una coma
    return ids.join(',');
  };

  useEffect(() => {

    const fetchData = async () => {

      try {

        const variantIds = getNumericVariantIdsString(shopify.lines.value);

        console.log(JSON.stringify(variantIds));

        const response = await fetch(
          `https://${shopify.shop.myshopifyDomain}/apps/kronotime?variantIds=${variantIds}`, {
            method: "GET",
            headers: {
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