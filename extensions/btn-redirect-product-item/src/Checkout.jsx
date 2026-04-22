import '@shopify/ui-extensions/preact';
import {render} from "preact";
import { useEffect, useState } from "preact/hooks";

// 1. Export the extension
export default async () => {
  render(<Extension />, document.body)
};

function Extension() {

  const rawTarget = shopify?.settings?.value?.target_redirect;
  const textRedirect = shopify?.settings?.value?.text_redirect_es;

  const target =
    rawTarget === "_blank" || rawTarget === "auto"
      ? rawTarget
      : "auto";

  const [product, setProduct] = useState(null);

  const query = `
    query ($id: ID!) {
      product(id: $id) {
        handle
      }
    }
  `;

  const productId = shopify?.target?.value?.merchandise?.product?.id;

  useEffect(() => {
    async function loadProducts() {
      const { data, errors } = await shopify.query(query, {
        variables: { id: productId },
      });

      if (errors) {
        console.error(errors);
        return;
      }

      setProduct(data?.product);
    }

    loadProducts();
  }, []);

  
  
  // 3. Render a UI
  return (
    <s-link href={`${shopify.shop.storefrontUrl}/cart`}>{textRedirect ? textRedirect : shopify.i18n.translate("returnProductFromCheckout")}</s-link>
  );

}