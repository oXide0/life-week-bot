import dotenv from 'dotenv';
import cron from 'node-cron';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const BOT_TOKEN: string = process.env.BOT_TOKEN ?? '';
const AVERAGE_LIFETIME_WEEKS: number = 4000;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const userBirthdays: Map<number, Date> = new Map();

function getWeekNumber(birthDate: Date): number {
    const birthTime = birthDate.getTime();
    const now = Date.now();
    return Math.floor((now - birthTime) / (1000 * 60 * 60 * 24 * 7));
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, `Welcome! Please enter your birth date in YYYY-MM-DD format to start.`);
});

bot.onText(/^(\d{4})-(\d{2})-(\d{2})$/, (msg, match) => {
    if (match) {
        const birthDate = new Date(match[0]);
        if (!isNaN(birthDate.getTime())) {
            userBirthdays.set(msg.chat.id, birthDate);
            bot.sendMessage(msg.chat.id, `Your birth date has been saved! Press the button to get your week number.`, {
                reply_markup: {
                    inline_keyboard: [[{ text: 'Get Week Number', callback_data: 'get_week' }]],
                },
            });
        } else {
            bot.sendMessage(msg.chat.id, 'Invalid date format. Please use YYYY-MM-DD.');
        }
    }
});

bot.on('callback_query', (query) => {
    if (query.message) {
        const chatId: number = query.message.chat.id;
        if (query.data === 'get_week') {
            const birthDate = userBirthdays.get(chatId);
            if (birthDate) {
                const weekNumber = getWeekNumber(birthDate);
                bot.sendMessage(chatId, `You are in week ${weekNumber} of your life.`);
            } else {
                bot.sendMessage(chatId, 'Please enter your birth date first (YYYY-MM-DD).');
            }
        }
    }
});

cron.schedule(
    '0 9 * * *',
    () => {
        userBirthdays.forEach((birthDate, chatId) => {
            const weekNumber = getWeekNumber(birthDate);
            bot.sendMessage(
                chatId,
                `Good morning! You are in week ${weekNumber} of your life. The average human lifespan is around ${AVERAGE_LIFETIME_WEEKS} weeks.`
            );
        });
    },
    {
        timezone: 'Europe/Prague',
    }
);

console.log('Bot is running...');
