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
  try {
    if (!eventData.rates?.pobeditel?.runner) {
      console.warn("! Нет коэффициентов, пропускаем:", eventData.slug);
      return;
    }

    const width = 1000;
    const height = 1000;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const x = canvas.width / 2;

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
        backgroundPath = path.join(
          __dirname,
          "public/templates/basketball.jpg"
        );
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
    ctx.textAlign = "center";
    ctx.font = '39px "DINPro Cond Black"';
    ctx.fillText(eventData.league_name.toUpperCase(), x, 160);

    // Дата матча
    const [date, time] = formatDateTime(eventData.kickoff);

    ctx.font = '65px "DINPro Cond Black"';
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";

    ctx.fillText(date, x, 260);
    ctx.fillText(time, x, 320);

    // Названия команд
    console.log("Отрисовка названий команд...");

    ctx.font = '122px "DINPro Cond Black"';
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    let team1 = truncateText(eventData.t1_name.toUpperCase(), 14);
    let team2 = truncateText(eventData.t2_name.toUpperCase(), 14);
    ctx.fillText(team1, x, 500);
    ctx.fillText(team2, x, 620);

    // Коэффициенты
    console.log("Отрисовка коэффициентов...");
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.font = '63px "TT Bluescreens Trial Black"';

    if (
      eventData.sport?.id === 2 ||
      (eventData.sport?.id === 1 && eventData.rates?.pobeditel?.runner?.["X"])
    ) {
      ctx.fillText(`${eventData.rates.pobeditel.runner["1"]}`, 294, 775);
      ctx.fillText(`${eventData.rates.pobeditel.runner["X"]}`, 540, 775);
      ctx.fillText(`${eventData.rates.pobeditel.runner["2"]}`, 789, 775);
    } else {
      ctx.fillText(`${eventData.rates.pobeditel.runner["1"]}`, 401, 775);
      ctx.fillText(`${eventData.rates.pobeditel.runner["2"]}`, 679, 775);
    }

    // Логотипы
    console.log("Отрисовка лого команд...");

    async function safeLoadImage(src, fallbackPath) {
      if (!src) {
        console.warn(`! Логотип не задан. Использую заглушку: ${fallbackPath}`);
        return await loadImage(fallbackPath);
      }

      try {
        return await loadImage(src);
      } catch (err) {
        console.warn(
          `! Не удалось загрузить изображение: ${src}. Использую заглушку.`
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

    ctx.drawImage(t1Logo, 275, 217, 100, 100);
    ctx.drawImage(t2Logo, 628, 217, 100, 100);

    // Сохраняем
    console.log("Сохранение файла...");

    const buffer = canvas.toBuffer("image/png");
    const filePath = path.join(__dirname, "public/images", outputFilename);
    fs.writeFileSync(filePath, buffer);

    return filePath;
  } catch (err) {
    console.error("- Ошибка внутри generateImage:", err.message);
    throw err; // чтобы она дошла до места вызова
  }
}

/* формат даты */
function formatDateTime(datetimeStr) {
  const [datePart, timePart] = datetimeStr.split(" ");
  const [year, month, day] = datePart.split("-");

  const formattedDate = `${day}.${month}`;
  const formattedTime = timePart;

  return [formattedDate, formattedTime]; // возвращаем массив строк
}

/* обрезка текста */
function truncateText(text, maxChars) {
  return text.length > maxChars ? text.slice(0, maxChars) + "..." : text;
}

module.exports = generateImage;
