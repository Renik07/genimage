// generateImage.js
const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");

// fonts
registerFont(
  path.resolve("./public/fonts/TT-Bluescreens-Trial-ExtraBold.ttf"),
  {
    family: "TTBluescreensTrial",
  }
);
registerFont(path.resolve("./public/fonts/UniSans-Heavy.ttf"), {
  family: "UniSansHeavyCaps",
});
// registerFont(
//   path.join(__dirname, "public/fonts", "TT-Bluescreens-Trial-ExtraBold.ttf"),
//   {
//     family: "TTBluescreensTrial",
//   }
// );
// registerFont(path.join(__dirname, "public/fonts", "UniSans-Heavy.ttf"), {
//   family: "UniSansHeavyCaps",
// });

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
    default:
      backgroundPath = path.join(__dirname, "public/templates/default.jpg");
  }
  let backgroundImage;
  try {
    backgroundImage = await loadImage(backgroundPath);
    console.log("✅ Фон успешно загружен:", backgroundPath);
  } catch (err) {
    console.error("❌ Ошибка загрузки фона:", err.message);
    throw err;
  }
  ctx.drawImage(backgroundImage, 0, 0, width, height);
  // const backgroundPath = path.join(__dirname, "public/templates/football.jpg");
  // const backgroundImage = await loadImage(backgroundPath);
  // ctx.drawImage(backgroundImage, 0, 0, width, height);
  // ctx.fillStyle = '#ffffff';
  // ctx.fillRect(0, 0, width, height);

  // Название лиги
  ctx.fillStyle = "#fff";
  ctx.font = "bold 28px UniSansHeavyCaps";
  ctx.fillText(eventData.league_name.toUpperCase(), 122, 110);

  // Сброс выравнивания (по умолчанию влево)
  ctx.textAlign = "left";

  // Дата матча
  ctx.font = "58px TTBluescreensTrial";
  ctx.fillStyle = "#fff";
  ctx.fillText(`${formatDateTime(eventData.kickoff)}`, 122, 170);

  // Названия команд
  ctx.font = "bold 60px UniSansHeavyCaps";
  ctx.fillStyle = "#fff";
  let team1 = truncateText(eventData.t1_name.toUpperCase(), 18);
  let team2 = truncateText(eventData.t2_name.toUpperCase(), 18);
  ctx.fillText(team1, 324, 390);
  ctx.fillText(team2, 324, 590);

  // Коэффициенты
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "bold 40px UniSansHeavyCaps";
  ctx.fillText(`${eventData.rates.pobeditel.runner["1"]}`, 295, 835);
  if (eventData.sport?.id !== 3 && eventData.rates?.pobeditel?.runner?.["X"]) {
    ctx.fillText(`${eventData.rates.pobeditel.runner["X"]}`, 555, 835);
  }
  if (eventData.sport?.id === 3) {
    ctx.fillText(`${eventData.rates.pobeditel.runner["2"]}`, 560, 821);
  } else {
    ctx.fillText(`${eventData.rates.pobeditel.runner["2"]}`, 820, 835);
  }

  // Логотипы
  const t1Logo = await loadImage(eventData.t1_logo);
  const t2Logo = await loadImage(eventData.t2_logo);
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
