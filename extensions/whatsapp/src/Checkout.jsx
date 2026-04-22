import '@shopify/ui-extensions/preact';
import { render } from "preact";

// 1. Export the extension
export default async () => {
  render(<Extension />, document.body)
};

function Extension() {
  const numberWhatsapp = shopify?.settings?.value?.number_whatsapp ?? '3153366907';
  const textWhatsapp = shopify?.settings?.value?.text ?? 'Ir a WhatsApp';

  // 3. Render a UI
  return (
    <s-box
      inlineSize={textWhatsapp ? "auto" : "70px"}
    >
      <s-link href={`https://wa.me/${numberWhatsapp}`}>
        {textWhatsapp ? (<s-text>{textWhatsapp}</s-text>) : (<s-image
          inlineSize="auto"
          src="https://cdn.shopify.com/s/files/1/0789/3083/7731/files/invictaperu_1727817611_1.png?v=1775254486"
          alt="Product image"
        />)}
        
      </s-link>
    </s-box>
  );


}