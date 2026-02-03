-- ==============================================
-- ПОЛНАЯ ПЕРЕСБОРКА БАЗЫ ДАННЫХ WD APP
-- ==============================================
-- Выполнять после удаления всех таблиц кроме users
-- Этот файл создаст все таблицы, функции, триггеры и данные

-- ======================
-- РАСШИРЕНИЯ
-- ======================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================
-- ТАБЛИЦА: challenges
-- ======================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('офп', 'фехтование')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('легко', 'средне', 'хард')),
  points INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  fencing_specialization TEXT CHECK (fencing_specialization IN ('сабля', 'длинный меч', 'рапира', 'общее')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_challenges_active ON challenges(is_active, category);

-- ======================
-- ТАБЛИЦА: user_challenges
-- ======================
CREATE TABLE user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  streak_day INTEGER DEFAULT 1,
  points_earned INTEGER NOT NULL
);

CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_completed_at ON user_challenges(completed_at DESC);

-- ======================
-- ТАБЛИЦА: fights
-- ======================
CREATE TABLE fights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  winner_id UUID NOT NULL REFERENCES users(id),
  loser_id UUID NOT NULL REFERENCES users(id),
  recorded_by UUID NOT NULL REFERENCES users(id),
  fight_type TEXT CHECK (fight_type IN ('спарринг', 'турнир')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fights_winner_id ON fights(winner_id);
CREATE INDEX idx_fights_loser_id ON fights(loser_id);

-- ======================
-- ТАБЛИЦА: achievements
-- ======================
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('снаряжение', 'заслуга')),
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  awarded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_achievements_user_id ON achievements(user_id);

-- ======================
-- ТАБЛИЦА: mascot_messages
-- ======================
CREATE TABLE mascot_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN ('мотивация', 'порицание', 'похвала', 'ирония')),
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- ======================
-- ФУНКЦИИ
-- ======================

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Функция подсчёта стрика
CREATE OR REPLACE FUNCTION calculate_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_date DATE := CURRENT_DATE;
  v_check_date DATE;
BEGIN
  FOR v_check_date IN
    SELECT DISTINCT DATE(completed_at) as challenge_date
    FROM user_challenges
    WHERE user_id = p_user_id
    ORDER BY challenge_date DESC
  LOOP
    IF v_check_date = v_current_date THEN
      v_streak := v_streak + 1;
      v_current_date := v_current_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- Функция обновления стрика пользователя
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET current_streak = calculate_streak(NEW.user_id),
      last_challenge_date = DATE(NEW.completed_at)
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер обновления стрика при новом челлендже
CREATE TRIGGER update_streak_on_challenge
  AFTER INSERT ON user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- Функция для получения рейтинга боёв
CREATE OR REPLACE FUNCTION get_fights_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  wins INTEGER,
  losses INTEGER,
  winrate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.full_name,
    COUNT(f1.id)::INTEGER AS wins,
    COUNT(f2.id)::INTEGER AS losses,
    CASE
      WHEN COUNT(f1.id) + COUNT(f2.id) = 0 THEN 0
      ELSE ROUND(COUNT(f1.id)::NUMERIC / (COUNT(f1.id) + COUNT(f2.id)) * 100, 2)
    END AS winrate
  FROM users u
  LEFT JOIN fights f1 ON u.id = f1.winner_id
  LEFT JOIN fights f2 ON u.id = f2.loser_id
  GROUP BY u.id, u.full_name
  HAVING COUNT(f1.id) + COUNT(f2.id) > 0
  ORDER BY wins DESC, winrate DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ======================
-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ ОЧКОВ
-- ======================

-- Функция для автоматического обновления total_points при выполнении челленджа
CREATE OR REPLACE FUNCTION update_total_points_on_challenge()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.points_earned > 0 THEN
    UPDATE users
    SET total_points = total_points + NEW.points_earned
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функция для автоматического обновления total_points при выдаче достижения
CREATE OR REPLACE FUNCTION update_total_points_on_achievement()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.points > 0 THEN
    UPDATE users
    SET total_points = total_points + NEW.points
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер на выполнение челленджа
CREATE TRIGGER challenge_points_trigger
  AFTER INSERT ON user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_total_points_on_challenge();

-- Триггер на выдачу достижения
CREATE TRIGGER achievement_points_trigger
  AFTER INSERT ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_total_points_on_achievement();

-- Комментарии для документации
COMMENT ON FUNCTION update_total_points_on_challenge() IS 
'Автоматически обновляет total_points пользователя при выполнении челленджа';

COMMENT ON FUNCTION update_total_points_on_achievement() IS 
'Автоматически обновляет total_points пользователя при выдаче достижения';

-- ======================
-- ROW LEVEL SECURITY (RLS)
-- ======================

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE fights ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascot_messages ENABLE ROW LEVEL SECURITY;

-- Политики для challenges
CREATE POLICY "Everyone can view active challenges" ON challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Trainers and admins can create challenges" ON challenges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = created_by
      AND role IN ('trainer', 'admin')
    )
  );

-- Политики для user_challenges
CREATE POLICY "Users can complete challenges" ON user_challenges
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own challenges" ON user_challenges
  FOR SELECT USING (true);

-- Политики для fights
CREATE POLICY "Everyone can view fights" ON fights
  FOR SELECT USING (true);

CREATE POLICY "Trainers can record fights" ON fights
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = recorded_by
      AND role IN ('trainer', 'admin')
    )
  );

-- Политики для achievements
CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "Trainers can award achievements" ON achievements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = awarded_by
      AND role IN ('trainer', 'admin')
    )
  );

-- Политики для mascot_messages
CREATE POLICY "Everyone can view active messages" ON mascot_messages
  FOR SELECT USING (is_active = true);

-- ======================
-- КОММЕНТАРИИ
-- ======================

COMMENT ON COLUMN users.role IS 'Роли: admin - администратор, trainer - тренер, student - ученик (по умолчанию)';
COMMENT ON COLUMN users.fencing_specialization IS 'Специализация фехтования: сабля, длинный меч, рапира';
COMMENT ON COLUMN challenges.fencing_specialization IS 'Специализация для фехтовальных челленджей: сабля, длинный меч, рапира, общее (для всех)';
