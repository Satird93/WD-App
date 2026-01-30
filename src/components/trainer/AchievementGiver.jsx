import { useState } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { USER_ROLES } from '../../utils/constants'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Loader from '../ui/Loader'

/**
 * Компонент для выдачи достижений студентам
 */
export default function AchievementGiver({ user, onSuccess }) {
  const [selectedUser, setSelectedUser] = useState('')
  const [type, setType] = useState('заслуга')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [points, setPoints] = useState(0)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Проверка прав доступа
  const isTrainerOrAdmin = user?.role === USER_ROLES.TRAINER || user?.role === USER_ROLES.ADMIN

  if (!isTrainerOrAdmin) {
    return (
      <Card className="text-center py-8">
        <div className="text-4xl mb-2">🔒</div>
        <p className="text-quick-silver">Доступ запрещён</p>
      </Card>
    )
  }

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setUsers([])
      return
    }

    try {
      setSearching(true)
      const { data, error: searchError } = await supabase
        .from('users')
        .select('id, full_name, username')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(10)

      if (searchError) throw searchError
      setUsers(data || [])
    } catch (err) {
      console.error('Error searching users:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!selectedUser) {
      setError('Выберите студента')
      return
    }

    if (!title.trim()) {
      setError('Введите название достижения')
      return
    }

    try {
      setLoading(true)

      // Создаём достижение
      const { error: insertError } = await supabase
        .from('achievements')
        .insert({
          user_id: selectedUser,
          type,
          title: title.trim(),
          description: description.trim() || null,
          points: parseInt(points) || 0,
          awarded_by: user.id,
        })

      if (insertError) throw insertError

      // Если есть очки, обновляем total_points пользователя
      if (points > 0) {
        const { error: updateError } = await supabase.rpc('increment_user_points', {
          p_user_id: selectedUser,
          p_points: parseInt(points),
        })

        if (updateError) {
          console.warn('Could not update user points:', updateError)
          // Не прерываем процесс, если RPC не существует
        }
      }

      setSuccess(true)
      setSelectedUser('')
      setTitle('')
      setDescription('')
      setPoints(0)
      setType('заслуга')
      
      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
      }, 2000)
    } catch (err) {
      setError(`Ошибка выдачи достижения: ${err.message}`)
      console.error('Error giving achievement:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-strict-black mb-4">
        🏅 Выдать достижение
      </h3>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">✓ Достижение успешно выдано!</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Поиск студента */}
        <div>
          <label className="block text-sm font-medium text-strict-black mb-2">
            Студент
          </label>
          <input
            type="text"
            placeholder="Начните вводить имя..."
            onChange={(e) => searchUsers(e.target.value)}
            className="w-full px-4 py-2 border border-alice-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-brandeis-blue"
          />
          {searching && <Loader size="small" className="mt-2" />}
          {users.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto border border-alice-blue rounded-lg">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(u.id)
                    setUsers([])
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-alice-blue transition-colors ${
                    selectedUser === u.id ? 'bg-brandeis-blue/10' : ''
                  }`}
                >
                  {u.full_name} {u.username && `(@${u.username})`}
                </button>
              ))}
            </div>
          )}
          {selectedUser && (
            <p className="mt-2 text-sm text-green-600">
              ✓ Студент выбран
            </p>
          )}
        </div>

        {/* Тип достижения */}
        <div>
          <label className="block text-sm font-medium text-strict-black mb-2">
            Тип достижения
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('заслуга')}
              className={`flex-1 py-2 px-4 rounded transition-colors ${
                type === 'заслуга'
                  ? 'bg-brandeis-blue text-white'
                  : 'bg-alice-blue text-quick-silver hover:bg-brandeis-blue/10'
              }`}
            >
              ⭐ Заслуга
            </button>
            <button
              type="button"
              onClick={() => setType('снаряжение')}
              className={`flex-1 py-2 px-4 rounded transition-colors ${
                type === 'снаряжение'
                  ? 'bg-orange-peel text-white'
                  : 'bg-alice-blue text-quick-silver hover:bg-orange-peel/10'
              }`}
            >
              ⚔️ Снаряжение
            </button>
          </div>
        </div>

        {/* Название */}
        <div>
          <label className="block text-sm font-medium text-strict-black mb-2">
            Название
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Первая маска"
            className="w-full px-4 py-2 border border-alice-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-brandeis-blue"
            required
          />
        </div>

        {/* Описание */}
        <div>
          <label className="block text-sm font-medium text-strict-black mb-2">
            Описание (опционально)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Дополнительная информация..."
            rows={3}
            className="w-full px-4 py-2 border border-alice-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-brandeis-blue resize-none"
          />
        </div>

        {/* Очки */}
        <div>
          <label className="block text-sm font-medium text-strict-black mb-2">
            Бонусные очки
          </label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            min="0"
            placeholder="0"
            className="w-full px-4 py-2 border border-alice-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-brandeis-blue"
          />
          <p className="text-xs text-quick-silver mt-1">
            Оставьте 0, если не нужно начислять очки
          </p>
        </div>

        {/* Кнопка отправки */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading || !selectedUser || !title.trim()}
        >
          {loading ? 'Сохранение...' : 'Выдать достижение'}
        </Button>
      </form>
    </Card>
  )
}
