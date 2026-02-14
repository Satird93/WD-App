-- ==============================================
-- ИСПРАВЛЕНИЕ РАСЧЁТА СТРИКА
-- ==============================================
-- Проблема: старая функция требовала, чтобы челлендж был выполнен СЕГОДНЯ,
-- иначе стрик сбрасывался в 0. Это неверно - стрик должен сохраняться,
-- если последний челлендж был выполнен вчера.

-- Удаляем старую функцию и заменяем новой
CREATE OR REPLACE FUNCTION calculate_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_expected_date DATE;
  v_last_challenge_date DATE;
  v_check_date DATE;
BEGIN
  -- Получаем дату последнего выполненного челленджа
  SELECT DATE(MAX(completed_at)) INTO v_last_challenge_date
  FROM user_challenges
  WHERE user_id = p_user_id;
  
  -- Если нет челленджей - стрик 0
  IF v_last_challenge_date IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Стрик сохраняется, если последний челлендж был сегодня или вчера
  -- Иначе стрик прерван
  IF v_last_challenge_date < CURRENT_DATE - INTERVAL '1 day' THEN
    RETURN 0;
  END IF;
  
  -- Начинаем считать с даты последнего челленджа
  v_expected_date := v_last_challenge_date;
  
  -- Считаем последовательные дни
  FOR v_check_date IN
    SELECT DISTINCT DATE(completed_at) as challenge_date
    FROM user_challenges
    WHERE user_id = p_user_id
    ORDER BY challenge_date DESC
  LOOP
    IF v_check_date = v_expected_date THEN
      v_streak := v_streak + 1;
      v_expected_date := v_expected_date - INTERVAL '1 day';
    ELSIF v_check_date < v_expected_date THEN
      -- Пропущен день - стрик прерван
      EXIT;
    END IF;
    -- Если v_check_date > v_expected_date, это дубликат, пропускаем
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- Обновляем стрики для всех пользователей после изменения функции
UPDATE users
SET current_streak = calculate_streak(id);

-- Комментарий
COMMENT ON FUNCTION calculate_streak(UUID) IS 
'Рассчитывает текущий стрик пользователя. Стрик сохраняется если последний челлендж был сегодня или вчера. Считает последовательные дни выполнения челленджей.';
