-- ======================
-- МИГРАЦИЯ: Роли и специализации
-- ======================

-- Добавляем новые колонки в таблицу users
ALTER TABLE users
ADD COLUMN role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'trainer', 'student')),
ADD COLUMN fencing_specialization TEXT CHECK (fencing_specialization IN ('сабля', 'длинный меч', 'рапира'));

-- Создаем индекс для ролей
CREATE INDEX idx_users_role ON users(role);

-- Добавляем поле created_by для challenges (кто создал челлендж)
ALTER TABLE challenges
ADD COLUMN created_by UUID REFERENCES users(id),
ADD COLUMN fencing_specialization TEXT CHECK (fencing_specialization IN ('сабля', 'длинный меч', 'рапира', 'общее'));

-- Обновляем существующие фехтовальные челленджи как "общее"
UPDATE challenges
SET fencing_specialization = 'общее'
WHERE category = 'фехтование';

-- ======================
-- ПОЛИТИКИ ДОСТУПА ДЛЯ РОЛЕЙ
-- ======================

-- Удаляем старые политики для challenges
DROP POLICY IF EXISTS "Everyone can view challenges" ON challenges;
DROP POLICY IF EXISTS "Users can insert own challenges" ON user_challenges;

-- Новые политики для challenges
-- Все могут читать активные челленджи
CREATE POLICY "Everyone can view active challenges" ON challenges
  FOR SELECT USING (is_active = true);

-- Только тренеры и админы могут создавать челленджи
CREATE POLICY "Trainers and admins can create challenges" ON challenges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = created_by
      AND role IN ('trainer', 'admin')
    )
  );

-- Только тренеры и админы могут обновлять челленджи
CREATE POLICY "Trainers and admins can update challenges" ON challenges
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.telegram_id = current_setting('app.current_user_telegram_id', true)::BIGINT
      AND u.role IN ('trainer', 'admin')
    )
  );

-- Только админы могут удалять челленджи (деактивировать)
CREATE POLICY "Admins can deactivate challenges" ON challenges
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.telegram_id = current_setting('app.current_user_telegram_id', true)::BIGINT
      AND u.role = 'admin'
    )
  );

-- Пользователи могут добавлять свои выполненные челленджи
CREATE POLICY "Users can complete challenges" ON user_challenges
  FOR INSERT WITH CHECK (true);

-- ======================
-- ФУНКЦИИ ДЛЯ РАБОТЫ С РОЛЯМИ
-- ======================

-- Функция для назначения роли тренера (только админы)
CREATE OR REPLACE FUNCTION assign_trainer_role(
  p_user_id UUID,
  p_admin_telegram_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Проверяем, что запрос делает админ
  SELECT role = 'admin' INTO v_is_admin
  FROM users
  WHERE telegram_id = p_admin_telegram_id;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can assign trainer role';
  END IF;

  -- Назначаем роль тренера
  UPDATE users
  SET role = 'trainer'
  WHERE id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для проверки прав доступа
CREATE OR REPLACE FUNCTION check_user_permission(
  p_telegram_id BIGINT,
  p_required_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  SELECT role INTO v_user_role
  FROM users
  WHERE telegram_id = p_telegram_id;

  CASE p_required_role
    WHEN 'admin' THEN
      RETURN v_user_role = 'admin';
    WHEN 'trainer' THEN
      RETURN v_user_role IN ('admin', 'trainer');
    WHEN 'student' THEN
      RETURN v_user_role IN ('admin', 'trainer', 'student');
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================
-- ОБНОВЛЕНИЕ КОНСТАНТ
-- ======================

-- Комментарии с описанием значений для использования в приложении
COMMENT ON COLUMN users.role IS 'Роли: admin - администратор (назначается вручную), trainer - тренер (назначается админом), student - ученик (по умолчанию)';
COMMENT ON COLUMN users.fencing_specialization IS 'Специализация фехтования: сабля, длинный меч, рапира';
COMMENT ON COLUMN challenges.fencing_specialization IS 'Специализация для фехтовальных челленджей: сабля, длинный меч, рапира, общее (для всех)';
