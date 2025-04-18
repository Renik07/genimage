// generateImage.js
const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");

// fonts
// registerFont(
//   path.join(__dirname, "public/fonts", "Roboto-ExtraBold.ttf"),
//   {
//     family: "RobotoExtraBold",
//   }
// )

async function generateImage(eventData, outputFilename) {
  const width = 1000;
  const height = 1000;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Фон
  let backgroundPath;
  switch (eventData.sport?.id) {
    case 1:
      backgroundPath = path.join(__dirname, "public/templates/football.jpg");
      break;
    case 2:
      backgroundPath = path.join(__dirname, "public/templates/hockey.jpg");
      break;
    case 3:
      backgroundPath = path.join(__dirname, "public/templates/basketball.jpg");
      break;
    case 4:
      backgroundPath = path.join(__dirname, "public/templates/tennis.jpg");
      break;
    case 5:
      backgroundPath = path.join(__dirname, "public/templates/cs.jpg");
      break;
    case 6:
      backgroundPath = path.join(__dirname, "public/templates/dota.jpg");
      break;
    default:
      backgroundPath = path.join(__dirname, "public/templates/default.jpg");
  }
  let backgroundImage;
  try {
    backgroundImage = await loadImage(backgroundPath);
    console.log("Фон успешно загружен:", backgroundPath);
  } catch (err) {
    console.error("Ошибка загрузки фона:", err.message);
    throw err;
  }
  ctx.drawImage(backgroundImage, 0, 0, width, height);

  // Название лиги
  ctx.fillStyle = "#fff";
  ctx.font = '27px "Roboto Condensed ExtraBold"';
  // ctx.font = 'bold 27px "RobotoExtraBold"';
  ctx.fillText(eventData.league_name.toUpperCase(), 122, 110);

  // Сброс выравнивания (по умолчанию влево)
  ctx.textAlign = "left";

  // Дата матча
  /* server */
  ctx.font = '63px "TT Bluescreens Trial ExtraBold"';
  /* local */
  // ctx.font = '63px "RobotoExtraBold"';
  ctx.fillStyle = "#fff";
  ctx.fillText(`${formatDateTime(eventData.kickoff)}`, 122, 170);

  // Названия команд
  ctx.font = '58px "Roboto Condensed Black"';
  // ctx.font = '55px "RobotoExtraBold"';
  ctx.fillStyle = "#fff";
  let team1 = truncateText(eventData.t1_name.toUpperCase(), 18);
  let team2 = truncateText(eventData.t2_name.toUpperCase(), 18);
  ctx.fillText(team1, 324, 390);
  ctx.fillText(team2, 324, 590);

  // Коэффициенты
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = '38px "Roboto Condensed Black"';
  // ctx.font = '38px "RobotoExtraBold"';

  if (
    eventData.sport?.id === 2 ||
    (eventData.sport?.id === 1 && eventData.rates?.pobeditel?.runner?.["X"])
  ) {
    ctx.fillText(`${eventData.rates.pobeditel.runner["1"]}`, 295, 835);
    ctx.fillText(`${eventData.rates.pobeditel.runner["2"]}`, 820, 835);
    ctx.fillText(`${eventData.rates.pobeditel.runner["X"]}`, 555, 835);
  } else {
    ctx.fillText(`${eventData.rates.pobeditel.runner["1"]}`, 385, 835);
    ctx.fillText(`${eventData.rates.pobeditel.runner["2"]}`, 790, 835);
  }

  // Логотипы
  async function safeLoadImage(src, fallbackPath) {
    try {
      return await loadImage(src);
    } catch (err) {
      console.warn(
        `Не удалось загрузить изображение: ${src}. Использую заглушку.`
      );
      return await loadImage(fallbackPath);
    }
  }
  const t1Logo = await safeLoadImage(
    eventData.t1_logo,
    path.join(__dirname, "public/templates/logo1.png")
  );

  const t2Logo = await safeLoadImage(
    eventData.t2_logo,
    path.join(__dirname, "public/templates/logo2.png")
  );
  // const t1Logo = await loadImage(eventData.t1_logo);
  // const t2Logo = await loadImage(eventData.t2_logo);
  ctx.drawImage(t1Logo, 145, 319, 100, 100);
  ctx.drawImage(t2Logo, 145, 519, 100, 100);

  // Сохраняем
  const buffer = canvas.toBuffer("image/png");
  const filePath = path.join(__dirname, "public/images", outputFilename);
  fs.writeFileSync(filePath, buffer);

  return filePath;
}

/* формат даты */
function formatDateTime(datetimeStr) {
  const months = [
    "ЯНВАРЯ",
    "ФЕВРАЛЯ",
    "МАРТА",
    "АПРЕЛЯ",
    "МАЯ",
    "ИЮНЯ",
    "ИЮЛЯ",
    "АВГУСТА",
    "СЕНТЯБРЯ",
    "ОКТЯБРЯ",
    "НОЯБРЯ",
    "ДЕКАБРЯ",
  ];

  const [datePart, timePart] = datetimeStr.split(" ");
  const [year, month, day] = datePart.split("-");

  const formatted = `${parseInt(day)} ${
    months[parseInt(month) - 1]
  } ${timePart}`;
  return formatted;
}

/* обрезка текста */
function truncateText(text, maxChars) {
  return text.length > maxChars ? text.slice(0, maxChars) + "..." : text;
}

module.exports = generateImage;
