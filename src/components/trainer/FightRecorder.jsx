import { useState } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { USER_ROLES } from '../../utils/constants'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Loader from '../ui/Loader'

/**
 * Компонент для записи результатов боёв
 */
export default function FightRecorder({ user, onSuccess }) {
  const [winner, setWinner] = useState('')
  const [loser, setLoser] = useState('')
  const [fightType, setFightType] = useState('спарринг')
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

    if (!winner || !loser) {
      setError('Выберите победителя и проигравшего')
      return
    }

    if (winner === loser) {
      setError('Победитель и проигравший не могут быть одним человеком')
      return
    }

    try {
      setLoading(true)

      // Записываем бой
      const { error: insertError } = await supabase
        .from('fights')
        .insert({
          winner_id: winner,
          loser_id: loser,
          recorded_by: user.id,
          fight_type: fightType,
        })

      if (insertError) throw insertError

      setSuccess(true)
      setWinner('')
      setLoser('')
      setFightType('спарринг')
      
      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
      }, 2000)
    } catch (err) {
      setError(`Ошибка записи боя: ${err.message}`)
      console.error('Error recording fight:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-strict-black mb-4">
        ⚔️ Запись результата боя
      </h3>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">✓ Бой успешно записан!</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Тип боя */}
        <div>
          <label className="block text-sm font-medium text-strict-black mb-2">
            Тип боя
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFightType('спарринг')}
              className={`flex-1 py-2 px-4 rounded transition-colors ${
                fightType === 'спарринг'
                  ? 'bg-brandeis-blue text-white'
                  : 'bg-alice-blue text-quick-silver hover:bg-brandeis-blue/10'
              }`}
            >
              Спарринг
            </button>
            <button
              type="button"
              onClick={() => setFightType('турнир')}
              className={`flex-1 py-2 px-4 rounded transition-colors ${
                fightType === 'турнир'
                  ? 'bg-brandeis-blue text-white'
                  : 'bg-alice-blue text-quick-silver hover:bg-brandeis-blue/10'
              }`}
            >
              Турнир
            </button>
          </div>
        </div>

        {/* Победитель */}
        <div>
          <label className="block text-sm font-medium text-strict-black mb-2">
            Победитель
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
                    setWinner(u.id)
                    setUsers([])
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-alice-blue transition-colors ${
                    winner === u.id ? 'bg-brandeis-blue/10' : ''
                  }`}
                >
                  {u.full_name} {u.username && `(@${u.username})`}
                </button>
              ))}
            </div>
          )}
          {winner && (
            <p className="mt-2 text-sm text-green-600">
              ✓ Выбран победитель
            </p>
          )}
        </div>

        {/* Проигравший */}
        <div>
          <label className="block text-sm font-medium text-strict-black mb-2">
            Проигравший
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
                    setLoser(u.id)
                    setUsers([])
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-alice-blue transition-colors ${
                    loser === u.id ? 'bg-brandeis-blue/10' : ''
                  }`}
                >
                  {u.full_name} {u.username && `(@${u.username})`}
                </button>
              ))}
            </div>
          )}
          {loser && (
            <p className="mt-2 text-sm text-green-600">
              ✓ Выбран проигравший
            </p>
          )}
        </div>

        {/* Кнопка отправки */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading || !winner || !loser}
        >
          {loading ? 'Сохранение...' : 'Записать бой'}
        </Button>
      </form>
    </Card>
  )
}
