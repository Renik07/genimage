process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 0;

require("dotenv").config();

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const generateImage = require("./generateImage");
const TelegramBot = require("node-telegram-bot-api");

// Загружаем переменные из .env
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = "@leon_forecast";

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("Не заданы TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID в .env");
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
const imagesDir = path.join(__dirname, "public/images");

async function fetchAndGenerate() {
  try {
    const response = await axios.get("https://leon.ru/blog/api/top-events");
    const events = response.data;

    for (const event of events) {
      const filename = slugify(event.slug) + ".png";
      await generateImage(event, filename);
      console.log("Сохранено изображение:", filename);
    }
  } catch (err) {
    console.error("Ошибка при получении событий:", err.message);
    throw err;
  }
}

function sendImagesToTelegram() {
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      console.error("Ошибка чтения папки:", err);
      return;
    }

    const images = files.filter((f) => f.endsWith(".png"));

    if (images.length === 0) {
      console.log("Картинки не найдены в папке:", imagesDir);
      return;
    }

    images.forEach((filename, i) => {
      const fullPath = path.join(imagesDir, filename);
      const imageBuffer = fs.readFileSync(fullPath);

      setTimeout(() => {
        bot
          .sendPhoto(TELEGRAM_CHAT_ID, imageBuffer, {
            caption: `${filename}`,
          })
          .then(() => {
            console.log(`Отправлено в Telegram: ${filename}`);
          })
          .catch((err) => {
            console.error(`Ошибка при отправке "${filename}":`, err.message);
          });
      }, i * 1500); // задержка (1.5с)
    });
  });
}

async function main() {
  await fetchAndGenerate();
  sendImagesToTelegram();
}

main().catch((err) => {
  console.error("Ошибка в main():", err.message);
});
