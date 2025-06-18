/**
 * @typedef {Object} Post
 * @property {number} id
 * @property {string} title
 * @property {string} content
 * // Add other fields as needed
 */

/** @type {{ posts: Post[], user: any, categories: any[] }} */
export const AppState = {
    posts: [],
    user: null,
    categories: [],
};