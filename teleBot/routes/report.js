const Report = require('../models/Report');
const User = require('../models/User');
const moment = require('moment');
const sessionManager = require('../other/session');

// Function to safely format dates using moment.js
const formatDate = (date) => {
    if (!date || isNaN(new Date(date).getTime())) {
        return null; // Return null if the date is invalid or missing
    }
    return moment(date).format('DD/MM/YYYY - dddd');
};

// Function to generate report based on Kode SF
const generateReport = async (kodeSF) => {
    try {
        // Find the user by Kode SF to get their name
        console.log('Searching for user with Kode SF:', kodeSF);
        const user = await User.findOne({ 'Kode SF': kodeSF });
        if (!user) throw new Error('User not found');

        console.log('User found:', user['Name']); // Log user name for confirmation

        // Fetch reports based on the user's Kode SF, sorted by event_date (ascending)
        const reports = await Report.find({ sf: kodeSF }).sort({ event_date: 1 }).exec();
        console.log('Reports found:', reports.length); // Log number of reports found

        // Object to hold the count for IO, RE, and PS events by date
        const eventCounts = {};

        // Track processed order_ids to avoid duplication
        const processedOrderIds = new Set();

        // Iterate through the reports to populate event counts
        reports.forEach(report => {
            // If this order_id was already processed, skip it
            if (processedOrderIds.has(report.order_id)) return;

            // Mark order_id as processed
            processedOrderIds.add(report.order_id);

            // Use the earliest event_date for the report
            const eventDate = formatDate(report.event_date); // Safely format the event date

            if (!eventDate) {
                console.error('Invalid event_date found:', report.event_date); // Log invalid dates
                return; // Skip this report if the date is invalid
            }

            // Initialize the counts for IO, RE, PS for this date if not already set
            if (!eventCounts[eventDate]) {
                eventCounts[eventDate] = { IO: 0, RE: 0, PS: 0 };
            }

            // Increment counts, treating null as 0
            eventCounts[eventDate].IO += report.io_ts ? 1 : 0;
            eventCounts[eventDate].RE += report.re_ts ? 1 : 0;
            eventCounts[eventDate].PS += report.ps_ts ? 1 : 0;
        });

        // If no events were found, return a message
        if (Object.keys(eventCounts).length === 0) {
            return `Tidak ada data untuk ${user['Name']} (Kode SF: ${kodeSF}).`;
        }

        // Generate the report as a string
        let reportString = `Report for ${user['Name']} (Kode SF: ${kodeSF}):\n\n`;
        reportString += `Tanggal  - Hari = IO | RE | PS |\n`;

        for (const [date, events] of Object.entries(eventCounts)) {
            reportString += `${date} = ${events.IO} | ${events.RE} | ${events.PS}\n`;
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

        // Check login status and get Kode SF
        const userStatus = sessionManager.getUserStatus(chatId);
        if (!userStatus || !userStatus.isLoggedIn) {
            await telebot.sendMessage(chatId, 'You need to log in first.');
            return;
        }

        if (callbackQuery.data === 'api_report') {
            try {
                const kodeSF = userStatus.kodeSF; // Get Kode SF from session
                console.log('Kode SF retrieved from session:', kodeSF);

                // Generate the report using the Kode SF
                const report = await generateReport(kodeSF); // Generate report based on Kode SF
                await telebot.sendMessage(chatId, report); // Send report to user
            } catch (error) {
                console.error('Error while fetching the report:', error);
                await telebot.sendMessage(chatId, 'Error while fetching the report.');
            }
        }
    });
};
