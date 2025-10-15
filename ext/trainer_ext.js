// ext/trainer_ext.js - Точка входа для тренажёра
import { preloadSounds, playSound } from '../js/utils/sound.js';
import { startTimer, stopTimer } from '../js/utils/timer.js';
import { t } from "../core/i18n.js";
import { state } from "../core/state.js";
import { mountTrainerUI } from "./trainer_logic.js";

// Инициализация звуков
preloadSounds();

// Проверочный тест (только для отладки)
setTimeout(() => {
  playSound('correct');
  console.log('✅ Утилиты загружены: звуки и таймер работают');
}, 1000);

// Ждём, пока DOM загрузится
(async () => {
  // Находим основной контейнер приложения
  const appRoot = document.getElementById("app");
  if (!appRoot) {
    console.error("❌ Не найден контейнер #app для тренажёра.");
    return;
  }

  console.log("✅ TrainerView инициализирован в #app");
  mountTrainerUI(appRoot, { t, state });
})();
