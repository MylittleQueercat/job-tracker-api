// Status list used for filters and dropdowns
export const STATUSES = [
  'all', 'applied', 'phone_screen', 'technical_test',
  'interview', 'final_interview', 'offer', 'withdrew', 'rejected', 'no_response'
]

export const STATUS_LABELS = {
  applied: 'Applied',
  phone_screen: 'Screening',
  technical_test: 'Technical Test',
  interview: 'Interview',
  final_interview: 'Final Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  no_response: 'No Response',
  withdrew: 'Withdrew',
}

// Tailwind classes for status badge colors
export const STATUS_COLORS = {
  applied: 'bg-blue-500/20 text-blue-400',
  phone_screen: 'bg-yellow-500/20 text-yellow-400',
  technical_test: 'bg-purple-500/20 text-purple-400',
  interview: 'bg-orange-500/20 text-orange-400',
  final_interview: 'bg-pink-500/20 text-pink-400',
  offer: 'bg-green-500/20 text-green-400',
  withdrew: 'bg-orange-500/20 text-orange-400',
  rejected: 'bg-red-500/20 text-red-400',
  no_response: 'bg-gray-500/20 text-gray-400',
}

// Hex colors for charts and dynamic styling
export const STATUS_CHART_COLORS = {
  applied: '#3b82f6',
  phone_screen: '#eab308',
  technical_test: '#a855f7',
  interview: '#f97316',
  final_interview: '#ec4899',
  offer: '#22c55e',
  withdrew: '#f97316',
  rejected: '#ef4444',
  no_response: '#6b7280',
}

// Random motivational quotes shown on the main page
export const MOTIVATIONS = [
  "Every rejection is one step closer to your offer.",
  "Your dream job is looking for you too.",
  "Keep going. The right company will see your value.",
  "One application at a time. You've got this.",
  "Great things take time. Stay consistent.",
  "Your next interview could change everything.",
  "Rejection is redirection. Keep pushing.",
  "The best is yet to come. Apply anyway.",
]

