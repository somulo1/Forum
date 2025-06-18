/**
 * Time utility functions for the forum application
 */

export class TimeUtils {
    /**
     * Returns the time that has passed (i.e "1 day ago.")
     * @param {string} date - ISO date string
     * @returns {string} - Formatted time ago string
     */
    static getTimeAgo(date) {
        const seconds = Math.floor((Date.now() - new Date(date)) / 1000);

        const timePeriods = {
            year: 365 * 24 * 60 * 60,       // 31536000
            month: 30 * 24 * 60 * 60,       // 2592000
            week: 7 * 24 * 60 * 60,         // 604800
            day: 24 * 60 * 60,              // 86400
            hour: 60 * 60,                  // 3600
            minute: 60,                     // 60
            second: 1                       // 1
        };

        for (const [timePeriod, unitSeconds] of Object.entries(timePeriods)) {
            const periodValue = Math.floor(seconds / unitSeconds);
            if (periodValue >= 1) {
                return `${periodValue} ${timePeriod}${periodValue === 1 ? '' : 's'} ago.`;
            }
        }
        return 'Just now.';
    }
}
