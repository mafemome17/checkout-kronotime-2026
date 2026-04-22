import '@shopify/ui-extensions/preact';
import { render } from "preact";

// 1. Export the extension
export default async () => {
  render(<Extension />, document.body)
};

function Extension() {
  const messageInitial = shopify?.settings?.value?.primary_message ?? 'Recíbelo el mismo día';
  const messageSecundary = shopify?.settings?.value?.secundary_message ?? 'Recíbelo en un plazo de 24-48 horas';
  const weekendMessage = shopify?.settings?.value?.weekend_message ?? 'Compra hoy y recibe el lunes';
  const hourShowMessage = shopify?.settings?.value?.hour_show_message_secundary ?? '18';
  const rawDays = String(
    shopify?.settings?.value?.days_weekend ?? 'sabado,domingo'
  );
  const code = shopify?.settings?.value?.rate ?? 'International Shipping';
  const dateNow = new Date();
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const dayName = days[dateNow.getDay()];
  let horaDia = dateNow.getHours();

  const daysWeekend = rawDays?.includes(',')
    ? rawDays?.split(',').map(d => d.trim())
    : [rawDays?.trim()];

  horaDia = horaDia === 0 ? 24 : horaDia;


  if (shopify.target?.value?.code === code) {
    if (daysWeekend?.find(element => element?.toLowerCase() === dayName?.toLowerCase()) != undefined) {
      return (
        <s-stack direction="inline" gap="base">
          <s-icon type="truck" size="large" />
          <s-text type="strong" tone='info'>
            {weekendMessage}
          </s-text>
        </s-stack>
      );
    }

    if (horaDia >= parseInt(String(hourShowMessage))) {
      return (
        <s-stack direction="inline" gap="base">
          <s-icon type="truck" size="large" />
          <s-text type="strong" tone='info'>
            {messageSecundary}
          </s-text>
        </s-stack>
      );
    } else {
      return (
        <s-stack direction="inline" gap="base">
          <s-icon type="truck" size="large" />
          <s-text type="strong" tone='info'>
            {messageInitial}
          </s-text>
        </s-stack>
      );
    }
  }
}