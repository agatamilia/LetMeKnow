const Report = require('../models/Report');
const User = require('../models/User');
const moment = require('moment');
const sessionManager = require('../other/session');
moment.locale('id');

const formatDateWithDay = (date) => {
    if (!date || isNaN(new Date(date).getTime())) {
        return null; 
    }
    // Format tanggal untuk pengelompokan (tanpa waktu) dan menampilkan hari
    return moment(date).format('DD/MM/YYYY - dddd');
};

const getDateKey = (date) => {
    if (!date || isNaN(new Date(date).getTime())) {
        return null; 
    }
    // Hanya gunakan bagian tanggal untuk pengelompokan
    return moment(date).format('YYYY-MM-DD');
};

const generateReport = async (kodeSF) => {
    try {
        console.log('Searching for user with Kode SF:', kodeSF);
        const user = await User.findOne({ 'Kode SF': kodeSF });
        if (!user) throw new Error('User not found');

        console.log('User found:', user['Name']);

        const reports = await Report.find({ sf: kodeSF }).sort({ order_id: 1, event_date: -1 }).exec();
        console.log('Reports found:', reports.length);

        const eventCounts = {};
        const processedOrderIds = new Set();

        reports.forEach(report => {
            // Skip already processed order_ids
            if (processedOrderIds.has(report.order_id)) return;

            // Mark order_id as processed
            processedOrderIds.add(report.order_id);

            // Safely format the event date for key
            const eventKey = getDateKey(report.event_date); // Kunci pengelompokan (hanya tanggal)
            if (!eventKey) return;

            // Initialize event date count if not already present
            if (!eventCounts[eventKey]) {
                // Include the formatted date with day for display
                eventCounts[eventKey] = {
                    formattedDate: formatDateWithDay(report.event_date), // Tanggal dengan hari untuk tampilan
                    IO: 0,
                    RE: 0,
                    PS: 0
                };
            }

            // Increment counts based on io_ts, re_ts, and ps_ts
            eventCounts[eventKey].IO += report.io_ts ? 1 : 0;
            eventCounts[eventKey].RE += report.re_ts ? 1 : 0;
            eventCounts[eventKey].PS += report.ps_ts ? 1 : 0;
        });

        if (Object.keys(eventCounts).length === 0) {
            return `Tidak ada data untuk ${user['Name']} (Kode SF: ${kodeSF}).`;
        }

        // Generate report string
        let reportString = `Report for ${user['Name']} (Kode SF: ${kodeSF}):\n\n`;
        reportString += `Tanggal  - Hari = IO | RE | PS |\n`;

        for (const { formattedDate, IO, RE, PS } of Object.values(eventCounts)) {
            reportString += `${formattedDate} = ${IO} | ${RE} | ${PS}\n`;
        }

        return reportString;

    } catch (err) {
        console.error('Error generating report:', err);
        return 'An error occurred while generating the report.';
    }
};


module.exports = (telebot) => {
    telebot.on('callback_query', async (callbackQuery) => {
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;

        const userStatus = sessionManager.getUserStatus(chatId);
        if (!userStatus || !userStatus.isLoggedIn) {
            return;
        }

        if (callbackQuery.data === 'api_report') {
            try {
                const kodeSF = userStatus.kodeSF;
                console.log('Kode SF retrieved from session:', kodeSF);

                const report = await generateReport(kodeSF);
                await telebot.sendMessage(chatId, report);
            } catch (error) {
                console.error('Error while fetching the report:', error);
                await telebot.sendMessage(chatId, 'Error while fetching the report.');
            }
        }
    });
};
