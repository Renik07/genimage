const express = require('express');
const app = express();
const path = require('path');

// Раздача статики из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Пример: запуск сервера
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});