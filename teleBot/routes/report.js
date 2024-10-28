// const Report = require('../models/Report');
// const moment = require('moment');
// const sessionManager = require('../other/session');
// moment.locale('id');

// const featureSelection = async (chatId, telebot) => {
//     await telebot.sendMessage(chatId, 'Silakan pilih fitur lainnya:', {
//         reply_markup: {
//             inline_keyboard: [
//                 [{ text: 'Presensi', callback_data: 'api_presensi' }],
//                 [{ text: 'KV Program', callback_data: 'api_kv' }],
//                 [{ text: 'DJP', callback_data: 'api_djp' }],
//                 [{ text: 'Report', callback_data: 'api_report' }],
//                 [{ text: 'Saran / Komplain', callback_data: 'api_saran' }],
//                 [{ text: 'Logout', callback_data: 'logout' }]
//             ]
//         }
//     });
// };

// const getHari = (tanggal) => {
//     const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
//     return days[moment(tanggal).day()];
// };

// const generateReport = async (chatId, telebot) => {
//     try {
//         const userStatus = sessionManager.getUserStatus(chatId);
        
//         // Periksa apakah user sudah login
//         if (!userStatus || !userStatus.isLoggedIn) {
//             await telebot.sendMessage(chatId, 'Anda belum login. Silakan login terlebih dahulu.');
//             return;
//         }
        
//         const kodeSF = userStatus.kodeSF;

//         // Ambil data report untuk Current Month (CM) dan Last Month (LM)
//         const cmReports = await Report.find({
//             'kode sf': kodeSF,
//             $or: [
//                 { io_ts: { $gte: moment().startOf('month').format('DD/MM/YYYY'), $lt: moment().endOf('month').format('DD/MM/YYYY') } },
//                 { re_ts: { $gte: moment().startOf('month').format('DD/MM/YYYY'), $lt: moment().endOf('month').format('DD/MM/YYYY') } },
//                 { ps_ts: { $gte: moment().startOf('month').format('DD/MM/YYYY'), $lt: moment().endOf('month').format('DD/MM/YYYY') } }
//             ]
//         });

//         const lmReports = await Report.find({
//             'kode sf': kodeSF,
//             $or: [
//                 { io_ts: { $gte: moment().subtract(1, 'month').format('DD/MM/YYYY'), $lt: moment().subtract(1, 'month').endOf('month').format('DD/MM/YYYY') } },
//                 { re_ts: { $gte: moment().subtract(1, 'month').format('DD/MM/YYYY'), $lt: moment().subtract(1, 'month').endOf('month').format('DD/MM/YYYY') } },
//                 { ps_ts: { $gte: moment().subtract(1, 'month').format('DD/MM/YYYY'), $lt: moment().subtract(1, 'month').endOf('month').format('DD/MM/YYYY') } }
//             ]
//         });

//         // Data untuk menyimpan IO, RE, PS per tanggal
//         const reportSummary = {};
        
//         // Inisialisasi report kosong untuk setiap hari dalam bulan ini
//         const startOfMonth = moment().startOf('month');
//         const endOfMonth = moment().endOf('month');
//         const today = moment();  // Mengambil tanggal saat ini

//         for (let day = startOfMonth; day.isBefore(endOfMonth) && day.isSameOrBefore(today); day.add(1, 'day')) {
//             const dateStr = day.format('DD');
//             reportSummary[dateStr] = { cm_io: 0, lm_io: 0, cm_re: 0, lm_re: 0, cm_ps: 0, lm_ps: 0, hari: getHari(day) };
//         }

//         // Proses data Current Month (CM)
//         cmReports.forEach(report => {
//             const ioDate = moment(report.io_ts, 'DD/MM/YYYY').format('DD');
//             const reDate = moment(report.re_ts, 'DD/MM/YYYY').format('DD');
//             const psDate = moment(report.ps_ts, 'DD/MM/YYYY').format('DD');

//             if (reportSummary[ioDate]) reportSummary[ioDate].cm_io++;
//             if (reportSummary[reDate]) reportSummary[reDate].cm_re++;
//             if (reportSummary[psDate]) reportSummary[psDate].cm_ps++;
//         });

