import React from 'react';
import { LuX, LuShield } from 'react-icons/lu';
import { useGameContext } from './Layout';

const DifficultyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { setDifficultyMultiplier, difficultyMultiplier, setDifficultySelected } = useGameContext();

  const difficulties = [
    { name: 'Easy', multiplier: 2, color: 'text-green-400', description: 'Double SPS, faster research' },
    { name: 'Normal', multiplier: 1, color: 'text-blue-400', description: 'Standard gameplay experience' },
    { name: 'Hard', multiplier: 0.5, color: 'text-red-400', description: 'Half SPS, slower research' },
  ];

  const handleSelectDifficulty = (multiplier) => {
    setDifficultyMultiplier(multiplier);
    setDifficultySelected(true);
    localStorage.setItem('difficultyMultiplier', multiplier.toString());
    localStorage.setItem('difficultySelected', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-slate-900 p-6 rounded-lg shadow-xl max-w-sm w-full border border-blue-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-400 font-mp">Choose Your Difficulty</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <LuX size={24} />
          </button>
        </div>
        <div className="bg-slate-800 p-4 rounded-md mb-6">
          <p className="text-white mb-4 font-mp">
            Select your preferred game difficulty:
          </p>
          {difficulties.map((difficulty) => (
            <button
              key={difficulty.name}
              onClick={() => handleSelectDifficulty(difficulty.multiplier)}
              className={`w-full mb-3 p-3 rounded-md ${difficulty.color} hover:bg-opacity-20 bg-opacity-10 transition-colors flex items-center justify-between border ${
                difficultyMultiplier === difficulty.multiplier ? 'border-blue-500 shadow-md shadow-blue-500/30' : 'border-transparent'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-mp font-bold">{difficulty.name}</span>
                <span className="font-mp text-xs text-gray-300">{difficulty.description}</span>
              </div>
              <div className="flex items-center">
                <LuShield size={18} className="mr-2" />
                <span className="font-mp">x{difficulty.multiplier}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="text-center text-gray-400 font-mp text-sm">
          <p className="mb-2">Difficulty affects:</p>
          <ul className="list-disc list-inside text-left">
            <li>Stardust Per Second (SPS) gains</li>
            <li>Click power effectiveness</li>
            <li>Critical hit chances</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DifficultyModal;