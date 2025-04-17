process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 0;

require("dotenv").config();

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const generateImage = require("./generateImage");
const TelegramBot = require("node-telegram-bot-api");

const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
require("dayjs/locale/ru");

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ru");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// const TELEGRAM_CHAT_ID = "@for_forecast";
const TELEGRAM_CHAT_ID = "@foooor_forecast";

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("Не заданы TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID в .env");
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
const imagesDir = path.join(__dirname, "public/images");
const maxCaptionLength = 1024;

async function fetchAndPost() {
  try {
    // Удаляем все PNG-файлы из папки перед генерацией
    fs.readdir(imagesDir, (err, files) => {
      if (err) {
        console.error("Ошибка при чтении папки изображений:", err);
        return;
      }

      for (const file of files) {
        if (file.endsWith(".png")) {
          fs.unlinkSync(path.join(imagesDir, file));
        }
      }

      console.log("Очищена папка изображений.");
    });

    const response = await axios.get(
      "https://leon.ru/blog/api/top-events?sport_id=1"
    );
    const events = response.data;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      // Пропускаем, если нет коэффициентов
      if (!event.rates) {
        console.log(`Пропущено: нет коэффициентов`);
        continue;
      }

      const filename = `${event.slug}.png`;
      const filepath = path.join(imagesDir, filename);

      await generateImage(event, filename);
      console.log("Сохранено изображение:", filename);

      const imageBuffer = fs.readFileSync(filepath);
      // const rawCaption = event.forecast?.content || "Описание отсутствует";
      // const withDates = parseKickoffTags(rawCaption);
      // const cleanCaption = withDates.replace(/<\/?[^>]+(>|$)/g, "").trim();
      // let trimmedCaption = cleanCaption;
      // if (cleanCaption.length > maxCaptionLength) {
      //   trimmedCaption = cleanCaption.slice(0, maxCaptionLength - 1) + "…";
      // }

      const caption = buildCaption(event);

      // Задержка перед отправкой (1.5 сек на каждый следующий пост)
      // await new Promise((resolve) => setTimeout(resolve, i * 1500));

      // await bot.sendPhoto(TELEGRAM_CHAT_ID, imageBuffer, {
      //   caption,
      // });

      // console.log("Отправлено в Telegram:", filename);
    }
  } catch (err) {
    console.error("Ошибка:", err.message);
  }
}

function parseKickoffTags(html) {
  return html.replace(
    /<kickoff-local[^>]*timestamp="([^"]+)"[^>]*format="([^"]+)"[^>]*>/g,
    (_, timestamp, format) => {
      return dayjs(timestamp).format(format);
    }
  );
}

function buildCaption(event) {
  const teamLine = `${event.t1_name} - ${event.t2_name}`;
  const leagueLine = event.league_name;
  const dateLine = dayjs(event.kickoff).format("D MMMM HH:mm");

  const rates = event.rates?.pobeditel?.runner || {};
  const k1 = rates["1"] ? `П1 - ${rates["1"]}` : "";
  const x = rates["X"] ? `X - ${rates["X"]}` : "";
  const k2 = rates["2"] ? `П2 - ${rates["2"]}` : "";

  let oddsLine = "";

  if (event.sport?.id === 3) {
    // Баскетбол: только П1 и П2
    oddsLine = [k1, k2].filter(Boolean).join(" | ");
  } else {
    // Все остальные: П1, Х, П2
    oddsLine = [k1, x, k2].filter(Boolean).join(" | ");
  }

  return `${teamLine}\n${leagueLine}\n${dateLine}\n\n${"Исходы"}:\n${oddsLine}`;
}

fetchAndPost();
