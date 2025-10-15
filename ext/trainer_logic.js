// ext/trainer_logic.js - Логика тренажёра
import { ExampleView } from "./components/ExampleView.js";
import { generateExamples } from "./core/generator.js";

/**
 * Монтирование UI тренажёра в указанный контейнер
 * @param {HTMLElement} container - Контейнер для монтирования
 * @param {Object} context - Контекст с t (переводы) и state
 */
export function mountTrainerUI(container, { t, state }) {
  console.log('🎮 Монтируем UI тренажёра...');
  
  // Создаём layout тренажёра
  const layout = document.createElement("div");
  layout.className = "trainer-layout";
  layout.innerHTML = `
    <div class="trainer-left">
      <div id="exampleView" class="example-view"></div>
      <div class="view-mode">
        <label>
          <input type="radio" name="mode" value="column" checked> 
          <span>${t('settings.inlineLabel') === 'Показувати приклад у рядок' ? 'Стовпчик' : 'Столбик'}</span>
        </label>
        <label>
          <input type="radio" name="mode" value="inline"> 
          <span>${t('settings.inlineLabel') || 'В строку'}</span>
        </label>
      </div>
    </div>
  `;
  
  // Добавляем в контейнер (НЕ очищая его!)
  container.appendChild(layout);

  // Инициализируем компоненты
  const exampleContainer = layout.querySelector("#exampleView");
  const exampleView = new ExampleView(exampleContainer);
  
  // Генерируем примеры
  const examples = generateExamples(10);
  exampleView.render(examples, "column");

  // Переключатель режима отображения
  layout.querySelectorAll("input[name='mode']").forEach(radio => {
    radio.addEventListener("change", e => {
      exampleView.render(examples, e.target.value);
      console.log(`📊 Режим изменён: ${e.target.value}`);
    });
  });

  console.log('✅ UI тренажёра смонтирован');
}
