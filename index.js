const TelegramApi = require('node-telegram-bot-api');
require('dotenv').config()
const {gameOptions, againOptions} = require('./options.js')
const sequelize = require('./db.js')
const UserModel = require('./models.js')

const token = process.env.TOKEN;

const bot = new TelegramApi(token, {polling: true});

const chats ={}

const startGame =  async (chatId) => {
    await bot.sendMessage(chatId, 'Сейчас я загадаю число от 0 до 9, а ты должен его отгадать');
    const randomNumber = Math.floor(Math.random() * 10);
    chats[chatId] = randomNumber;
    await bot.sendMessage(chatId, 'Отгадывай', gameOptions)
}

const start = async () => {

    try {
        await sequelize.authenticate()
        await sequelize.sync()
    } catch(e) {
        console.log("Подключение к бд сломалось", e)
    }

    bot.setMyCommands([
        {command: '/start', description: 'Начальное приветствие'},
        {command: '/info', description: 'Выдает имя и фамилию'},
        {command: '/game', description: 'Нужно отгадать число от 0 до 9'},
    ])
    
    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;
        try {
            if (text === '/start') {
                await UserModel.create({chatId})
                await bot.sendSticker(chatId, 'https://sl.combot.org/programming_stickers/webp/0xf09f92bb.webp')
               return bot.sendMessage(chatId, `Добро пожаловать в моего бота`)
            }
            if (text === '/info') {
                const user = await UserModel.findOne({chatId})
                return bot.sendMessage(chatId, `Тебя зовут ${msg.from.first_name} ${msg.from.last_name}, в игрe у тебя правильных ответов ${user.right}, неправильных ${user.wrong}`)
            }
            if(text === '/game') {
                startGame(chatId)
            }
            return bot.sendMessage(chatId, 'Я тебя не понимаю')
        } catch(e) {
            return bot.sendMessage(chatId, 'Произошла какая-то ошибка')
        }
    })
    
    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;
        if (data === '/again') {
            return startGame(chatId)
        }
        const user = await UserModel.findOne({chatId});
        if (data == chats[chatId]) {
            user.right += 1;
            await bot.sendMessage(chatId, `Поздравляю, ты отгадал цифру ${chats[chatId]}`, againOptions)
        } else {
            user.wrong += 1;
            await bot.sendMessage(chatId, `К сожалению, ты не угадал, бот загадал цифру ${chats[chatId]}`,againOptions)
        }

        await user.save();
    })
}

start()