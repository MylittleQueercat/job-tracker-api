export default function Resources() {
  const platforms = [
    { name: 'Welcome to the Jungle', url: 'https://www.welcometothejungle.com', tag: 'Most Popular', tagColor: '#f72585', desc: 'Best for startups & tech. Rich company profiles, great UI. The most popular platform in France right now.' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs', tag: 'Essential', tagColor: '#4cc9f0', desc: 'Non-negotiable. Most active recruiters live here. Great for networking and being headhunted.' },
    { name: 'APEC', url: 'https://www.apec.fr', tag: 'Cadre Level', tagColor: '#7209b7', desc: 'For cadre-level positions. Mostly CDI. Also offers free career counseling — seriously underrated.' },
    { name: 'Jobteaser', url: 'https://www.jobteaser.com', tag: 'Students & Grads', tagColor: '#4ade80', desc: "Built specifically for students and recent graduates. Perfect if you're coming from 42 or a university." },
    { name: 'Lesjeudis', url: 'https://www.lesjeudis.com', tag: 'Tech & IT', tagColor: '#fb923c', desc: 'Focused exclusively on tech and IT roles. Good signal-to-noise ratio for developers.' },
    { name: 'Indeed France', url: 'https://fr.indeed.com', tag: 'High Volume', tagColor: '#6b7280', desc: 'Huge volume, mixed quality. Good for casting a wide net — filter aggressively.' },
    { name: 'Cadremploi', url: 'https://www.cadremploi.fr', tag: 'Mid-Senior', tagColor: '#a78bfa', desc: 'Focused on mid to senior-level roles. Less noise than Indeed for experienced profiles.' },
    { name: 'Glassdoor', url: 'https://www.glassdoor.fr', tag: 'Research', tagColor: '#34d399', desc: 'Company reviews, salaries, and interview experiences shared anonymously. Research before you apply.' },
  ]

  const internshipPlatforms = [
    { name: 'Figaro Etudiant', url: 'https://etudiant.lefigaro.fr/jobs', tag: 'Internship', tagColor: '#f59e0b', desc: 'Internship-focused listings from major French companies.' },
    { name: 'Stageoo', url: 'https://www.stageoo.com', tag: 'Internship', tagColor: '#f59e0b', desc: 'Dedicated internship search engine. Clean and simple.' },
    { name: 'Monster France', url: 'https://www.monster.fr', tag: 'Entry Level', tagColor: '#94a3b8', desc: 'Classic job board, still active for internships and entry-level positions.' },
  ]

  const freeSupport = [
    { name: 'ActiveAction', url: 'https://www.activeaction.fr', tag: 'Free', tagColor: '#4ade80', desc: 'Free workshops on CV writing, interview prep, and networking. One of the best-known associations in Paris.' },
    { name: 'Visemploi', url: 'https://visemploi.com', tag: 'Free', tagColor: '#4ade80', desc: 'Free accompaniment and workshops: CV, cover letters, interview prep. Multiple locations in Paris and Île-de-France.' },
    { name: 'Cité des Métiers', url: 'https://www.cite-sciences.fr/fr/cite-des-metiers', tag: 'Free', tagColor: '#4ade80', desc: 'Open to everyone, no appointment needed. Free career counseling, job market info, and professional guidance at La Villette.' },
    { name: 'NQT', url: 'https://www.nqt.fr', tag: 'Mentoring', tagColor: '#818cf8', desc: 'Free mentoring for young graduates from diverse backgrounds. Matches you with a professional mentor in your field.' },
    { name: 'Duo for a Job', url: 'https://www.duoforajob.fr', tag: 'Mentoring', tagColor: '#818cf8', desc: 'Intergenerational mentoring program pairing young job seekers with 50+ volunteer mentors. Great for international profiles.' },
  ]

  const officialResources = [
    { name: 'Pôle Emploi', url: 'https://www.pole-emploi.fr', tag: 'Official', tagColor: '#60a5fa', desc: 'Official French employment agency. Register for job support, training programs, and unemployment benefits.' },
    { name: 'APEC Counseling', url: 'https://www.apec.fr/candidat/conseil-accompagnement.html', tag: 'Free', tagColor: '#4ade80', desc: "Free career counseling for cadres. They'll review your CV and coach you — no cost." },
  ]

  const Card = ({ name, url, tag, tagColor, desc }) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all group h-full"
    >
      <div className="flex items-start justify-between mb-3">
        {tag && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: tagColor + '20', color: tagColor }}
          >
            {tag}
          </span>
        )}
        <span className="text-gray-700 group-hover:text-gray-400 transition-colors text-xs ml-auto">↗</span>
      </div>
      <p className="text-lg font-bold text-white group-hover:text-[#4cc9f0] transition-colors mb-2 leading-tight">
        {name}
      </p>
      <p className="text-xs text-gray-500 leading-relaxed flex-1">{desc}</p>
    </a>
  )

  const Section = ({ title, items }) => (
    <div className="mb-10">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(p => <Card key={p.name} {...p} />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">

      <div className="mb-10">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Resources</h2>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs px-3 py-1 rounded-full border border-[#f72585]/30 text-[#f72585] bg-[#f72585]/10">
            🇫🇷 France
          </span>
          <span className="text-xs text-gray-600 italic">More countries coming soon</span>
        </div>
        <p className="text-sm text-gray-500">
          A curated list of platforms and resources for the French job market. No fluff — just what actually works.
        </p>
      </div>

      <Section title="Job Platforms" items={platforms} />
      <Section title="Internship Specific" items={internshipPlatforms} />
      <Section title="Free Support & Workshops" items={freeSupport} />
      <Section title="Official Resources" items={officialResources} />

      <div className="rounded-xl p-4 border border-white/[0.03] bg-white/[0.01]">
        <p className="text-xs text-gray-600 text-center">
          Missing something? More resources — salary data, interview tips, visa guides — coming soon.
        </p>
      </div>

    </div>
  )
}