import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LuStar, LuRocket, LuHome, LuArrowUpCircle, LuSettings } from 'react-icons/lu';
import { GiBrain } from "react-icons/gi";
import { MdLock } from "react-icons/md";
import Modal from './Modal';
import DifficultyModal from './DifficultyModal';

const GameContext = createContext(null);

export const useGameContext = () => useContext(GameContext);

const Layout = () => {
  const [stardust, setStardust] = useState(() => {
    const saved = localStorage.getItem('stardust');
    return saved ? parseFloat(saved) : 0;
  });
  const [sps, setSps] = useState(() => {
    const saved = localStorage.getItem('sps');
    return saved ? parseFloat(saved) : 0;
  });
  const [upgradeCounts, setUpgradeCounts] = useState(() => {
    const saved = localStorage.getItem('upgradeCounts');
    return saved ? JSON.parse(saved) : { 'Amino Acids': 0, 'Nucleotides': 0, 'Lipids': 0 };
  });
  const [clickPower, setClickPower] = useState(() => {
    const saved = localStorage.getItem('clickPower');
    return saved ? parseInt(saved) : 1;
  });
  const [clickUpgradeCounts, setClickUpgradeCounts] = useState(() => {
    const saved = localStorage.getItem('clickUpgradeCounts');
    return saved ? JSON.parse(saved) : { 'Better Collector': 0, 'Stardust Magnet': 0, 'Quantum Harvester': 0 };
  });
  const [difficultyMultiplier, setDifficultyMultiplier] = useState(() => {
    const saved = localStorage.getItem('difficultyMultiplier');
    return saved ? parseFloat(saved) : 1; // Default to Normal
  });
  const [difficultySelected, setDifficultySelected] = useState(() => {
    const saved = localStorage.getItem('difficultySelected');
    return saved === 'true';
  });
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineStardust, setOfflineStardust] = useState(0);
  const [showHumanUpgradeModal, setShowHumanUpgradeModal] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [totalClicks, setTotalClicks] = useState(() => {
    const saved = localStorage.getItem('totalClicks');
    return saved ? parseInt(saved) : 0;
  });
  const [achievements, setAchievements] = useState(() => {
    const saved = localStorage.getItem('achievements');
    return saved ? JSON.parse(saved) : {};
  });

  const navigate = useNavigate();
  const location = useLocation();
  const isKnowledgeUnlocked = upgradeCounts['Human'] && upgradeCounts['Human'] > 0;

  const navButtons = [
    { path: '/', icon: LuHome, label: 'Home' },
    { path: '/upgrades', icon: LuArrowUpCircle, label: 'Upgrades' },
    { 
      path: '/knowledge', 
      icon: isKnowledgeUnlocked ? GiBrain : MdLock, 
      label: 'Knowledge',
      locked: !isKnowledgeUnlocked
    },
  ];

  const lastUpdateRef = useRef(Date.now());

  // Check if difficulty needs to be set
  useEffect(() => {
    if (!difficultySelected && sps === 0) {
      setShowDifficultyModal(true);
    }
  }, [difficultySelected, sps]);

  // Idling logic
  const calculateOfflineProgress = () => {
    const now = Date.now();
    const lastUpdate = parseInt(localStorage.getItem('lastUpdate') || '0', 10);
    const storedSps = parseFloat(localStorage.getItem('sps') || '0');
    const elapsedSeconds = (now - lastUpdate) / 1000;

    if (elapsedSeconds > 5) {  // Threshold for showing modal
      const earnedStardust = elapsedSeconds * storedSps * difficultyMultiplier;
      setStardust(prevStardust => {
        const newStardust = prevStardust + earnedStardust;
        return newStardust;
      });
      setOfflineStardust(earnedStardust);
      setShowOfflineModal(true);
    } else {
      console.log('Not enough time has passed for offline progress');
    }

    localStorage.setItem('lastUpdate', now.toString());
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        calculateOfflineProgress();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    calculateOfflineProgress();

    const timer = setInterval(() => {
      if (!document.hidden) {
        setStardust(prevStardust => {
          // Apply difficulty multiplier to SPS gain
          const newStardust = prevStardust + (sps / 10) * difficultyMultiplier;
          localStorage.setItem('stardust', newStardust.toString());
          localStorage.setItem('lastUpdate', Date.now().toString());
          return newStardust;
        });
      }
    }, 100);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sps, difficultyMultiplier]);

  useEffect(() => {
    localStorage.setItem('stardust', stardust.toString());
    localStorage.setItem('sps', sps.toString());
    localStorage.setItem('upgradeCounts', JSON.stringify(upgradeCounts));
    localStorage.setItem('clickPower', clickPower.toString());
    localStorage.setItem('clickUpgradeCounts', JSON.stringify(clickUpgradeCounts));
    localStorage.setItem('difficultyMultiplier', difficultyMultiplier.toString());
    localStorage.setItem('difficultySelected', difficultySelected.toString());
    localStorage.setItem('totalClicks', totalClicks.toString());
    localStorage.setItem('achievements', JSON.stringify(achievements));
    // localStorage.clear();
  }, [stardust, sps, upgradeCounts, clickPower, clickUpgradeCounts, difficultyMultiplier, difficultySelected, totalClicks, achievements]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const buyUpgrade = (upgrade) => {
    const count = upgradeCounts[upgrade.name] || 0;
    const cost = Math.floor(upgrade.baseCost * Math.pow(1.15, count));
    if (stardust >= cost) {
      setStardust(prevStardust => prevStardust - cost);
      // Apply difficulty multiplier to SPS gain from upgrades
      setSps(prevSps => prevSps + upgrade.sps);
      setUpgradeCounts(prev => ({ ...prev, [upgrade.name]: (prev[upgrade.name] || 0) + 1 }));
      
      // Check for planet evolution achievement
      const totalUpgrades = Object.values(upgradeCounts).reduce((sum, count) => sum + count, 0) + 1;
      if (totalUpgrades === 15) {
        setAchievements(prev => ({ ...prev, planetEvolution: true }));
      }
    }

    if (upgrade.name === 'Human' && count === 0) {
      setShowHumanUpgradeModal(true);
    }
  };

  const handleNavigation = (path, locked) => {
    if (!locked) {
      navigate(path);
    } 
  };

  const openDifficultyModal = () => {
    setShowDifficultyModal(true);
  };

  // Function to increment total clicks (for achievements)
  const incrementTotalClicks = () => {
    setTotalClicks(prev => prev + 1);
    
    // Check for click achievements
    if (totalClicks + 1 === 100) {
      setAchievements(prev => ({ ...prev, clicks100: true }));
    } else if (totalClicks + 1 === 1000) {
      setAchievements(prev => ({ ...prev, clicks1000: true }));
    }
  };
  
  return (
    <GameContext.Provider value={{ 
      stardust,
      setStardust, 
      sps,
      setSps, 
      upgradeCounts,
      setUpgradeCounts,
      clickPower,
      setClickPower,
      clickUpgradeCounts,
      setClickUpgradeCounts,
      difficultyMultiplier,
      setDifficultyMultiplier,
      difficultySelected,
      setDifficultySelected,
      totalClicks,
      incrementTotalClicks,
      achievements,
      buyUpgrade,
    }}>
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <header className="bg-slate-950 p-6 flex justify-between items-center sticky top-0 z-40 shadow-md">
          <div className="flex items-center">
            <LuStar className="inline-block mr-2 text-yellow-400" />
            <span className="font-mp text-xl font-bold">{Math.floor(stardust)} Stardust</span>
          </div>
          <div className="flex items-center">
            <LuRocket className="inline-block mr-2 text-blue-400" />
            <span className='font-mp text-xl'>{(sps * difficultyMultiplier).toFixed(1)} SPS</span>
            {difficultyMultiplier !== 1 && (
              <span className={`text-xs ml-2 ${difficultyMultiplier > 1 ? 'text-green-400' : 'text-red-400'}`}>
                (x{difficultyMultiplier})
              </span>
            )}
          </div>
          <button 
            onClick={openDifficultyModal}
            className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors"
            title="Settings"
          >
            <LuSettings size={16} />
          </button>
        </header>
        <main className="flex-grow overflow-auto pb-16">
          <Outlet />
        </main>

        <footer className="fixed bottom-0 left-0 right-0 bg-slate-950 p-4 shadow-inner z-50">
          <div className="flex justify-center space-x-4">
            {navButtons.map((button) => (
              <div key={button.path} className="relative group">
                <button
                  onClick={() => handleNavigation(button.path, button.locked)}
                  className={`p-2 rounded-full 
                    ${location.pathname === button.path ? 'bg-blue-600' : 'bg-gray-700'} 
                    ${button.locked ? 'cursor-not-allowed' : 'hover:bg-blue-500'} 
                    transition-colors`}
                  aria-label={button.label}
                >
                  <button.icon size={24} />
                </button>
                <div className="absolute font-mp bg-opacity-60 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {button.locked ? `Locked: ${button.label}` : button.label}
                </div>
              </div>
            ))}
          </div>
        </footer>

        <Modal 
          isOpen={showOfflineModal}
          onClose={() => setShowOfflineModal(false)}
          title="Welcome Back!"
          content="While you were away, you collected:"
          icon="star"
          value={offlineStardust.toFixed(2)}
          subtext="Stardust"
          actionText="Continue"
        />

        <Modal 
          isOpen={showHumanUpgradeModal}
          onClose={() => setShowHumanUpgradeModal(false)}
          title="Congratulations!"
          content="You have unlocked human knowledge!"
          icon="brain"
          subtext="The Knowledge tab is now available"
          actionText="Explore Knowledge"
        />
        
        <DifficultyModal
          isOpen={showDifficultyModal}
          onClose={() => setShowDifficultyModal(false)}
        />
      </div>
    </GameContext.Provider>
  );
};

export default Layout;