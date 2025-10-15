// ext/trainer_logic.js - Полная логика тренажёра
import { ExampleView } from "./components/ExampleView.js";
import { LeoModal } from "./components/LeoModal.js";
import { generateExample } from "./core/generator.js";
import { startTimer, stopTimer } from "../js/utils/timer.js";
import { playSound } from "../js/utils/sound.js";

/**
 * Основная функция монтирования тренажёра
 * @param {HTMLElement} container - Контейнер для монтирования
 * @param {Object} context - { t, state }
 */
export function mountTrainerUI(container, { t, state }) {
  console.log('🎮 Монтируем полный UI тренажёра...');
  console.log('📋 Настройки:', state.settings);
  
  // Создаём основной layout
  const layout = document.createElement("div");
  layout.className = "mws-trainer";
  layout.innerHTML = `
    <div id="area-example" class="example-view"></div>
    
    <div id="panel-controls">
      <div class="panel-card">
        <div id="timer" style="font-size: 24px; font-weight: bold; color: #7d733a; text-align: center;">00:00</div>
      </div>
      
      <div class="panel-card">
        <div class="stats">
          <div>✅ <span id="stats-correct">0</span></div>
          <div>❌ <span id="stats-incorrect">0</span></div>
          <div>📝 <span id="stats-remaining">${getExampleCount(state.settings)}</span></div>
        </div>
        <div class="progress">
          <div class="progress__bar" id="progress-bar" style="width: 0%;"></div>
        </div>
      </div>
      
      <div class="panel-card">
        <input type="number" id="answer-input" placeholder="Введи ответ" />
        <button class="btn btn--primary" id="btn-submit">Ответить</button>
      </div>
      
      <div class="panel-card">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="radio" name="display-mode" value="column" checked>
          <span>Столбик</span>
        </label>
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="radio" name="display-mode" value="inline">
          <span>В строку</span>
        </label>
      </div>
    </div>
  `;
  
  container.appendChild(layout);
  
  // Инициализация компонентов
  const exampleView = new ExampleView(document.getElementById('area-example'));
  const leoModal = new LeoModal();
  leoModal.setLanguage(state.language || 'ru');
  
  // Состояние сессии
  const session = {
    currentExample: null,
    stats: {
      correct: 0,
      incorrect: 0,
      total: getExampleCount(state.settings)
    },
    completed: 0
  };
  
  // Генерируем и показываем первый пример
  function showNextExample() {
    // Проверка завершения сессии
    if (session.completed >= session.stats.total) {
      finishSession();
      return;
    }
    
    // Генерируем новый пример
    session.currentExample = generateExample(state.settings);
    
    // Отображаем шаги
    const displayMode = document.querySelector('input[name="display-mode"]:checked').value;
    exampleView.render(
      session.currentExample.steps,
      displayMode
    );
    
    // Очищаем поле ввода
    document.getElementById('answer-input').value = '';
    document.getElementById('answer-input').focus();
    
    // Запускаем таймер
    startTimer('timer');
    
    console.log('📝 Показан новый пример. Правильный ответ:', session.currentExample.answer);
  }
  
  // Проверка ответа
  function checkAnswer() {
    const input = document.getElementById('answer-input');
    const userAnswer = parseInt(input.value, 10);
    
    if (isNaN(userAnswer)) {
      alert('Пожалуйста, введи число');
      return;
    }
    
    stopTimer();
    
    const isCorrect = userAnswer === session.currentExample.answer;
    
    // Обновляем статистику
    if (isCorrect) {
      session.stats.correct++;
    } else {
      session.stats.incorrect++;
    }
    session.completed++;
    
    updateStats();
    
    // Показываем LeoModal
    leoModal.show(isCorrect, () => {
      // После закрытия модалки → следующий пример
      showNextExample();
    });
  }
  
  // Обновление статистики на экране
  function updateStats() {
    document.getElementById('stats-correct').textContent = session.stats.correct;
    document.getElementById('stats-incorrect').textContent = session.stats.incorrect;
    document.getElementById('stats-remaining').textContent = session.stats.total - session.completed;
    
    // Обновляем прогресс-бар
    const progress = (session.completed / session.stats.total) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';
  }
  
  // Завершение сессии
  function finishSession() {
    console.log('🏁 Сессия завершена. Итоги:', session.stats);
    
    // Вызываем глобальную функцию для перехода к Results
    if (window.finishTraining) {
      window.finishTraining({
        correct: session.stats.correct,
        total: session.stats.total
      });
    }
  }
  
  // События
  document.getElementById('btn-submit').addEventListener('click', checkAnswer);
  
  document.getElementById('answer-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  });
  
  // Переключатель режима отображения
  document.querySelectorAll('input[name="display-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (session.currentExample) {
        const mode = radio.value;
        exampleView.render(session.currentExample.steps, mode);
        console.log(`📊 Режим отображения: ${mode}`);
      }
    });
  });
  
  // Запускаем первый пример
  showNextExample();
  
  console.log('✅ Тренажёр полностью инициализирован');
}

/**
 * Получить количество примеров из настроек
 * @param {Object} settings
 * @returns {number}
 */
function getExampleCount(settings) {
  return settings.examples.infinite ? 10 : settings.examples.count;
}
