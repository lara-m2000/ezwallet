/**
 * Computes the difference between two arrays
 * ```
 * const a = [1, 2, 3];
 * const b = [3, 4, 5];
 * arrayDifference(a, b); // [1, 2]
 * arrayDifference(b, a); // [4, 5]
 * ```
 *
 * @param {*[]} a
 * @param {*[]} b
 * @returns {*[]}
 */
export const arrayDifference = (a, b) => {
  return a.filter((x) => !b.includes(x));
};

/**
 * Computes the intersection between two arrays
 * ```
 * const a = [1, 2, 3];
 * const b = [3, 4, 5];
 * arrayIntersection(a, b); // [3]
 * ```
 *
 * @param {*[]} a
 * @param {*[]} b
 * @returns {*[]}
 */
export const arrayIntersection = (a, b) => {
  return a.filter((x) => b.includes(x));
};
