-- Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================
-- ТАБЛИЦА: users
-- ======================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT NOT NULL,
  age INTEGER,
  level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_challenge_date DATE,
  is_trainer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_total_points ON users(total_points DESC);

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска активных челленджей
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

-- Индексы для рейтингов и стриков
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_completed_at ON user_challenges(completed_at DESC);
-- Индекс с DATE() убран, так как функция не IMMUTABLE
-- CREATE INDEX idx_user_challenges_user_date ON user_challenges(user_id, DATE(completed_at));

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

-- Индексы для подсчёта побед
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

-- Индекс для получения достижений пользователя
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
-- ТРИГГЕРЫ И ФУНКЦИИ
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
  -- Проверяем последовательные дни с челленджами
  FOR v_check_date IN
    SELECT DISTINCT DATE(completed_at) as challenge_date
    FROM user_challenges
    WHERE user_id = p_user_id
    ORDER BY challenge_date DESC
  LOOP
    -- Если дата соответствует текущей проверяемой дате
    IF v_check_date = v_current_date THEN
      v_streak := v_streak + 1;
      v_current_date := v_current_date - INTERVAL '1 day';
    ELSE
      -- Стрик прерван
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

-- Функция для увеличения очков пользователя
CREATE OR REPLACE FUNCTION increment_user_points(
  p_user_id UUID,
  p_points INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET total_points = total_points + p_points
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

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
      WHEN COUNT(f1.id) + COUNT(f2.id) > 0
      THEN ROUND((COUNT(f1.id)::NUMERIC / (COUNT(f1.id) + COUNT(f2.id))) * 100, 1)
      ELSE 0
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
-- ROW LEVEL SECURITY
-- ======================

-- Включаем RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE fights ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascot_messages ENABLE ROW LEVEL SECURITY;

-- Политики для users (все могут читать, менять только свои данные)
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (telegram_id = current_setting('app.current_user_telegram_id', true)::BIGINT);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (true);

-- Политики для challenges (все могут читать)
CREATE POLICY "Everyone can view challenges" ON challenges
  FOR SELECT USING (is_active = true);

-- Политики для user_challenges (все могут читать, создавать свои)
CREATE POLICY "Everyone can view challenges history" ON user_challenges
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own challenges" ON user_challenges
  FOR INSERT WITH CHECK (true);

-- Политики для fights (все могут читать)
CREATE POLICY "Everyone can view fights" ON fights
  FOR SELECT USING (true);

CREATE POLICY "Anyone can record fights" ON fights
  FOR INSERT WITH CHECK (true);

-- Политики для achievements (все могут читать)
CREATE POLICY "Everyone can view achievements" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "Anyone can give achievements" ON achievements
  FOR INSERT WITH CHECK (true);

-- Политики для mascot_messages (все могут читать активные)
CREATE POLICY "Everyone can view active messages" ON mascot_messages
  FOR SELECT USING (is_active = true);

-- ======================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- ======================

-- Заполнение челленджей
INSERT INTO challenges (name, category, difficulty, points, description) VALUES
-- ОФП
('Отжимания', 'офп', 'легко', 1, '10 отжиманий за подход'),
('Отжимания', 'офп', 'средне', 3, '25 отжиманий за подход'),
('Отжимания', 'офп', 'хард', 5, '50 отжиманий за подход'),
('Планка', 'офп', 'легко', 1, '30 секунд планки'),
('Планка', 'офп', 'средне', 3, '1 минута планки'),
('Планка', 'офп', 'хард', 5, '2 минуты планки'),
('Приседания', 'офп', 'легко', 1, '20 приседаний'),
('Приседания', 'офп', 'средне', 3, '40 приседаний'),
('Приседания', 'офп', 'хард', 5, '60 приседаний'),
('Бёрпи', 'офп', 'легко', 1, '10 бёрпи'),
('Бёрпи', 'офп', 'средне', 3, '20 бёрпи'),
('Бёрпи', 'офп', 'хард', 5, '30 бёрпи'),
-- Фехтование
('Выпады', 'фехтование', 'легко', 2, '20 выпадов на каждую ногу'),
('Выпады', 'фехтование', 'средне', 4, '40 выпадов на каждую ногу'),
('Выпады', 'фехтование', 'хард', 6, '60 выпадов на каждую ногу'),
('Передвижения', 'фехтование', 'легко', 2, '5 минут работы ног'),
('Передвижения', 'фехтование', 'средне', 4, '10 минут работы ног'),
('Передвижения', 'фехтование', 'хард', 6, '15 минут работы ног'),
('Разножка', 'фехтование', 'легко', 2, '20 разножек'),
('Разножка', 'фехтование', 'средне', 4, '40 разножек'),
('Разножка', 'фехтование', 'хард', 6, '60 разножек'),
('Бой с тенью', 'фехтование', 'легко', 2, '5 минут боя с тенью'),
('Бой с тенью', 'фехтование', 'средне', 4, '10 минут боя с тенью'),
('Бой с тенью', 'фехтование', 'хард', 6, '15 минут боя с тенью');

-- Заполнение фраз маскота
INSERT INTO mascot_messages (category, message) VALUES
-- Мотивация
('мотивация', 'Твой клинок острее, когда тело в форме. Не забывай об этом.'),
('мотивация', 'Неплохо. Продолжай в том же духе, и, возможно, ты станешь достойным противником.'),
('мотивация', 'Хорошая дисциплина. Но расслабишься — противник не простит.'),
-- Порицание
('порицание', 'Твой стрик угас. Как и твои шансы на победу.'),
('порицание', 'Два дня без тренировки? Твой противник благодарен за отдых.'),
('порицание', 'Лень — худший враг фехтовальщика. И ты ему проиграл.'),
-- Похвала
('похвала', 'Впечатляющий стрик. Ты начинаешь мыслить как истинный воин.'),
('похвала', 'Первое место? Не зазнавайся. Они уже точат клинки.'),
('похвала', '30 дней подряд. Ты удивил меня. Редкое достижение.'),
-- Ирония
('ирония', 'Отжимания хороши. Но ты знаешь, что бои выигрываются техникой, а не мышцами?'),
('ирония', 'Рейтинг домашних тренировок высок, бои проигрываешь. Интересная стратегия.'),
('ирония', 'Выиграл бой? Может, противник просто устал от твоих отговорок.');