//         // Proses data Last Month (LM)
//         lmReports.forEach(report => {
//             const ioDate = moment(report.io_ts, 'DD/MM/YYYY').format('DD');
//             const reDate = moment(report.re_ts, 'DD/MM/YYYY').format('DD');
//             const psDate = moment(report.ps_ts, 'DD/MM/YYYY').format('DD');

//             if (reportSummary[ioDate]) reportSummary[ioDate].lm_io++;
//             if (reportSummary[reDate]) reportSummary[reDate].lm_re++;
//             if (reportSummary[psDate]) reportSummary[psDate].lm_ps++;
//         });

//         // Membangun pesan laporan
//         let message = `Halo, report kamu pada bulan sekarang ${moment().format('MMMM YYYY')} adalah:\n`;
//         message += 'Tgl - Hari = \t    IO      |      RE      |      PS  \n';

//         Object.keys(reportSummary).sort().forEach(date => {
//             const { cm_io, cm_re, cm_ps, hari } = reportSummary[date];
//             message += `${date} - ${hari}\t= \t    ${cm_io}      |      ${cm_re}      |      ${cm_ps}  \n`;
//             });

//         // Object.keys(reportSummary).sort().forEach(date => {
//         //     const { cm_io, lm_io, cm_re, lm_re, cm_ps, lm_ps, hari } = reportSummary[date];

//         //     // Hitung perubahan antara CM dan LM
//         //     const ioChange = lm_io === 0 ? (cm_io > 0 ? 100 : 0) : (((cm_io - lm_io) / lm_io) * 100).toFixed(2);
//         //     const reChange = lm_re === 0 ? (cm_re > 0 ? 100 : 0) : (((cm_re - lm_re) / lm_re) * 100).toFixed(2);
//         //     const psChange = lm_ps === 0 ? (cm_ps > 0 ? 100 : 0) : (((cm_ps - lm_ps) / lm_ps) * 100).toFixed(2);
            
//         //     // Tampilkan hasil dalam format CM/% dan persentase
//         //     message += `${date} - ${hari}\t= ${lm_io} / ${cm_io} / ${ioChange}% | ${lm_re} / ${cm_re} / ${reChange}% | ${lm_ps} / ${cm_ps} / ${psChange}%\n`;
//         // });

//         await telebot.sendMessage(chatId, message);
//         featureSelection(chatId, telebot);

//     } catch (error) {
//         console.error('Error generating report:', error);
//         await telebot.sendMessage(chatId, 'Terjadi kesalahan saat menghasilkan laporan. Silakan coba lagi nanti.');
//     }
// };

// module.exports = (telebot) => {
//     telebot.on('callback_query', async (callbackQuery) => {
//         const chatId = callbackQuery.message.chat.id;
//         const data = callbackQuery.data;

//         if (data === 'api_report') {
//             await generateReport(chatId, telebot); // Menyertakan telebot sebagai argumen
//         }
//     });
// };

const Report = require('../models/Report');
const moment = require('moment');
const sessionManager = require('../other/session');
moment.locale('id');

const featureSelection = async (chatId, telebot) => {
    await telebot.sendMessage(chatId, 'Silakan pilih fitur lainnya:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Presensi', callback_data: 'api_presensi' }],
                [{ text: 'KV Program', callback_data: 'api_kv' }],
                [{ text: 'DJP', callback_data: 'api_djp' }],
                [{ text: 'Report', callback_data: 'api_report' }],
                [{ text: 'Saran / Komplain', callback_data: 'api_saran' }],
                [{ text: 'Logout', callback_data: 'logout' }]
            ]
        }
    });
};

const getHari = (tanggal) => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return days[moment(tanggal).day()];
};

