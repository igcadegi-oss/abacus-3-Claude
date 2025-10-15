// ext/trainer_logic.js - Логика тренажёра С абакусом
import { ExampleView } from "./components/ExampleView.js";
import { Abacus } from "./components/Abacus.js";
import { generateExample } from "./core/generator.js";
import { startTimer, stopTimer } from "../js/utils/timer.js";
import { playSound } from "../js/utils/sound.js";

/**
 * Основная функция монтирования тренажёра
 * @param {HTMLElement} container - Контейнер для монтирования
 * @param {Object} context - { t, state }
 */
export function mountTrainerUI(container, { t, state }) {
  console.log('🎮 Монтируем UI тренажёра с абакусом...');
  console.log('📋 Настройки:', state.settings);
  
  const digits = parseInt(state.settings.digits, 10) || 1;
  
  // Определяем режим отображения из настроек
  const displayMode = state.settings.inline ? 'inline' : 'column';
  
  // Создаём основной layout
  const layout = document.createElement("div");
  layout.className = `mws-trainer mws-trainer--${displayMode}`;
  layout.innerHTML = `
    <div class="trainer-main">
      <div id="area-example" class="example-view"></div>
      
      <div id="answer-area" class="answer-area">
        <input type="number" id="answer-input" placeholder="Введи ответ" />
        <button class="btn btn--primary" id="btn-submit">Ответить</button>
      </div>
    </div>
    
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
        <button class="btn btn--secondary" id="btn-toggle-abacus">
          🧮 Показать абакус
        </button>
      </div>
      
      <div id="abacus-container" class="abacus-wrapper"></div>
    </div>
  `;
  
  container.appendChild(layout);
  
  // Инициализация компонентов
  const exampleView = new ExampleView(document.getElementById('area-example'));
  
  // Создаём контейнер для абакуса внутри panel-controls
  const abacusContainer = document.getElementById('abacus-container');
  const abacus = new Abacus(abacusContainer, digits);
  
  // Состояние видимости абакуса
  let abacusVisible = false;
  
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
  
  // Генерируем и показываем следующий пример
  function showNextExample() {
    // Проверка завершения сессии
    if (session.completed >= session.stats.total) {
      finishSession();
      return;
    }
    
    // Генерируем новый пример
    session.currentExample = generateExample(state.settings);
    
    // Отображаем шаги в нужном режиме
    exampleView.render(
      session.currentExample.steps,
      displayMode
    );
    
    // Сбрасываем абакус (начинаем с 0)
    abacus.reset();
    
    // Очищаем поле ввода
    const input = document.getElementById('answer-input');
    input.value = '';
    input.focus();
    
    // Запускаем таймер
    startTimer('timer');
    
    console.log('📝 Новый пример. Правильный ответ:', session.currentExample.answer);
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
    
    // Воспроизводим звук
    playSound(isCorrect ? 'correct' : 'wrong');
    
    console.log(isCorrect ? '✅ Правильно!' : '❌ Неправильно. Ответ был: ' + session.currentExample.answer);
    
    // Небольшая задержка и переход к следующему
    setTimeout(() => {
      showNextExample();
    }, 500);
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
  
  // Тоггл абакуса
  function toggleAbacus() {
    abacusVisible = !abacusVisible;
    const btn = document.getElementById('btn-toggle-abacus');
    
    if (abacusVisible) {
      abacusContainer.classList.add('visible');
      btn.textContent = '🧮 Скрыть абакус';
    } else {
      abacusContainer.classList.remove('visible');
      btn.textContent = '🧮 Показать абакус';
    }
  }
  
  // События
  document.getElementById('btn-submit').addEventListener('click', checkAnswer);
  
  document.getElementById('answer-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  });
  
  document.getElementById('btn-toggle-abacus').addEventListener('click', toggleAbacus);
  
  // Запускаем первый пример
  showNextExample();
  
  console.log(`✅ Тренажёр запущен с абакусом (${digits + 1} стоек)`);
}

/**
 * Получить количество примеров из настроек
 * @param {Object} settings
 * @returns {number}
 */
function getExampleCount(settings) {
  return settings.examples.infinite ? 10 : settings.examples.count;
}
