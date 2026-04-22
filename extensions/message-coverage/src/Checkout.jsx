import '@shopify/ui-extensions/preact';
import {render} from "preact";
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

  const [coverage, setCoverage] = useState(true);

  const variables = {
    handle: {
      type: typeMetaobject, // 👈 importante
      handle: handleMetaobject
    }
  };


  const getCountries2 = async () => {
    let countries = await shopify.storage.read('countries2');

    if (countries) return countries;

    const { data } = await shopify.query(query, { variables });

    const value = data?.metaobject?.fields?.find(
      (e) => e?.key === "countries"
    );

    countries = value?.references?.nodes;

    await shopify.storage.write('countries2', countries);

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

  useEffect(() => {
    const setup = async () => {
      const address = shopify?.shippingAddress?.value;

      if (!address?.countryCode) return;

      const countries = await getCountries2();

      if (!countries?.length) return;

      const countryCurrent = countries.find(
        (c) => c?.handle?.toUpperCase() === address.countryCode
      );

      const validationField = countryCurrent?.fields?.find(
        (f) => f.key === "provinces_and_cities"
      );

      const provincesAndCities =
        validationField?.references?.nodes?.map(normalizeValidation) || [];

      const provinceCurrent = provincesAndCities.find(
        (p) => p.key_province === address.provinceCode
      );

      if(!provinceCurrent) return

      const cityCurrent = provinceCurrent?.cities?.find(
        (p) => p?.key_city?.toLowerCase() === address?.city?.toLowerCase()
      );

      if(!cityCurrent) {
        setCoverage(true);
      }

      if(cityCurrent?.coverage !== undefined) {
        setCoverage(cityCurrent?.coverage);
      }else if(cityCurrent?.coverage === undefined) {
        setCoverage(true);
      }


    };

    setup();
  }, [shopify?.shippingAddress?.value]); // 👈 clave


  if(coverage === false) {
    return (
      <s-banner tone="warning">
        <s-stack gap="base">
          <s-text>
            Tu dirección no tiene cobertura de envío mediante contraentrega
          </s-text>
        </s-stack>
      </s-banner>
    );
  }
  // 3. Render a UI
  

}