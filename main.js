process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 0;

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
const TelegramBot = require("node-telegram-bot-api");

// require("dotenv").config();
require("dotenv").config({ path: "/home/node/hello-world/.env" });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = "@for_forecast";
// const TELEGRAM_CHAT_ID = "@foooor_forecast";

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
const imagesDir = path.join(__dirname, "public/images");

async function fetchTopEventsWithRetry(url, retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (err) {
      console.error(`Ошибка запроса к ${url} (попытка ${i + 1}):`, err.message);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  return [];
}

function buildCaption(event) {
  const teamLine = `<b>${event.t1_name} - ${event.t2_name}</b>`;
  const leagueLine = event.league_name;
  const dateLine = dayjs(event.kickoff)
    .tz("Europe/Moscow")
    .locale("ru")
    .format("D MMMM HH:mm");

  const rates = event.rates?.pobeditel?.runner || {};
  const k1 = rates["1"] ? `<b>П1</b> - <b>${rates["1"]}</b>` : "";
  const x = rates["X"] ? `<b>Х</b> - <b>${rates["X"]}</b>` : "";
  const k2 = rates["2"] ? `<b>П2</b> - <b>${rates["2"]}</b>` : "";

  let oddsLine = "";

  if (event.sport?.id === 3) {
    oddsLine = [k1, k2].filter(Boolean).join(" | ");
  } else {
    oddsLine = [k1, x, k2].filter(Boolean).join(" | ");
  }

  return `${teamLine}\n${leagueLine}\n${dateLine}\n\nИсходы:\n${oddsLine}`;
}

async function generateAllImages() {
  // Очистим папку с изображениями
  fs.readdirSync(imagesDir).forEach((file) => {
    if (file.endsWith(".png")) {
      fs.unlinkSync(path.join(imagesDir, file));
    }
  });

  console.log("Очищена папка изображений.");

  const urls = [
    "https://leon.ru/blog/api/top-events?limit=3&sport_id=1",
    "https://leon.ru/blog/api/top-events?limit=3&sport_id=2",
    "https://leon.ru/blog/api/top-events?limit=3&sport_id=3",
  ];

  let allEvents = [];

  for (const url of urls) {
    const data = await fetchTopEventsWithRetry(url);
    allEvents = allEvents.concat(data);
  }

  for (const event of allEvents) {
    if (!event.rates) continue;

    const filename = `${event.slug}.png`;
    await generateImage(event, filename);
    console.log("Сгенерировано:", filename);
  }

  return allEvents;
}

async function postImagesWithDelay(events) {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const filename = `${event.slug}.png`;
    const filepath = path.join(imagesDir, filename);

    if (!fs.existsSync(filepath)) {
      console.warn("Файл не найден:", filename);
      continue;
    }

    const imageBuffer = fs.readFileSync(filepath);
    const caption = buildCaption(event);

    try {
      await bot.sendPhoto(TELEGRAM_CHAT_ID, imageBuffer, {
        caption,
        parse_mode: "HTML",
      });
      console.log("Отправлено в Telegram:", filename);
    } catch (err) {
      console.error("Ошибка отправки:", err.message);
    }

    if (i < events.length - 1) {
      console.log("Ждем 30 минут до следующей публикации...");
      await new Promise((resolve) => setTimeout(resolve, 30 * 60 * 1000)); // 30 минут
    }
  }
}

async function main() {
  const events = await generateAllImages();
  await postImagesWithDelay(events);
}

main();
