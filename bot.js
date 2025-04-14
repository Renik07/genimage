process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 0;
require('dotenv').config();

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

// Токен бота
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

// Канал
const chatId = "@leon_forecast";

// Папка с картинками
const imagesDir = path.join(__dirname, "public/images");

// Читаем файлы
fs.readdir(imagesDir, async (err, files) => {
  if (err) {
    return console.error("Ошибка чтения папки:", err);
  }

  const images = files.filter((file) => file.endsWith(".png"));

  for (let i = 0; i < images.length; i++) {
    const filename = images[i];
    const filePath = path.join(imagesDir, filename);
    const imageBuffer = fs.readFileSync(filePath);

    try {
      await bot.sendPhoto(chatId, imageBuffer, {
        caption: `Прогноз: ${filename}`,
      });
      console.log(`Отправлено: ${filename}`);
    } catch (error) {
      console.error(`Ошибка при отправке ${filename}:`, error.message);
    }

    // Задержка между отправками
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
});