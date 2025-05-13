process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 0;

/* server */
require("dotenv").config({ path: "/home/node/hello-world/.env" });
const TELEGRAM_CHAT_ID = "@for_forecast";

/* local */
// require("dotenv").config();
// const TELEGRAM_CHAT_ID = "@foooor_forecast";

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const customParseFormat = require("dayjs/plugin/customParseFormat");

require("dayjs/locale/ru");

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ru");

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const generateImage = require("./generateImage");
const generateForecast = require("./generateForecast");
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
const imagesDir = path.join(__dirname, "public/images");

async function fetchTopEventsWithRetry(url, retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url);
      console.log(`+ Получены данные с ${url}`);
      return response.data;
    } catch (err) {
      console.error(
        `- Ошибка запроса к ${url} (попытка ${i + 1}):`,
        err.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  console.warn(
    `! Не удалось получить данные с ${url} после ${retries} попыток`
  );
  return [];
}

async function buildCaption(event) {
  let forecastText = "";
  if (event.forecast?.content) {
    forecastText = await generateForecast(event.forecast.content);
  }
  console.log("📤 Raw content от DeepSeek:", forecastText);
  return `${forecastText}`;
}

async function generateAllImages() {
  // Очистим папку с изображениями
  fs.readdirSync(imagesDir).forEach((file) => {
    if (file.endsWith(".png")) {
      fs.unlinkSync(path.join(imagesDir, file));
    }
  });

  console.log("+ Очищена папка изображений.");

  const urls = [
    "https://leon.ru/blog/api/top-events?limit=4&sport_id=1",
    // "https://leon.ru/blog/api/top-events?limit=1&sport_id=2",
    "https://leon.ru/blog/api/top-events?limit=4&sport_id=3",
  ];

  let allEvents = [];

  for (const url of urls) {
    const data = await fetchTopEventsWithRetry(url);
    allEvents = allEvents.concat(data);
  }

  console.log("+ Всего событий получено:", allEvents.length);

  for (const event of allEvents) {
    console.log("+ Обработка события:", event.slug);
    if (!event.rates) {
      console.warn("! Пропущено из-за отсутствия rates:", event.slug);
      continue;
    }

    const filename = `${event.slug}.png`;
    try {
      await generateImage(event, filename);
      console.log("+ Сгенерировано изображение:", filename);
    } catch (err) {
      console.error("- Ошибка генерации изображения:", err.message);
    }
  }

  return allEvents;
}

async function postImagesWithDelay(events) {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const filename = `${event.slug}.png`;
    const filepath = path.join(imagesDir, filename);

    console.log(`+ Попытка отправки ${i + 1} / ${events.length}: ${filename}`);

    if (!fs.existsSync(filepath)) {
      console.warn("! Файл не найден:", filename);
      continue;
    }

    const imageBuffer = fs.readFileSync(filepath);
    const caption = await buildCaption(event);

    try {
      console.log("Отправляем в ТГ:", filename);
      await bot.sendPhoto(TELEGRAM_CHAT_ID, imageBuffer, {
        caption,
        parse_mode: "HTML",
      });
      console.log("+ Отправлено в Telegram:", filename);
    } catch (err) {
      console.error("- Ошибка отправки:", err.message);
    }

    if (i < events.length - 1) {
      console.log("Ждем 30 минут до следующей публикации...");
      await new Promise((resolve) => setTimeout(resolve, 30 * 60 * 1000)); // 30 минут
    }
  }
}

async function main() {
  try {
    console.log("+ Запуск скрипта...");
    const events = await generateAllImages();
    await postImagesWithDelay(events);
    console.log("+ Скрипт завершён.");
  } catch (err) {
    console.error("! Глобальная ошибка в main():", err.message);
  }
}

main();
