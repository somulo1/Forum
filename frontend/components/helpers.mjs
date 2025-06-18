/**
 * Creates a DOM element safely, preventing XSS and improving performance.
 * @param {string} tag - The HTML tag name.
 * @param {object} [attributes={}] - An object of attributes (e.g., { class: 'post-card' }).
 * @param {(string|Node)[]} [children=[]] - An array of child nodes or strings.
 * @returns {HTMLElement} The created element.
 */
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    for (const child of children) {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child) { // Ensure child is not null/undefined
            element.appendChild(child);
        }
    }
    return element;
}

/**
 * Returns a human-readable "time ago" string for a given date string.
 * @param {string} dateString
 * @returns {string}
 */
export function getTimeAgo(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return "a while ago";

    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 5) return "Just now";
    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
    return `${Math.floor(seconds)} seconds ago`;
}