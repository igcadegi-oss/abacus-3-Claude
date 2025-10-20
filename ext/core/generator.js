// ext/core/generator.js - Генератор примеров

import { ExampleGenerator } from './ExampleGenerator.js';
import { SimpleRule } from './rules/SimpleRule.js';
import { Simple5Rule } from './rules/Simple5Rule.js';

/**
 * Генерирует один пример на основе настроек
 * @param {Object} settings - Настройки генерации
 * @returns {Object} - Пример {start, steps: string[], answer}
 */
export function generateExample(settings) {
  const rule = createRuleFromSettings(settings);
  const generator = new ExampleGenerator(rule);
  const example = generator.generate();
  return generator.toTrainerFormat(example);
}

/**
 * Создаёт правило на основе настроек
 * @param {Object} settings - Настройки {blocks, actions}
 * @returns {BaseRule}
 */
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

/**
 * Генерирует уникальные примеры (без повторений)
 * @param {Object} settings - Настройки генерации
 * @param {number} count - Количество примеров
 * @returns {Array}
 */
export function generateUniqueExamples(settings, count) {
  const examples = [];
  const seen = new Set();
  const maxAttempts = count * 10;
  
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
