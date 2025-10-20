function createRuleFromSettings(settings) {
  const { blocks, actions } = settings;

  // Нормализуем выбор цифр из блока "Просто"
  const selectedDigits = (blocks && blocks.simple && Array.isArray(blocks.simple.digits) && blocks.simple.digits.length > 0)
    ? blocks.simple.digits.map(d => parseInt(d, 10))
    : [1, 2, 3, 4];

  const hasFive = selectedDigits.includes(5);
  const onlyFiveSelected = (selectedDigits.length === 1 && selectedDigits[0] === 5);

  // Количество шагов берём только из actions
  const minSteps = actions && Number.isFinite(actions.min) ? Number(actions.min) : 2;
  const maxSteps = actions && Number.isFinite(actions.max) ? Number(actions.max) : 4;

  const config = {
    minSteps,
    maxSteps,
    selectedDigits,
    onlyFiveSelected,
  };

  if (hasFive) {
    console.log(`✅ Правило создано: Simple5Rule (цифры: ${selectedDigits.join(', ')})`);
    return new Simple5Rule(config);
  } else {
    console.log(`✅ Правило создано: SimpleRule (цифры: ${selectedDigits.join(', ')})`);
    return new SimpleRule(config);
  }
}
 = settings;
  
  // Определяем конфигурацию правила
  const config = {
    // Количество шагов (действий) в примере
    minSteps: actions?.min || /*removed_steps_ref*/ || 2,
    maxSteps: actions?.max || /*removed_steps_ref*/ || 4
  };
  
  console.log(`⚙️ Настройка количества действий: от ${config.minSteps} до ${config.maxSteps}`);
  
  // Получаем выбранные цифры из блока "Просто"
  const selectedDigits = blocks?.simple?.digits 
    ? blocks.simple.digits.map(d => parseInt(d, 10)) 
    : [1, 2, 3, 4];
  
  // Определяем, какое правило использовать
  const hasFive = selectedDigits.includes(5);
  
  if (hasFive) {
    // Если выбрана цифра 5 → используем Simple5Rule
    console.log(`✅ Правило создано: Simple5Rule (цифры: ${selectedDigits.join(', ')})`);
    return new Simple5Rule(config);
  } else {
    // Если цифра 5 не выбрана → используем SimpleRule
    console.log(`✅ Правило создано: SimpleRule (цифры: ${selectedDigits.join(', ')})`);
    return new SimpleRule(config);
  }
}

/**
 * Генерирует уникальные примеры (без повторений)
 * @private
 */
function generateUniqueExamples(settings, count) {
  const examples = [];
  const seen = new Set();
  const maxAttempts = count * 10; // Ограничение попыток
  
  let attempts = 0;
  while (examples.length < count && attempts < maxAttempts) {
    attempts++;
    
    const example = generateExample(settings);
    const key = exampleToKey(example);
    
    if (!seen.has(key)) {
      seen.add(key);
      examples.push(example);
    }
  }
  
  if (examples.length < count) {
    console.warn(`⚠️ Удалось сгенерировать только ${examples.length} из ${count} уникальных примеров`);
  }
  
  return examples;
}

/**
 * Преобразует пример в уникальный ключ для сравнения
 * @private
 */
function exampleToKey(example) {
  return `${example.start}|${example.steps.join('|')}|${example.answer}`;
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (для обратной совместимости)
// ============================================================================

/**
 * Вычисляет диапазон min–max для заданной разрядности
 * @param {number} digits
 * @returns {{min: number, max: number}}
 */
function getDigitRange(digits) {
  if (digits <= 1) return { min: 1, max: 9 };
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return { min, max };
}

/**
 * Генерация случайного числа в диапазоне [min, max]
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Проверка допустимости результата в зависимости от разрядности
 * @param {number} value - Результат операции
 * @param {number} digits - Количество разрядов (1-9)
 * @returns {boolean}
 */
function isValidResult(value, digits) {
  const { max } = getDigitRange(digits);
  return value >= 0 && value <= max;
}
