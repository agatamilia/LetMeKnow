const Report = require('../models/Report');
const User = require('../models/User');
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
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[moment(tanggal).day()];
};

module.exports = (telebot) => {
    const generateReport = async (chatId) => {
        try {
            const userStatus = sessionManager.getUserStatus(chatId);
            
            // Periksa apakah user sudah login
            if (!userStatus || !userStatus.isLoggedIn) {
                await telebot.sendMessage(chatId, 'Anda belum login. Silakan login terlebih dahulu.');
                return;
            }
            
            const kodeSF = userStatus.kodeSF; 
            
            // Ambil data report berdasarkan kode SF dan bulan sekarang
            const reports = await Report.find({
                'kode sf': kodeSF,
                $or: [
                    { io_ts: { $gte: moment().startOf('month').format('DD/MM/YYYY'), $lt: moment().endOf('month').format('DD/MM/YYYY') } },
                    { re_ts: { $gte: moment().startOf('month').format('DD/MM/YYYY'), $lt: moment().endOf('month').format('DD/MM/YYYY') } },
                    { ps_ts: { $gte: moment().startOf('month').format('DD/MM/YYYY'), $lt: moment().endOf('month').format('DD/MM/YYYY') } }
                ]
            });

            // Data untuk menyimpan IO, RE, PS per tanggal
            const reportSummary = {};

            // Inisialisasi report kosong untuk setiap hari dalam bulan ini
            const startOfMonth = moment().startOf('month');
            const endOfMonth = moment().endOf('month');
            for (let day = startOfMonth; day.isBefore(endOfMonth); day.add(1, 'day')) {
                const dateStr = day.format('DD/MM/YYYY');
                reportSummary[dateStr] = { io: 0, re: 0, ps: 0, hari: getHari(day) };
            }

            // Proses data report untuk menghitung jumlah IO, RE, PS per tanggal
            reports.forEach(report => {
                if (report.io_ts) {
                    const ioDate = moment(report.io_ts, 'DD/MM/YYYY').format('DD/MM/YYYY');
                    reportSummary[ioDate].io++;
                }
                if (report.re_ts) {
                    const reDate = moment(report.re_ts, 'DD/MM/YYYY').format('DD/MM/YYYY');
                    reportSummary[reDate].re++;
                }
                if (report.ps_ts) {
                    const psDate = moment(report.ps_ts, 'DD/MM/YYYY').format('DD/MM/YYYY');
                    reportSummary[psDate].ps++;
                }
            });

            let message = '';
            if (Object.keys(reportSummary).length === 0) {
                message = 'Tidak ada laporan yang ditemukan untuk bulan ini.';
            } else {
                const currentMonth = moment().format('MMMM YYYY');
                message = `Halo, report kamu pada bulan sekarang ${currentMonth} adalah:\n`;
                message += 'Tanggal - Hari = IO | RE | PS\n';
                Object.keys(reportSummary).forEach(date => {
                    const { io, re, ps, hari } = reportSummary[date];
                    message += `${date} - ${hari} = ${io} | ${re} | ${ps}\n`;
                });
            }

            if (message.trim() === '') {
                await telebot.sendMessage(chatId, 'Tidak ada data laporan yang ditemukan.');
            } else {
                await telebot.sendMessage(chatId, message);
                featureSelection(chatId, telebot);
            }
        } catch (error) {
            console.error('Error generating report:', error);
            await telebot.sendMessage(chatId, 'Terjadi kesalahan saat menghasilkan laporan. Silakan coba lagi nanti.');
        }
    };

    telebot.on('callback_query', async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;

        if (data === 'api_report') {
            await generateReport(chatId);
        }
    });
};
