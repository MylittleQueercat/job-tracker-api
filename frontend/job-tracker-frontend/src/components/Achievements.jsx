import { ACHIEVEMENTS } from '../constants'

export default function Achievements({ unlockedAchievements }) {
  const total = ACHIEVEMENTS.length
  const unlocked = Object.keys(unlockedAchievements).length
  const percent = Math.round(unlocked / total * 100)

  const visible = ACHIEVEMENTS.filter(a => !a.hidden || unlockedAchievements[a.id])
  const hidden = ACHIEVEMENTS.filter(a => a.hidden && !unlockedAchievements[a.id])

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-1">
          Achievements
        </h2>
        <p className="text-gray-500 text-sm mb-4">{unlocked} of {total} unlocked</p>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #7209b7, #f72585)' }}
          />
        </div>
        <p className="text-right text-xs text-gray-600 mt-1">{percent}%</p>
      </div>

      {/* Unlocked */}
      <div className="space-y-2 mb-8">
        {visible.map(ach => {
          const isUnlocked = !!unlockedAchievements[ach.id]
          const unlockedDate = unlockedAchievements[ach.id]
            ? new Date(unlockedAchievements[ach.id]).toLocaleDateString()
            : null

          return (
            <div
              key={ach.id}
              className="flex items-center gap-4 p-4 rounded-xl border transition-all"
              style={{
                background: isUnlocked ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                borderColor: isUnlocked ? 'rgba(247,37,133,0.2)' : 'rgba(255,255,255,0.04)',
              }}
            >
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  background: isUnlocked ? 'rgba(247,37,133,0.1)' : 'rgba(255,255,255,0.03)',
                  filter: isUnlocked ? 'none' : 'grayscale(1)',
                  opacity: isUnlocked ? 1 : 0.3
                }}
              >
                {ach.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                  {ach.name}
                </p>
                <p className={`text-xs mt-0.5 ${isUnlocked ? 'text-gray-400' : 'text-gray-700'}`}>
                  {ach.desc}
                </p>
              </div>

              {/* Date or locked */}
              <div className="flex-shrink-0 text-right">
                {isUnlocked ? (
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Unlocked</p>
                    <p className="text-xs text-gray-500">{unlockedDate}</p>
                  </div>
                ) : (
                  <div className="text-gray-700 text-lg">🔒</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Hidden achievements */}
      {hidden.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-600 mb-3">
            {hidden.length} hidden achievement{hidden.length > 1 ? 's' : ''} remaining
          </p>
          <div className="space-y-2">
            {hidden.map(ach => (
              <div
                key={ach.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.03] bg-white/[0.01]"
              >
                <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 bg-white/[0.02] opacity-20">
                  ?
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">Hidden achievement</p>
                  <p className="text-xs text-gray-800 mt-0.5">Keep using the app to discover this.</p>
                </div>
                <div className="text-gray-800 text-lg">🔒</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}