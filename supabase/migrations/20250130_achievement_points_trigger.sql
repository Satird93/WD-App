-- ======================
-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ ОЧКОВ
-- ======================

-- 1. Функция для автоматического обновления total_points при добавлении достижения
CREATE OR REPLACE FUNCTION update_total_points_on_achievement()
RETURNS TRIGGER AS $$
BEGIN
  -- Если достижение имеет очки, добавляем их к total_points пользователя
  IF NEW.points > 0 THEN
    UPDATE users
    SET total_points = total_points + NEW.points
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Функция для автоматического обновления total_points при выполнении челленджа
CREATE OR REPLACE FUNCTION update_total_points_on_challenge()
RETURNS TRIGGER AS $$
BEGIN
  -- Добавляем заработанные очки к total_points пользователя
  IF NEW.points_earned > 0 THEN
    UPDATE users
    SET total_points = total_points + NEW.points_earned
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер на вставку достижения
DROP TRIGGER IF EXISTS achievement_points_trigger ON achievements;
CREATE TRIGGER achievement_points_trigger
  AFTER INSERT ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_total_points_on_achievement();

-- Триггер на выполнение челленджа
DROP TRIGGER IF EXISTS challenge_points_trigger ON user_challenges;
CREATE TRIGGER challenge_points_trigger
  AFTER INSERT ON user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_total_points_on_challenge();

-- Комментарии для документации
COMMENT ON FUNCTION update_total_points_on_achievement() IS 
'Автоматически обновляет total_points пользователя при выдаче достижения с очками';

COMMENT ON FUNCTION update_total_points_on_challenge() IS 
'Автоматически обновляет total_points пользователя при выполнении челленджа';
