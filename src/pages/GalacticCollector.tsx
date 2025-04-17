import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdOutlineArrowCircleRight, MdImage } from "react-icons/md";
import { LuZap, LuBadgePercent, LuTrophy } from "react-icons/lu";
import { GiUpgrade } from "react-icons/gi";
import { useGameContext } from '../components/Layout';
import { stars, planet, waterplanet, collector, magnet, harvester } from '../public/images';
import Modal from '../components/Modal';

const GalacticCollector = () => {
  const { 
    stardust, 
    setStardust, 
    clickPower, 
    setClickPower, 
    clickUpgradeCounts, 
    setClickUpgradeCounts, 
    upgradeCounts,
    difficultyMultiplier,
    incrementTotalClicks,
    achievements
  } = useGameContext();
  
  const [surgeActive, setSurgeActive] = useState(false);
  const [clickEffects, setClickEffects] = useState([]);
  const [tooltipVisible, setTooltipVisible] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [criticalChance, setCriticalChance] = useState(5); // 5% base critical chance
  const [criticalMultiplier, setCriticalMultiplier] = useState(3); // 3x base critical multiplier
  const [currentPlanet, setCurrentPlanet] = useState(planet);
  const [clickCombo, setClickCombo] = useState(0);
  const [comboTimer, setComboTimer] = useState(null);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  
  const tooltipTimeoutRef = useRef(null);
  const planetRef = useRef(null);

  const clickUpgrades = [
    { name: 'Better Collector', power: 1, baseCost: 10, image: collector },
    { name: 'Stardust Magnet', power: 5, baseCost: 100, image: magnet },
    { name: 'Quantum Harvester', power: 20, baseCost: 1000, image: harvester },
  ];

  // Check total upgrade count to determine planet evolution
  useEffect(() => {
    const totalUpgrades = Object.values(upgradeCounts).reduce((sum, count) => sum + count, 0);
    
    // Update planet based on upgrade progress
    if (totalUpgrades >= 15) {
      setCurrentPlanet(waterplanet);
      
      // Check for achievement unlocked and show modal
      if (achievements.planetEvolution && !achievements.planetEvolutionShown) {
        setCurrentAchievement({
          title: "Planet Evolution",
          description: "Your planet has evolved with water!",
          icon: "trophy"
        });
        setShowAchievementModal(true);
      }
    } else {
      setCurrentPlanet(planet);
    }
  }, [upgradeCounts, achievements]);

  // Apply difficulty multiplier to crit chance
  useEffect(() => {
    setCriticalChance(5 * difficultyMultiplier);
  }, [difficultyMultiplier]);

  // Handle combo system
  useEffect(() => {
    if (clickCombo > 0) {
      // Clear existing timer
      if (comboTimer) clearTimeout(comboTimer);
      
      // Set new timer that will reset combo if no clicks for 2 seconds
      const timer = setTimeout(() => {
        setClickCombo(0);
        setComboMultiplier(1);
      }, 2000);
      
      setComboTimer(timer);
      
      // Update combo multiplier (max 2x)
      if (clickCombo >= 10) {
        setComboMultiplier(2);
      } else if (clickCombo >= 5) {
        setComboMultiplier(1.5);
      } else {
        setComboMultiplier(1);
      }
    }
    
    return () => {
      if (comboTimer) clearTimeout(comboTimer);
    };
  }, [clickCombo]);

  const collectStardust = (e) => {
    // Track total clicks for achievements
    incrementTotalClicks();
    
    // Start shaking animation
    setIsShaking(true);
    
    // Reset shake animation after 500ms
    setTimeout(() => {
      setIsShaking(false);
    }, 500);
    
    // Increment combo counter
    setClickCombo(prev => Math.min(prev + 1, 10)); // Cap combo at 10
    
    // Apply difficulty multiplier to critical chance
    const adjustedCritChance = criticalChance * difficultyMultiplier;
    
    // Check for critical hit
    const isCritical = Math.random() * 100 < adjustedCritChance;
    
    // Calculate collection amount with combo and potential critical hit
    const baseCollected = surgeActive ? clickPower * 5 : clickPower;
    const comboBonus = baseCollected * comboMultiplier;
    // Apply difficulty multiplier to clicks
    const difficultyBonus = comboBonus * difficultyMultiplier;
    const collected = isCritical ? difficultyBonus * criticalMultiplier : difficultyBonus;
    
    // Apply the stardust gain
    setStardust(prevStardust => prevStardust + collected);

    // Create click effect with critical hit styling
    const newEffect = {
      id: Date.now(),
      value: collected,
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
      isCritical,
    };
    setClickEffects(prev => [...prev, newEffect]);

    // Apply glow effect to planet on critical hit
    if (isCritical && planetRef.current) {
      planetRef.current.classList.add('critical-glow');
      setTimeout(() => {
        if (planetRef.current) {
          planetRef.current.classList.remove('critical-glow');
        }
      }, 800);
    }

    // Remove effect after animation
    setTimeout(() => {
      setClickEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
    }, 1000);
  };

  const buyClickUpgrade = (upgrade) => {
    const count = clickUpgradeCounts[upgrade.name];
    const cost = Math.floor(upgrade.baseCost * Math.pow(1.15, count));
    if (stardust >= cost) {
      setStardust(prevStardust => prevStardust - cost);
      setClickUpgradeCounts(prev => ({
        ...prev,
        [upgrade.name]: prev[upgrade.name] + 1
      }));
      setClickPower(prevPower => prevPower + upgrade.power);
    }
  };

  const handleMouseEnter = useCallback((upgrade) => {
    clearTimeout(tooltipTimeoutRef.current);
    setTooltipVisible(upgrade.name);
  }, []);

  const handleMouseLeave = useCallback(() => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltipVisible(null);
    }, 300); // 300ms delay before hiding tooltip
  }, []);

  // Activate power surge (temporary boost)
  const activateSurge = () => {
    if (stardust >= 1000) {
      setStardust(prev => prev - 1000);
      setSurgeActive(true);
      
      // Deactivate after 10 seconds
      setTimeout(() => {
        setSurgeActive(false);
      }, 10000);
    }
  };

  return (
    <div className="height flex">
      <div className="flex-grow flex flex-col relative">
        <div className="flex-grow relative overflow-hidden bg-black">
          {/* Background stars GIF */}
          <div 
            className="absolute inset-0 rounded"
            style={{ 
              backgroundImage: `url(${stars})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          
          {/* Combo counter */}
          {clickCombo > 0 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-70 rounded-full px-3 py-1 text-white font-mp text-sm">
              <span className="font-bold">Combo: {clickCombo}{clickCombo === 10 ? " (MAX)" : ""}</span>
              {comboMultiplier > 1 && (
                <span className="ml-1 text-yellow-400">(+{((comboMultiplier-1)*100).toFixed(0)}%)</span>
              )}
            </div>
          )}
          
          {/* Surge indicator */}
          {surgeActive && (
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-blue-900 bg-opacity-70 rounded-md px-4 py-1 text-white font-mp flex items-center">
              <LuZap className="text-yellow-300 mr-1" />
              <span className="text-sm">POWER SURGE!</span>
            </div>
          )}
          
          {/* Clickable planet */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className={`relative planet-container ${isShaking ? 'shake' : ''}`}
              ref={planetRef}
            >
              <button
                onClick={collectStardust}
                className="w-[380px] h-[380px] rounded-full overflow-hidden mb-36 focus:outline-none clicker"
                style={{ 
                  backgroundImage: `url(${currentPlanet})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            </div>
          </div>
          
          {/* Click effects */}
          {clickEffects.map(effect => (
            <div
              key={effect.id}
              className={`absolute pointer-events-none font-bold text-2xl font-mp ${
                effect.isCritical ? 'text-yellow-400' : 'text-slate-950'
              }`}
              style={{
                left: `calc(50% + ${effect.x - 190}px)`, // Adjusted for smaller planet
                top: `calc(50% + ${effect.y - 280}px)`, // Adjusted for smaller planet
                animation: 'float-up 1s ease-out',
                opacity: 0,
                fontSize: effect.isCritical ? '32px' : '24px',
                textShadow: effect.isCritical ? '0 0 10px rgba(250, 204, 21, 0.7)' : 'none',
              }}
            >
              {effect.isCritical ? 'CRIT! ' : ''}+{effect.value.toFixed(0)}
            </div>
          ))}
        </div>
      </div>


      {/* Clicker Upgrades and Tooltip */}
      <div className="w-64 bg-slate-950 p-4 font-mp flex flex-col relative">
        <h2 className="text-2xl font-bold mb-4 text-white text-center">Click Upgrades</h2>
        
        {/* Stats display */}
        <div className="bg-gray-800 rounded-md p-2 mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-300">Click Power:</span>
            <span className="text-sm font-bold text-white">{clickPower}</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-300">Crit Chance:</span>
            <span className="text-sm font-bold text-yellow-400">{(criticalChance * difficultyMultiplier).toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Crit Multiplier:</span>
            <span className="text-sm font-bold text-yellow-400">{criticalMultiplier}x</span>
          </div>
        </div>
        
        {/* Power surge button */}
        <button
          onClick={activateSurge}
          disabled={surgeActive || stardust < 1000}
          className={`mb-4 py-2 px-4 rounded-md flex items-center justify-center ${
            surgeActive 
              ? 'bg-blue-600 text-white' 
              : stardust >= 1000 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          <LuZap className={`mr-2 ${surgeActive ? 'text-yellow-300' : ''}`} />
          {surgeActive ? 'SURGE ACTIVE!' : 'Power Surge (1000)'}
        </button>
        
        <div className="grid grid-cols-2 gap-4">
          {clickUpgrades.map((upgrade) => {
            const count = clickUpgradeCounts[upgrade.name];
            const cost = Math.floor(upgrade.baseCost * Math.pow(1.15, count));
            return (
              <div 
                key={upgrade.name} 
                className="relative group flex justify-center items-center"
                onMouseEnter={() => handleMouseEnter(upgrade)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={() => buyClickUpgrade(upgrade)}
                  className={`w-24 h-24 mt-2 rounded overflow-hidden focus:outline-none relative z-10 ${
                    stardust >= cost 
                      ? 'hover:transform hover:scale-105 transition-transform' 
                      : 'opacity-50'
                  }`}
                  disabled={stardust < cost}
                >
                    <img 
                      src={upgrade.image} 
                      alt={upgrade.name} 
                      className="w-full h-full object-cover object-center"
                    /> 
                    <div className="absolute top-1 right-1 bg-gray-900 bg-opacity-80 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {count}
                    </div>
                </button>
                <div className="absolute border border-sky-500 inset-0 h-28 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200 rounded"></div>
              </div>
            );
          })}
        </div>

        {/* Tooltip Container */}
        <div 
          className={`absolute right-full top-0 m-2 w-48 bg-gray-800 p-2 rounded shadow-lg transition-all duration-200 ease-in-out ${
            tooltipVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          onMouseEnter={() => clearTimeout(tooltipTimeoutRef.current)}
          onMouseLeave={handleMouseLeave}
        >
          {clickUpgrades.map((upgrade) => {
            if (upgrade.name === tooltipVisible) {
              const count = clickUpgradeCounts[upgrade.name];
              const cost = Math.floor(upgrade.baseCost * Math.pow(1.15, count));
              return (
                <div key={upgrade.name} className="text-white">
                  <h3 className="text-lg font-semibold">{upgrade.name}</h3>
                  <p className="text-sm">Power: +{upgrade.power}</p>
                  <p className="text-sm">Cost: {cost} Stardust</p>
                  <p className="text-sm">Owned: {count}</p>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
      
      {/* Achievement Modal */}
      <Modal
        isOpen={showAchievementModal}
        onClose={() => setShowAchievementModal(false)}
        title="Achievement Unlocked!"
        content={currentAchievement?.description || ""}
        icon="star"
        value={currentAchievement?.title || ""}
        subtext="Keep up the good work!"
        actionText="Continue"
      />
    </div>
  );
};

export default GalacticCollector;