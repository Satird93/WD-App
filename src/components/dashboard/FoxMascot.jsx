import { useMascot } from '../../hooks/useMascot'
import Card from '../ui/Card'

/**
 * Компонент маскота Лиса Ренара
 */
export default function FoxMascot({ user }) {
  const { message, loading } = useMascot(user)

  if (loading || !message) {
    return null
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-peel/20">
      <div className="flex items-start gap-4">
        {/* Лис Ренар */}
        <div className="flex-shrink-0 text-5xl">
          🦊
        </div>

        {/* Сообщение */}
        <div className="flex-1">
          <div className="relative">
            {/* Облачко речи */}
            <div className="bg-white rounded-lg p-4 shadow-sm relative">
              {/* Хвостик облачка */}
              <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white border-b-8 border-b-transparent"></div>
              
              <p className="text-strict-black font-medium">
                {message}
              </p>
            </div>
          </div>
          
          <p className="text-xs text-orange-peel font-semibold mt-2 ml-1">
            — Лис Ренар
          </p>
        </div>
      </div>
    </Card>
  )
}
