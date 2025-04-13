const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Раздача статики из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Обработка корневого маршрута
app.get('/', (req, res) => {
  res.send('Привет! Сервер работает.');
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});