// ext/trainer_logic.js - Логика тренажёра с адаптивным размером цифр
import { ExampleView } from "./components/ExampleView.js";
import { Abacus } from "./components/AbacusNew.js";
import { generateExample } from "./core/generator.js";
import { startTimer, stopTimer } from "../js/utils/timer.js";
import { playSound } from "../js/utils/sound.js";

/**
 * Основная функция монтирования тренажёра
 * @param {HTMLElement} container - Контейнер для монтирования
 * @param {Object} context - { t, state }
 */
export function mountTrainerUI(container, { t, state }) {
  try {
    console.log("🎮 Монтируем UI тренажёра с новым SVG абакусом...");
    console.log("📋 Настройки:", state?.settings);

    // ── Безопасно достаём настройки
    const st = state?.settings ?? {};
    const actionsCfg = st.actions ?? {};
    const examplesCfg = st.examples ?? {};
    const blockSimpleDigits = Array.isArray(st?.blocks?.simple?.digits)
      ? st.blocks.simple.digits
      : [];

    const digits = parseInt(st.digits, 10) || 1;
    const abacusDigits = digits + 1;
    const displayMode = st.inline ? "inline" : "column";

    // === Layout ===
    const layout = document.createElement("div");
    layout.className = `mws-trainer mws-trainer--${displayMode}`;
    layout.innerHTML = `
      <div class="trainer-main trainer-main--${displayMode}">
        <div id="area-example" class="example-view"></div>
      </div>
      <div id="panel-controls">
        <div class="answer-section-panel">
          <div class="answer-label">Ответ:</div>
          <input type="number" id="answer-input" placeholder="" />
          <button class="btn btn--primary" id="btn-submit">Ответить</button>
        </div>

        <div class="results-capsule-extended">
          <div class="results-capsule-extended__header">
            <span class="results-capsule-extended__label">Примеры:</span>
            <span class="results-capsule-extended__counter">
              <span id="stats-completed">0</span> /
              <span id="stats-total">${getExampleCount(examplesCfg)}</span>
            </span>
          </div>
          <div class="results-capsule">
            <div class="results-capsule__side results-capsule__side--correct">
              <div class="results-capsule__icon">✓</div>
              <div class="results-capsule__value" id="stats-correct">0</div>
            </div>
            <div class="results-capsule__divider"></div>
            <div class="results-capsule__side results-capsule__side--incorrect">
              <div class="results-capsule__icon">✗</div>
              <div class="results-capsule__value" id="stats-incorrect">0</div>
            </div>
          </div>
        </div>

        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-bar__correct" id="progress-correct" style="width:0%;"></div>
            <div class="progress-bar__incorrect" id="progress-incorrect" style="width:0%;"></div>
          </div>
          <div class="progress-label">
            <span class="progress-label__correct">Правильно: <strong id="percent-correct">0%</strong></span>
            <span class="progress-label__incorrect">Ошибки: <strong id="percent-incorrect">0%</strong></span>
          </div>
        </div>

        <div class="timer-capsule">
          <svg class="timer-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" stroke-width="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M6 2l3 3M18 2l-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span id="timer">00:00</span>
        </div>

        <div class="panel-card panel-card--compact">
          <button class="btn btn--secondary btn--fullwidth" id="btn-show-abacus">🧮 Показать абакус</button>
        </div>
      </div>
    `;
    container.appendChild(layout);

    // === Плавающий абакус ===
    const oldAbacus = document.getElementById("abacus-wrapper");
    if (oldAbacus) {
      oldAbacus.remove();
      console.log("🗑️ Старый абакус удален");
    }

    const abacusWrapper = document.createElement("div");
    abacusWrapper.className = "abacus-wrapper";
    abacusWrapper.id = "abacus-wrapper";
    abacusWrapper.innerHTML = `
      <div class="abacus-header">
        <span class="abacus-title">🧮 Абакус</span>
        <button class="abacus-close-btn" id="btn-close-abacus" title="Закрыть">×</button>
      </div>
      <div id="floating-abacus-container"></div>
    `;
    document.body.appendChild(abacusWrapper);

    const exampleView = new ExampleView(document.getElementById("area-example"));
    const abacus = new Abacus(document.getElementById("floating-abacus-container"), { digitCount: abacusDigits });

    const shouldShowAbacus = st.mode === "abacus";
    if (shouldShowAbacus) {
      abacusWrapper.classList.add("visible");
      document.getElementById("btn-show-abacus").textContent = "🧮 Скрыть абакус";
    }

    // === Состояние сессии ===
    const session = {
      currentExample: null,
      stats: { correct: 0, incorrect: 0, total: getExampleCount(examplesCfg) },
      completed: 0
    };

    // Подсчёт адаптивного шрифта
    function calculateFontSize(actions, maxDigits) {
      const baseSize = 120;
      const minSize = 35;
      const actionPenalty = 1.8;
      const digitPenalty = 3;
      let fontSize = baseSize - (actions * actionPenalty) - (maxDigits * digitPenalty);
      fontSize = Math.max(minSize, Math.min(baseSize, fontSize));
      return fontSize;
    }

    // === Генерация нового примера ===
    function showNextExample() {
      try {
        if (session.completed >= session.stats.total) {
          finishSession();
          return;
        }

        const selectedDigits =
          blockSimpleDigits.length > 0
            ? blockSimpleDigits.map(d => parseInt(d, 10))
            : [1, 2, 3, 4];

        session.currentExample = generateExample({
          blocks: { simple: { digits: selectedDigits } },
          actions: {
            min: actionsCfg.infinite ? 2 : (actionsCfg.count ?? 2),
            max: actionsCfg.infinite ? 5 : (actionsCfg.count ?? 2)
          }
        });

        if (!session.currentExample || !Array.isArray(session.currentExample.steps)) {
          throw new Error("Пустой пример (generateExample вернул некорректные данные)");
        }

        exampleView.render(session.currentExample.steps, displayMode);

        // === Адаптация размера цифр ===
        const areaExample = document.getElementById("area-example");
        const actionsLen = session.currentExample.steps?.length || 1;

        let maxDigits = 1;
        for (const step of session.currentExample.steps) {
          const num = parseInt(String(step).replace(/[^\d-]/g, ""), 10);
          if (!isNaN(num)) {
            maxDigits = Math.max(maxDigits, Math.abs(num).toString().length);
          }
        }

        const fontSize = calculateFontSize(actionsLen, maxDigits);
        const root = document.documentElement;
        root.style.setProperty("--example-actions", actionsLen);
        root.style.setProperty("--example-digits", maxDigits);
        root.style.setProperty("--example-font-size", `${fontSize}px`);

        areaExample.setAttribute("data-actions", actionsLen);
        areaExample.setAttribute("data-digits", maxDigits);

        abacus.reset();
        const input = document.getElementById("answer-input");
        input.value = "";
        input.focus();
        startTimer("timer");

        console.log("📝 Новый пример. Ответ:", session.currentExample.answer);
      } catch (e) {
        showFatalError(e);
      }
    }

    // === Проверка ответа ===
    function checkAnswer() {
      const input = document.getElementById("answer-input");
      const userAnswer = parseInt(input.value, 10);
      if (isNaN(userAnswer)) {
        alert("Пожалуйста, введи число");
        return;
      }
      stopTimer();

      const isCorrect = userAnswer === session.currentExample.answer;
      if (isCorrect) session.stats.correct++;
      else session.stats.incorrect++;
      session.completed++;
      updateStats();
      playSound(isCorrect ? "correct" : "wrong");

      setTimeout(() => showNextExample(), 500);
    }

    // === Обновление статистики ===
    function updateStats() {
      const { correct, incorrect, total } = session.stats;
      const completed = session.completed;
      document.getElementById("stats-completed").textContent = completed;
      document.getElementById("stats-correct").textContent = correct;
      document.getElementById("stats-incorrect").textContent = incorrect;
      const percentCorrect = completed > 0 ? Math.round((correct / completed) * 100) : 0;
      const percentIncorrect = completed > 0 ? Math.round((incorrect / completed) * 100) : 0;
      document.getElementById("progress-correct").style.width = percentCorrect + "%";
      document.getElementById("progress-incorrect").style.width = percentIncorrect + "%";
      document.getElementById("percent-correct").textContent = percentCorrect + "%";
      document.getElementById("percent-incorrect").textContent = percentIncorrect + "%";
    }

    function finishSession() {
      abacusWrapper.classList.remove("visible");
      if (window.finishTraining) {
        window.finishTraining({
          correct: session.stats.correct,
          total: session.stats.total
        });
      }
    }

    // === События ===
    document.getElementById("btn-show-abacus").addEventListener("click", () => {
      abacusWrapper.classList.toggle("visible");
      const btn = document.getElementById("btn-show-abacus");
      btn.textContent = abacusWrapper.classList.contains("visible")
        ? "🧮 Скрыть абакус"
        : "🧮 Показать абакус";
    });
    document.getElementById("btn-close-abacus").addEventListener("click", () => {
      abacusWrapper.classList.remove("visible");
      document.getElementById("btn-show-abacus").textContent = "🧮 Показать абакус";
    });
    document.getElementById("btn-submit").addEventListener("click", checkAnswer);
    document.getElementById("answer-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") checkAnswer();
    });

    // === Старт ===
    showNextExample();
    console.log(`✅ Тренажёр запущен (${abacusDigits} стоек, ${digits}-значные числа)`);

    // Возвращаем функцию очистки
    return () => {
      const wrapper = document.getElementById("abacus-wrapper");
      if (wrapper) wrapper.remove();
    };

  } catch (err) {
    showFatalError(err);
  }
}

/** Показать фатальную ошибку на экране, если тренажёр не смог стартовать */
function showFatalError(err) {
  console.error("Ошибка загрузки тренажёра:", err);
  const host = document.querySelector(".screen__body") || document.body;
  host.insertAdjacentHTML(
    "afterbegin",
    `<div style="color:#d93025;padding:16px">
      <b>Не удалось загрузить тренажёр.</b><br/>${(err && err.message) ? err.message : String(err)}
    </div>`
  );
}

/** Получить количество примеров из настроек */
function getExampleCount(examplesCfg) {
  if (!examplesCfg) return 10;
  return examplesCfg.infinite ? 10 : (examplesCfg.count ?? 10);
}