export const ACHIEVEMENTS = [
  // 投递
  { id: 'coming_out', name: 'Coming out (of unemployment)', desc: 'Send your very first application.', icon: '✨', check: ({ jobs }) => jobs.length >= 1 },
  { id: 'spray_and_pray', name: 'Spray and pray', desc: 'Submit 20 applications total.', icon: '🌊', check: ({ jobs }) => jobs.length >= 20 },
  { id: 'main_character', name: 'Main character energy', desc: '50 applications. You\'re on a world tour.', icon: '💼', check: ({ jobs }) => jobs.length >= 50 },
  { id: 'viva_la_vida', name: 'Viva la vida (loca, applying)', desc: '100 applications. The market fears you.', icon: '🎸', check: ({ jobs }) => jobs.length >= 100 },
  { id: 'open_aggressively', name: 'Open to work (aggressively)', desc: 'Add 5 jobs in a single day.', icon: '⚡', check: ({ jobs }) => { const counts = {}; jobs.forEach(j => { const d = j.created_at?.slice(0,10); counts[d] = (counts[d]||0)+1 }); return Object.values(counts).some(v => v >= 5) } },
  { id: 'citizen_world', name: 'Citizen of the world', desc: 'Apply in 3 different cities.', icon: '🌍', check: ({ jobs }) => new Set(jobs.map(j => j.location).filter(Boolean)).size >= 3 },

  // 面试
  { id: 'they_called', name: 'They called. You answered.', desc: 'First phone screen.', icon: '📞', check: ({ jobs }) => jobs.some(j => ['phone_screen','technical_test','interview','final_interview','offer'].includes(j.status)) },
  { id: 'big_brain', name: 'Big brain time', desc: 'Your leetcode grind was not in vain.', icon: '🧠', check: ({ jobs }) => jobs.some(j => ['technical_test','interview','final_interview','offer'].includes(j.status)) },
  { id: 'veteran', name: 'Veteran of the culture wars', desc: 'Log 10 interview records total.', icon: '🥋', check: ({ totalInterviews }) => totalInterviews >= 10 },
  { id: 'final_countdown', name: 'This is the final countdown', desc: 'Reach final interview stage.', icon: '🏟️', check: ({ jobs }) => jobs.some(j => j.status === 'final_interview') },

  // 拒信
  { id: 'not_you', name: 'It\'s not you, it\'s them', desc: 'First rejection. Welcome to the club.', icon: '💔', check: ({ jobs }) => jobs.some(j => j.status === 'rejected') },
  { id: 'let_it_be', name: 'Let it be (rejected)', desc: '5 rejections. The Beatles understand.', icon: '🎵', check: ({ jobs }) => jobs.filter(j => j.status === 'rejected').length >= 5 },
  { id: 'shake_it_off', name: 'Shake it off', desc: 'Apply within 24h of a rejection.', icon: '🐍', check: ({ jobs }) => { const rejected = jobs.filter(j => j.status === 'rejected').map(j => new Date(j.updated_at)); return jobs.some(j => rejected.some(r => { const diff = new Date(j.created_at) - r; return diff > 0 && diff < 86400000 })) } },
  { id: 'ghost_protocol', name: 'Ghost protocol', desc: '5 companies ghosted you. Still here.', icon: '👻', check: ({ jobs }) => jobs.filter(j => j.status === 'no_response').length >= 5 },
  { id: 'situationship', name: 'Situationship', desc: 'A job stuck on phone_screen for 30+ days.', icon: '😬', check: ({ jobs }) => jobs.some(j => j.status === 'phone_screen' && (Date.now() - new Date(j.updated_at)) > 30*86400000) },

  // 终极
  { id: 'room_of_own', name: 'A room of one\'s own (with a salary)', desc: 'First offer. Virginia Woolf approves.', icon: '🏠', check: ({ jobs }) => jobs.some(j => j.status === 'offer') },
  { id: 'power_move', name: 'Power move', desc: 'Two offers at the same time.', icon: '😎', check: ({ jobs }) => jobs.filter(j => j.status === 'offer').length >= 2 },
  { id: 'good_luck_babe', name: 'Good luck, babe (to that company)', desc: 'Reject an offer. Chappell Roan approves.', icon: '🫧', check: ({ deletedOffers }) => deletedOffers >= 1 },
  { id: 'bohemian_rhapsody', name: 'Bohemian Rhapsody of a job search', desc: 'Experienced apply, reject, interview and offer. The full circle.', icon: '🎭', check: ({ jobs }) => { const statuses = new Set(jobs.map(j => j.status)); return ['applied','rejected','interview','offer'].every(s => statuses.has(s)) } },

  // 留存
  { id: 'showing_up', name: 'Showing up (even on Mondays)', desc: '7 days streak.', icon: '📅', check: ({ streakDays }) => streakDays >= 7 },
  { id: 'roman_empire', name: 'This is my Roman Empire', desc: '30 days streak. Certified workaholic.', icon: '🏛️', check: ({ streakDays }) => streakDays >= 30 },
  { id: 'still_standing', name: 'I\'m still standing (Elton John, also me)', desc: 'Using the app for 60 days.', icon: '🕺', check: ({ accountAgeDays }) => accountAgeDays >= 60 },
  { id: 'return_of_queen', name: 'The return of the queen', desc: 'Come back after 14 days away.', icon: '👑', check: ({ gapDays }) => gapDays >= 14 },
  { id: 'ai_pilled', name: 'Chronically AI-pilled', desc: 'Use AI features 20 times total.', icon: '🤖', check: ({ aiUsageCount }) => aiUsageCount >= 20 },
  { id: 'lore_drop', name: 'The extended cut', desc: 'Write 200+ characters in a notes field.', icon: '📖', check: ({ jobs }) => jobs.some(j => (j.notes||'').length >= 200) },

  // 隐藏成就
  { id: 'midnight_oil', name: '404: work-life balance not found', desc: 'Add a job after midnight.', icon: '🦉', hidden: true, check: ({ jobs }) => jobs.some(j => { const h = new Date(j.created_at).getHours(); return h >= 0 && h < 5 }) },
  { id: 'buddhist', name: 'Buddhist job seeker', desc: 'Only 1 application in 30 days. Detachment is valid.', icon: '🧘', hidden: true, check: ({ jobs }) => { const month = jobs.filter(j => (Date.now()-new Date(j.created_at)) < 30*86400000); return month.length === 1 } },
  { id: 'overthinking', name: 'Overthinking as a service', desc: 'Edit the same job 10+ times.', icon: '✏️', hidden: true, check: ({ editCounts }) => Object.values(editCounts||{}).some(v => v >= 10) },
  { id: 'life_on_mars', name: 'Life on Mars (is easier than this job market)', desc: 'Still going after 30 days.', icon: '🚀', hidden: true, check: ({ accountAgeDays }) => accountAgeDays >= 30 },
  { id: 'under_pressure', name: 'Under pressure (of three deadlines)', desc: '3 deadlines within 5 days.', icon: '💥', hidden: true, check: ({ jobs }) => { const soon = jobs.filter(j => j.deadline && (new Date(j.deadline)-Date.now()) < 5*86400000 && (new Date(j.deadline)-Date.now()) > 0); return soon.length >= 3 } },
]