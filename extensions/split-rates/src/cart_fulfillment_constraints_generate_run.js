// @ts-check

/**
 * @typedef {import("../generated/api").CartFulfillmentConstraintsGenerateRunInput} CartFulfillmentConstraintsGenerateRunInput
 * @typedef {import("../generated/api").CartFulfillmentConstraintsGenerateRunResult} CartFulfillmentConstraintsGenerateRunResult
 */

/**
 * @type {CartFulfillmentConstraintsGenerateRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {CartFulfillmentConstraintsGenerateRunInput} input
 * @returns {CartFulfillmentConstraintsGenerateRunResult}
 */
export function cartFulfillmentConstraintsGenerateRun(input) {
  const configuration = input?.fulfillmentConstraintRule?.metafield?.jsonValue ?? {};
  const cart = input.cart;
  const locations = input.locations;

  

  console.log(JSON.stringify(cart));
  console.log(JSON.stringify(locations));


  return NO_CHANGES; 
};