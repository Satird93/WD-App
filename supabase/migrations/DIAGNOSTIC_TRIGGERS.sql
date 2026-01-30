-- ======================
-- ДИАГНОСТИКА И ИСПРАВЛЕНИЕ ТРИГГЕРОВ
-- ======================

-- ШАГ 1: Проверка существующих триггеров
-- Выполните этот запрос, чтобы увидеть, какие триггеры существуют
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('user_challenges', 'achievements')
ORDER BY event_object_table, trigger_name;

-- ШАГ 2: Проверка функций
-- Проверьте, существуют ли функции
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name IN ('update_total_points_on_challenge', 'update_total_points_on_achievement')
ORDER BY routine_name;

-- ШАГ 3: Удаление старых триггеров и функций (если нужно)
DROP TRIGGER IF EXISTS challenge_points_trigger ON user_challenges;
DROP TRIGGER IF EXISTS achievement_points_trigger ON achievements;
DROP FUNCTION IF EXISTS update_total_points_on_challenge();
DROP FUNCTION IF EXISTS update_total_points_on_achievement();

-- ШАГ 4: Создание функций заново
-- Функция для челленджей
CREATE OR REPLACE FUNCTION update_total_points_on_challenge()
RETURNS TRIGGER AS $$
BEGIN
  -- Добавляем заработанные очки к total_points пользователя
  IF NEW.points_earned > 0 THEN
    UPDATE users
    SET total_points = total_points + NEW.points_earned
    WHERE id = NEW.user_id;
    
    -- Логирование для отладки (опционально)
    RAISE NOTICE 'Updated total_points for user % by % points', NEW.user_id, NEW.points_earned;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функция для достижений
CREATE OR REPLACE FUNCTION update_total_points_on_achievement()
RETURNS TRIGGER AS $$
BEGIN
  -- Если достижение имеет очки, добавляем их к total_points пользователя
  IF NEW.points > 0 THEN
    UPDATE users
    SET total_points = total_points + NEW.points
    WHERE id = NEW.user_id;
    
    -- Логирование для отладки (опционально)
    RAISE NOTICE 'Updated total_points for user % by % points (achievement)', NEW.user_id, NEW.points;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ШАГ 5: Создание триггеров
-- Триггер для челленджей
CREATE TRIGGER challenge_points_trigger
  AFTER INSERT ON user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_total_points_on_challenge();

-- Триггер для достижений
CREATE TRIGGER achievement_points_trigger
  AFTER INSERT ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_total_points_on_achievement();

-- ШАГ 6: Проверка создания
-- Выполните снова запрос из ШАГ 1, чтобы убедиться, что триггеры созданы
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('user_challenges', 'achievements')
ORDER BY event_object_table, trigger_name;

-- ШАГ 7: Тестирование (опционально)
-- Вставьте тестовую запись, чтобы проверить работу триггера
-- ВАЖНО: Замените USER_ID и CHALLENGE_ID на реальные значения из вашей базы
-- 
-- INSERT INTO user_challenges (user_id, challenge_id, points_earned)
-- VALUES ('YOUR_USER_ID', 'YOUR_CHALLENGE_ID', 5);
-- 
-- Затем проверьте, обновился ли total_points:
-- SELECT id, full_name, total_points FROM users WHERE id = 'YOUR_USER_ID';
