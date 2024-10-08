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
        console.log(`Menghapus session untuk chatId: ${chatId}`);
        delete loggedInUsers[chatId];
    }
};
