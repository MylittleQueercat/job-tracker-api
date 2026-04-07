import React from 'react';

const CatAssistant = ({ isTyping, isCelebrating }) => {
  // 优先级：庆祝 > 打字 > 睡觉
  const status = isCelebrating ? 'CELEBRATE' : isTyping ? 'WATCHING' : 'SLEEPING';

  return (
    <div className="fixed bottom-8 right-10 z-[100] pointer-events-none">
      <svg width="100" height="80" viewBox="0 0 100 100" className={status === 'SLEEPING' ? 'cat-float opacity-40' : 'opacity-100 transition-all duration-500'}>
        {/* 1. 身体 (Body) */}
        <ellipse cx="50" cy="65" rx="30" ry="22" fill="#1a1a2e" stroke="#fff" strokeWidth="2" />
        
        {/* 2. 头部 (Head) */}
        <circle cx="50" cy="42" r="20" fill="#1a1a2e" stroke="#fff" strokeWidth="2" />
        
        {/* 3. 耳朵 (Ears) */}
        <polygon points="35,30 42,15 50,28" fill="#fff" />
        <polygon points="65,30 58,15 50,28" fill="#fff" />

        {/* 4. 眼睛表情 (Eyes) - 这里的逻辑是灵魂 */}
        {status === 'SLEEPING' && (
          <path d="M40,42 L48,42 M52,42 L60,42" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        )}
        
        {status === 'WATCHING' && (
          <>
            <circle cx="42" cy="42" r="5" fill="#4cc9f0">
               <animate attributeName="r" values="4.5;5.5;4.5" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="58" cy="42" r="5" fill="#4cc9f0">
               <animate attributeName="r" values="4.5;5.5;4.5" dur="2s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        {status === 'CELEBRATE' && (
          <>
            {/* 眯眼 >< */}
            <path d="M38,38 L45,43 L38,48" stroke="#4cc9f0" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M62,38 L55,43 L62,48" stroke="#4cc9f0" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* 万岁小手 */}
            <path d="M25,40 Q15,30 10,45" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M75,40 Q85,30 90,45" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* 5. 尾巴 (Tail) */}
        <path 
          d="M80,65 Q100,40 85,20" 
          stroke={status === 'CELEBRATE' ? "#4cc9f0" : "#fff"} 
          strokeWidth="3" 
          fill="none" 
          strokeLinecap="round"
          className="origin-bottom"
          style={{ 
            animation: status === 'CELEBRATE' ? 'cat-tail-celebrate 0.6s infinite' : 'cat-tail-wag 3s infinite' 
          }}
        />
      </svg>
    </div>
  );
};

export default CatAssistant;