// other/session.js

let loggedInUsers = {};

module.exports = {
    // Set user status with chatId
    setUserStatus: (chatId, status) => {
        // Preserve existing status while updating specific properties
        loggedInUsers[chatId] = {
            ...(loggedInUsers[chatId] || { isLoggedIn: false, awaitingSaran: false }),
            ...status
        };
        console.log(`User status for chatId ${chatId} has been set.`);
    },

    // Get user status by chatId
    getUserStatus: (chatId) => {
        // Return user status or default values
        return loggedInUsers[chatId] || { isLoggedIn: false, awaitingSaran: false };
    },

    // Delete user status by chatId
    deleteUserStatus: (chatId) => {
        if (loggedInUsers[chatId]) {
            console.log(`Deleting session for chatId: ${chatId}`);
            delete loggedInUsers[chatId];
        } else {
            console.log(`No session found for chatId: ${chatId}`);
        }
    },

    // Get all logged-in users (optional)
    getAllLoggedInUsers: () => {
        return loggedInUsers;
    },

    // Check if a user is logged in
    isUserLoggedIn: (chatId) => {
        return !!loggedInUsers[chatId];
    }
};