const generateReport = async (chatId, telebot) => {
    try {
        const userStatus = sessionManager.getUserStatus(chatId);
        
        // Periksa apakah user sudah login
        if (!userStatus || !userStatus.isLoggedIn) {
            await telebot.sendMessage(chatId, 'Anda belum login. Silakan login terlebih dahulu.');
            return;
        }
        
        const kodeSF = userStatus.kodeSF; // Updated to match new variable name

        // Ambil data report untuk Current Month (CM) dan Last Month (LM)
        const cmReports = await Report.find({
            sf_code: kodeSF,
            $or: [
                { io_ts: { $gte: moment().startOf('month').format('YYYY-MM-DD HH:mm:ss.S'), $lt: moment().endOf('month').format('YYYY-MM-DD HH:mm:ss.S') } },
                { re_ts: { $gte: moment().startOf('month').format('YYYY-MM-DD HH:mm:ss.S'), $lt: moment().endOf('month').format('YYYY-MM-DD HH:mm:ss.S') } },
                { ps_ts: { $gte: moment().startOf('month').format('YYYY-MM-DD HH:mm:ss.S'), $lt: moment().endOf('month').format('YYYY-MM-DD HH:mm:ss.S') } }
            ]
        });

        const lmReports = await Report.find({
            sf_code: kodeSF,
            $or: [
                { io_ts: { $gte: moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss.S'), $lt: moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD HH:mm:ss.S') } },
                { re_ts: { $gte: moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss.S'), $lt: moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD HH:mm:ss.S') } },
                { ps_ts: { $gte: moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss.S'), $lt: moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD HH:mm:ss.S') } }
            ]
        });

        // Data untuk menyimpan IO, RE, PS per tanggal
        const reportSummary = {};
        
        // Inisialisasi report kosong untuk setiap hari dalam bulan ini
        const startOfMonth = moment().startOf('month');
        const endOfMonth = moment().endOf('month');
        const today = moment();  // Mengambil tanggal saat ini

        for (let day = startOfMonth; day.isBefore(endOfMonth) && day.isSameOrBefore(today); day.add(1, 'day')) {
            const dateStr = day.format('DD');
            reportSummary[dateStr] = { cm_io: 0, lm_io: 0, cm_re: 0, lm_re: 0, cm_ps: 0, lm_ps: 0, hari: getHari(day) };
        }

        // Proses data Current Month (CM)
        cmReports.forEach(report => {
            const ioDate = moment(report.io_ts, 'YYYY-MM-DD HH:mm:ss.S').format('DD');
            const reDate = moment(report.re_ts, 'YYYY-MM-DD HH:mm:ss.S').format('DD');
            const psDate = moment(report.ps_ts, 'YYYY-MM-DD HH:mm:ss.S').format('DD');

            if (reportSummary[ioDate]) reportSummary[ioDate].cm_io++;
            if (reportSummary[reDate]) reportSummary[reDate].cm_re++;
            if (reportSummary[psDate]) reportSummary[psDate].cm_ps++;
        });

        // Proses data Last Month (LM)
        lmReports.forEach(report => {
            const ioDate = moment(report.io_ts, 'YYYY-MM-DD HH:mm:ss.S').format('DD');
            const reDate = moment(report.re_ts, 'YYYY-MM-DD HH:mm:ss.S').format('DD');
            const psDate = moment(report.ps_ts, 'YYYY-MM-DD HH:mm:ss.S').format('DD');

            if (reportSummary[ioDate]) reportSummary[ioDate].lm_io++;
            if (reportSummary[reDate]) reportSummary[reDate].lm_re++;
            if (reportSummary[psDate]) reportSummary[psDate].lm_ps++;
        });

        // Membangun pesan laporan
        let message = `Halo, report kamu pada bulan sekarang ${moment().format('MMMM YYYY')} adalah:\n`;
        message += 'Tgl - Hari = \t    IO      |      RE      |      PS  \n';

        Object.keys(reportSummary).sort().forEach(date => {
            const { cm_io, cm_re, cm_ps, hari } = reportSummary[date];
            message += `${date} - ${hari}\t= \t    ${cm_io}      |      ${cm_re}      |      ${cm_ps}  \n`;
        });

        await telebot.sendMessage(chatId, message);
        featureSelection(chatId, telebot);

    } catch (error) {
        console.error('Error generating report:', error);
        await telebot.sendMessage(chatId, 'Terjadi kesalahan saat menghasilkan laporan. Silakan coba lagi nanti.');
    }
};

module.exports = (telebot) => {
    telebot.on('callback_query', async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;

        if (data === 'api_report') {
            await generateReport(chatId, telebot); // Menyertakan telebot sebagai argumen
        }
    });
};
