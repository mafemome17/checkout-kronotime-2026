import '@shopify/ui-extensions/preact';
import { render } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";


// 1. Export the extension
export default async () => {
  render(<Extension />, document.body)
};

const query = `
    query ($handle: MetaobjectHandleInput!) {
      metaobject(handle: $handle) {
        id
        type
        handle
        fields {
          key
          value
          reference {
            ... on Metaobject {
                id
                type
                handle
                fields {                  
                  key
                  value
                  references (first: 20) {
                    nodes {
                      ... on Metaobject {
                        type
                        fields {
                          key
                          value
                          references (first: 20) {
                            nodes {
                              ... on Metaobject {
                                type
                                fields {
                                  key
                                  value
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
            }
          }
          references (first: 20) {
            nodes {
              ... on Metaobject {
                id
                type
                handle
                type
                fields {
                  key
                  value
                  references (first: 20) {
                    nodes {
                      ... on Metaobject {
                        type
                        fields {
                          key
                          value
                          reference {
                            ... on Metaobject {
                              type
                              fields {
                                key
                                value
                              }
                            }
                          }
                          references (first: 20) {
                            nodes {
                              ... on Metaobject {
                                type
                                fields {
                                  key
                                  value
                                  references (first: 20) {
                                    nodes {
                                      ... on Metaobject {
                                        type
                                        fields {
                                          key
                                          value
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }  
        }
      }
    }
  `;

function Extension() {
  const locale = shopify.localization.language?.value?.isoCode?.split("-")?.length > 1 ? shopify.localization.language?.value?.isoCode?.split("-")[0] : shopify.localization.language?.value?.isoCode; // "es", "pt", "en"
  const typeMetaobject = shopify.settings?.value?.type || "configuration_checkout";
  const handleMetaobject = shopify.settings?.value?.handle || "configuration-checkout-l88euiqr";
  console.log("Idioma:", locale);


  const variables = {
    handle: {
      type: typeMetaobject, // 👈 importante
      handle: handleMetaobject
    }
  };


  const getCountries = async () => {
    let countries = await shopify.storage.read('countries');

    if (countries) return countries;

    const { data } = await shopify.query(query, { variables });

    const value = data?.metaobject?.fields?.find(
      (e) => e?.key === "countries"
    );

    countries = value?.references?.nodes;

    await shopify.storage.write('countries', countries);

    return countries;
  }

  const normalizeFields = (fields) => {
    const obj = {};

    fields.forEach(field => {
      let value = field.value;

      try {
        if (value?.startsWith("[") || value?.startsWith("{")) {
          value = JSON.parse(value);
        }
      } catch {}

      if (value === "true") value = true;
      if (value === "false") value = false;

      if (field.references?.nodes?.length) {
        value = field.references.nodes.map(node =>
          normalizeFields(node.fields)
        );
      }

      obj[field.key] = value;
    });

    return obj;
  };

  const normalizeValidation = (metaobject) => {
    return normalizeFields(metaobject.fields);
  };

  const normalizeForCompare = (str) => {

    if (Array.isArray(str)) str = str[0];

    if (!str) return "";

    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita acentos SOLO para comparar
      .toLowerCase()
      .trim();
  };

  // Suscribirse a la dirección de envío

  useEffect(() => {

    let unsubscribe;

    const setup = async () => {
      // ← await aquí
      unsubscribe = await shopify.buyerJourney.intercept(async ({ canBlockProgress }) => {
        
        if (!canBlockProgress) return { behavior: "allow" };

        
        const address = shopify.shippingAddress.value;

        if (!address?.countryCode) return { behavior: "allow" };

        const countries = await getCountries();

        if (!countries?.length) return { behavior: "allow" };


        const countryCurrent = countries.find(
          (c) => c?.handle?.toUpperCase() === address.countryCode
        );

        if (!countryCurrent) return { behavior: "allow" };

        const validationField = countryCurrent?.fields?.find(
          (f) => f.key === "validation"
        );

        const arrayValidations = validationField?.references?.nodes?.map(normalizeValidation) || [];
        

        for (const rule of arrayValidations) {

          switch (rule?.target) {

            case "$.cart.deliveryGroups[0].deliveryAddress.company":

              // obligatorio directo
              if (rule?.obligatorio && !address?.company) {
                return {
                  behavior: "block",
                  reason:  rule?.message_for_language?.find(e => e?.iso_language?.toLowerCase().includes(locale?.toLowerCase()))?.text ?? rule.message_error,
                  errors: [
                    {
                      message: rule?.message_for_language?.find(e => e?.iso_language?.toLowerCase().includes(locale?.toLowerCase()))?.text ?? rule.message_error,
                      target: rule.target,
                    }
                  ]
                };
              }

              // validación por provincias
              if (rule?.validate_with_provinces?.length) {

                if (
                  address?.provinceCode &&
                  rule.validate_with_provinces.includes(address.provinceCode)
                ) {

                  if (!address?.company) {
                    console.log("🚨 bloqueando por provincia");

                    return {
                      behavior: "block",
                      reason: rule?.message_for_language?.find(e => e?.iso_language?.toLowerCase().includes(locale?.toLowerCase()))?.text ?? rule.message_error,
                      errors: [
                        {
                          message: rule?.message_for_language?.find(e => e?.iso_language?.toLowerCase().includes(locale?.toLowerCase()))?.text ?? rule.message_error,
                          target: rule.target,
                        }
                      ]
                    };
                  }
                }
              }
              

              // validación provincias + ciudades
              if (rule?.validate_with_provinces_and_cities?.length && address?.city) {

                const match = rule.validate_with_provinces_and_cities.find((item) => {
                  if (item.key_province !== address?.provinceCode) return false;

                  return item?.cities?.some((city) => {
                    const a = normalizeForCompare(city?.key_city);
                    const b = normalizeForCompare(address?.city?.trim());

                    return a === b || a.includes(b) || b.includes(a);
                  });
                });

                if (match) {
                  if (!address?.company) {
                    console.log("🚨 bloqueando por provincia + ciudad");

                    return {
                      behavior: "block",
                      reason: rule?.message_for_language?.find(e => e?.iso_language?.toLowerCase().includes(locale?.toLowerCase()))?.text ?? rule.message_error,
                      errors: [
                        {
                          message: rule?.message_for_language?.find(e => e?.iso_language?.toLowerCase().includes(locale?.toLowerCase()))?.text ?? rule.message_error,
                          target: rule.target,
                        }
                      ]
                    };
                  }
                }
              }

              break;

            default:
              break;
          }
        }

        /*if (
          shopify.shippingAddress.value?.countryCode === "PT" &&
          shopify.shippingAddress.value?.company === undefined
        ) {
          return {
            behavior: "block",
            reason: shopify.i18n.translate("companyRequired"),
            errors: [
              {
                message: shopify.i18n.translate("companyRequired"),
                target: "$.cart.deliveryGroups[0].deliveryAddress.company",
              }
            ]
          };
        }*/

        return { behavior: "allow" };
      });
    };

    setup();

    // Limpieza
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 3. Render a UI
  return null;
}