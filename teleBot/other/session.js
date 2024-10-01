// sessionManager.js
let loggedInUsers = {};

module.exports = {
    setUserStatus: (chatId, status) => {
        loggedInUsers[chatId] = status;
    },
    getUserStatus: (chatId) => {
        return loggedInUsers[chatId];
    },
    deleteUserStatus: (chatId) => {
        delete loggedInUsers[chatId];
    }
};
