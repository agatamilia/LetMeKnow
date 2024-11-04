const loggedInUsers = {};
const sessionDuration = 1 * 60 * 1000; // 1 menit

module.exports = {
    setUserStatus: (chatId, status) => {
        loggedInUsers[chatId] = {
            ...(loggedInUsers[chatId] || { isLoggedIn: false, awaitingSaran: false, isStopped: false, wasExpired: false }),
            ...status,
            timeout: loggedInUsers[chatId]?.timeout // Simpan timeout lama jika ada
        };

        // Jika pengguna login, atur ulang timeout sesi
        if (status.isLoggedIn) {
            // Hapus timeout lama jika ada untuk menghindari tumpang tindih
            if (loggedInUsers[chatId].timeout) {
                clearTimeout(loggedInUsers[chatId].timeout);
            }

            loggedInUsers[chatId].timeout = setTimeout(() => {
                console.log(`Session expired for chatId: ${chatId}`);
                loggedInUsers[chatId].isExpired = true;
                loggedInUsers[chatId].wasExpired = true; // Tandai bahwa sesi telah kadaluwarsa
            }, sessionDuration);
        }

        console.log(`User status for chatId ${chatId} has been set.`);
    },

    getUserStatus: (chatId) => {
        return loggedInUsers[chatId] || { isLoggedIn: false, awaitingSaran: false, isStopped: false, wasExpired: false };
    },

    deleteUserStatus: (chatId) => {
        if (loggedInUsers[chatId]) {
            console.log(`Deleting session for chatId: ${chatId}`);
            clearTimeout(loggedInUsers[chatId].timeout);
            delete loggedInUsers[chatId];
        } else {
            console.log(`No session found for chatId: ${chatId}`);
        }
    },

    isUserLoggedIn: (chatId) => {
        return !!loggedInUsers[chatId] && !loggedInUsers[chatId].isStopped;
    },

    stopUserSession: (chatId) => {
        if (loggedInUsers[chatId]) {
            loggedInUsers[chatId].isStopped = true;
        }
    },

    resetStoppedStatus: (chatId) => {
        if (loggedInUsers[chatId]) {
            loggedInUsers[chatId].isStopped = false;
        }
    }
};
