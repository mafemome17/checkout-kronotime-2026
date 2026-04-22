import '@shopify/ui-extensions/preact';
import {render} from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

// 1. Export the extension
export default async () => {
  render(<Extension />, document.body)
};

function Extension() {
  const lines = shopify?.lines?.value;
  const productFree = shopify?.settings?.value?.id_variant ? `gid://shopify/ProductVariant/${shopify?.settings?.value?.id_variant}` : "gid://shopify/ProductVariant/48521115468003";
  const messageRemoveProductFree = shopify?.settings?.value?.message_remove_product_free ?? "El producto gratis fue removido porque el carrito ya no cumple el monto mínimo."; 
  const totalWithoutFree = Number(shopify?.settings?.value?.total_purchase);
  const isRemovingRef = useRef(false);
  const [flashMessage, setFlashMessage] = useState(null);

  const safeTotalWithoutFree = isNaN(totalWithoutFree)
    ? 600
    : totalWithoutFree;

  const findCartLineIdByProductId = (lines, variantId) => {
    const line = lines.find(
      (line) => line.merchandise?.id === variantId
    );
    return { id: line?.id, quantity: line?.quantity };
  };

  const removeProduct = async (lineId, quantity) => {
    if (!lineId || !quantity || isRemovingRef.current) return;

    isRemovingRef.current = true;

    try {
      await shopify.applyCartLinesChange({
        type: "removeCartLine",
        id: lineId,
        quantity: quantity
      });
    } catch (e) {
      console.error(e);
    } finally {
      isRemovingRef.current = false;
    }
  };

  const addProduct = async (variantId) => {
    if (!variantId || isRemovingRef.current) return;

    isRemovingRef.current = true;

    try {
      await shopify.applyCartLinesChange({
        type: "addCartLine",
        merchandiseId: variantId,
        quantity: 1
      });
    } catch (e) {
      console.error(e);
    } finally {
      isRemovingRef.current = false;
    }
  };

  useEffect(() => {
    if (!lines?.length) return;

    const total = lines.reduce((acc, line) => {
      const productId = line.merchandise.id;

      if (productId === productFree) return acc;

      return acc + (line.cost?.totalAmount?.amount || 0);
    }, 0);

    if (total <= safeTotalWithoutFree) {
      const line = findCartLineIdByProductId(lines, productFree);
      if (line?.id) {
        removeProduct(line?.id, line?.quantity);
        setFlashMessage(messageRemoveProductFree);
      }
    }else if (total >= safeTotalWithoutFree){
      const line = findCartLineIdByProductId(lines, productFree);
      if(!line.id){
        addProduct(productFree)
      }
    }
  }, [lines]); // 👈 CLAVE

  return (
    <>
      {
        flashMessage && <s-banner heading={flashMessage} tone="warning"></s-banner>
      }
    </>
  );

  
}