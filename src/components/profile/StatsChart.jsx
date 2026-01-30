import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import Card from '../ui/Card'
import Loader from '../ui/Loader'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/**
 * График статистики очков
 */
export default function StatsChart({ userId }) {
  const [period, setPeriod] = useState('7') // '7', '30', 'all'
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userId) {
      fetchChartData()
    }
  }, [userId, period])

  async function fetchChartData() {
    try {
      setLoading(true)
      setError(null)

      // Определяем дату начала
      const now = new Date()
      let startDate = new Date()
      
      if (period === '7') {
        startDate.setDate(now.getDate() - 7)
      } else if (period === '30') {
        startDate.setDate(now.getDate() - 30)
      } else {
        // 'all' - берём всё
        startDate = new Date('2000-01-01')
      }

      // Получаем челленджи пользователя
      const { data, error: fetchError } = await supabase
        .from('user_challenges')
        .select('completed_at, points_earned')
        .eq('user_id', userId)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: true })

      if (fetchError) throw fetchError

      // Группируем по датам
      const groupedByDate = {}
      data.forEach((challenge) => {
        const date = new Date(challenge.completed_at).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
        })
        if (!groupedByDate[date]) {
          groupedByDate[date] = 0
        }
        groupedByDate[date] += challenge.points_earned
      })

      // Формируем данные для графика
      const chartArray = Object.entries(groupedByDate).map(([date, points]) => ({
        date,
        points,
      }))

      setChartData(chartArray)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching chart data:', err)
    } finally {
      setLoading(false)
    }
  }

  const periods = [
    { id: '7', label: '7 дней' },
    { id: '30', label: '30 дней' },
    { id: 'all', label: 'Всё время' },
  ]

  if (loading) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-strict-black mb-4">
          📈 Прогресс
        </h3>
        <div className="flex justify-center py-12">
          <Loader size="medium" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-strict-black mb-4">
          📈 Прогресс
        </h3>
        <div className="text-center py-8">
          <p className="text-quick-silver text-sm">Ошибка загрузки данных</p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-strict-black">
          📈 Прогресс
        </h3>
        
        {/* Переключатель периода */}
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`
                px-3 py-1 rounded text-sm transition-colors
                ${
                  period === p.id
                    ? 'bg-brandeis-blue text-white'
                    : 'bg-alice-blue text-quick-silver hover:bg-brandeis-blue/10'
                }
              `}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-quick-silver">Нет данных за выбранный период</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              stroke="#A3A3A3"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#A3A3A3"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#222222', fontWeight: 'bold' }}
            />
            <Line
              type="monotone"
              dataKey="points"
              stroke="#0066FF"
              strokeWidth={3}
              dot={{ fill: '#0066FF', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
