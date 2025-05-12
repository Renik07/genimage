//server
require("dotenv").config({ path: "/home/node/hello-world/.env" });

// local
// require("dotenv").config();

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

async function generateForecast(fullText) {
  console.log(
    "📩 Получен текст для генерации прогноза:",
    fullText.slice(0, 100)
  );
  if (!fullText) {
    return "";
  }
  const prompt = `
	Напиши развернутый аналитический прогноз на матч на основе вот этого текста ${JSON.stringify(fullText)}. 
	Прогноз должен быть:
	- Прогноз должен начинаться с заголовка, который оборачивается в тег <b>
	- Прогноз должен быть до 10 предложений
	- Весь прогноз должен быть строго до 1000 символов, включая пробелы
	- Не пиши сколько символов в тексте.
	- Все предложения должны быть завершены по смыслу, а в конце прогноза стоять точка
	- Разделяй текст на логические абзацы, делай отступ между ними с помощью двойного переноса строки (\n\n)
	- Аналитически глубоким
	- Человечным и увлекательным

	Требования к стилю:
	- Используй живую, но профессиональную речь
	- Чередуй длинные и короткие предложения
	- Добавляй экспертное мнение и инсайты
	- Используй сравнения и метафоры где уместно
	- Приводи конкретные цифры и факты

	Сформируй ответ в HTML-формате. Используй только следующие теги:
	- <b> для выделения ключевых слов

	Не используй все остальные теги, в том числе:
	- <html>, <h1>, <h2>, <h3>, <p>, <br> и так далее.

	Не добавляй итоговые подсчёты символов, Не используй markdown-разметку, такую как \`\`\`html или другие блоки кода.
	`;

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 1.5,
      max_tokens: 500,
    });

    const forecast = chatCompletion.choices[0]?.message?.content?.trim() || "";
    console.log("+ Сгенерирован прогноз от ИИ.");
    return forecast;
  } catch (error) {
    console.error("- Ошибка генерации прогноза:", error.message);
    return "";
  }
}

module.exports = generateForecast;
