// generateImage.js
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateImage(eventData, outputFilename) {
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Фон
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Название лиги (вверху по центру)
  ctx.fillStyle = '#000';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(eventData.league_name, width / 2, 50);

  // Сброс выравнивания (по умолчанию влево)
  ctx.textAlign = 'left';

  // Названия команд
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(eventData.t1_name, 150, 100);
  ctx.fillText(eventData.t2_name, 150, 200);

  // Коэффициенты
  ctx.font = '24px sans-serif';
  ctx.fillText(`Победа ${eventData.t1_name}: ${eventData.rates.pobeditel.runner["1"]}`, 150, 250);
  ctx.fillText(`Победа ${eventData.t2_name}: ${eventData.rates.pobeditel.runner["2"]}`, 150, 290);

  // Дата матча
  ctx.font = '20px sans-serif';
  ctx.fillText(`Дата: ${eventData.kickoff}`, 150, 330);

  // Логотипы
  const t1Logo = await loadImage(eventData.t1_logo);
  const t2Logo = await loadImage(eventData.t2_logo);
  ctx.drawImage(t1Logo, 50, 60, 80, 80);
  ctx.drawImage(t2Logo, 50, 160, 80, 80);

  // Сохраняем
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(__dirname, 'public/images', outputFilename);
  fs.writeFileSync(filePath, buffer);

  return filePath;
}

module.exports = generateImage;