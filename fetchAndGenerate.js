const axios = require("axios");
const generateImage = require("./generateImage");
const slugify = require("slugify"); // если хочешь красивые имена файлов

async function main() {
  const response = await axios.get("https://leon.ru/blog/api/top-events");
  const events = response.data;

  for (const event of events) {
    const filename = slugify(event.slug) + ".png";
    await generateImage(event, filename);
    console.log("Сохранено изображение:", filename);
  }
}

main().catch(console.error);
