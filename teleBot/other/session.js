// sessionManager.js
let loggedInUsers = {};

module.exports = {
    // Set status pengguna dengan chatId
    setUserStatus: (chatId, status) => {
        loggedInUsers[chatId] = status;
        console.log(`Status pengguna untuk chatId ${chatId} diatur.`);
    },

    // Ambil status pengguna berdasarkan chatId
    getUserStatus: (chatId) => {
        return loggedInUsers[chatId] || null; // Mengembalikan null jika tidak ada status
    },

    // Hapus status pengguna berdasarkan chatId
    deleteUserStatus: (chatId) => {
        if (loggedInUsers[chatId]) {
            console.log(`Menghapus session untuk chatId: ${chatId}`);
            delete loggedInUsers[chatId];
        } else {
            console.log(`Tidak ada session yang ditemukan untuk chatId: ${chatId}`);
        }
    },

    // Mengambil semua pengguna yang sedang login (opsional)
    getAllLoggedInUsers: () => {
        return loggedInUsers;
    },

    // Cek apakah pengguna sedang login
    isUserLoggedIn: (chatId) => {
        return !!loggedInUsers[chatId];
    }
};

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
