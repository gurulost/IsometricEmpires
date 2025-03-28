import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TECHNOLOGIES } from '@/game/config/technologies';
import { useGameState } from '@/lib/stores/useGameState';
import { useAudio } from '@/lib/stores/useAudio';
import { phaserEvents, EVENTS, COMMANDS } from '@/game/utils/events';

const TechTree: React.FC = () => {
  const { technologies, researchTech } = useGameState();
  const { playSuccess } = useAudio();
  
  // Track available and researched technologies
  const [researchedTechs, setResearchedTechs] = useState<string[]>([]);
  const [availableTechs, setAvailableTechs] = useState<string[]>([]);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  
  // Handle tech researched events
  useEffect(() => {
    const handleTechResearched = (event: CustomEvent) => {
      const { techId } = event.detail;
      
      // Update researched technologies
      setResearchedTechs(prev => [...prev, techId]);
      
      // Recalculate available technologies
      calculateAvailableTechs([...researchedTechs, techId]);
      
      // Play success sound
      playSuccess();
    };
    
    // Listen for tech researched events
    window.addEventListener(EVENTS.TECH_RESEARCHED, handleTechResearched as EventListener);
    
    return () => {
      window.removeEventListener(EVENTS.TECH_RESEARCHED, handleTechResearched as EventListener);
    };
  }, [researchedTechs, playSuccess]);
  
  // Initialize tech states
  useEffect(() => {
    // Set initially researched technologies from the game state
    setResearchedTechs(technologies.researched);
    
    // Calculate available technologies
    calculateAvailableTechs(technologies.researched);
  }, [technologies.researched]);
  
  // Calculate available technologies based on prerequisites
  const calculateAvailableTechs = (researched: string[]) => {
    const available = Object.keys(TECHNOLOGIES).filter(techId => {
      const tech = TECHNOLOGIES[techId];
      
      // Skip already researched techs
      if (researched.includes(techId)) return false;
      
      // Check if all prerequisites are met
      if (tech.prerequisites.length === 0) return true;
      
      return tech.prerequisites.every(prereq => researched.includes(prereq));
    });
    
    setAvailableTechs(available);
  };
  
  // Handle research button click
  const handleResearchTech = (techId: string) => {
    // Dispatch research command
    const event = new CustomEvent(COMMANDS.RESEARCH_TECH, {
      detail: { techId }
    });
    window.dispatchEvent(event);
    
    // Update local state (actual game state will be updated via event handler)
    researchTech(techId);
  };
  
  return (
    <div className="p-2">
      <h3 className="font-semibold text-lg mb-3">Technology Tree</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {availableTechs.map(techId => {
          const tech = TECHNOLOGIES[techId];
          return (
            <div 
              key={techId}
              className={`p-2 border rounded-md cursor-pointer transition-colors
                ${selectedTech === techId ? 'bg-primary/20 border-primary' : 'bg-card/50 hover:bg-card'}`}
              onClick={() => setSelectedTech(techId)}
            >
              <h4 className="font-medium text-sm">{tech.name}</h4>
              <p className="text-xs text-muted-foreground">
                Era: {tech.era.charAt(0).toUpperCase() + tech.era.slice(1)}
              </p>
            </div>
          );
        })}
        
        {availableTechs.length === 0 && (
          <div className="col-span-full p-2 text-center text-muted-foreground">
            No technologies available for research at this time.
          </div>
        )}
      </div>
      
      {selectedTech && (
        <div className="border rounded-md p-3 bg-card/50">
          <h3 className="font-semibold">{TECHNOLOGIES[selectedTech].name}</h3>
          <p className="text-sm my-2">{TECHNOLOGIES[selectedTech].description}</p>
          
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div>
              <h4 className="font-medium text-xs text-muted-foreground">PREREQUISITES</h4>
              <ul className="list-disc pl-4 text-xs">
                {TECHNOLOGIES[selectedTech].prerequisites.length > 0 ? (
                  TECHNOLOGIES[selectedTech].prerequisites.map(prereq => (
                    <li key={prereq}>
                      {TECHNOLOGIES[prereq].name}
                      {researchedTechs.includes(prereq) ? ' ✓' : ''}
                    </li>
                  ))
                ) : (
                  <li>None</li>
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-xs text-muted-foreground">UNLOCKS</h4>
              <ul className="list-disc pl-4 text-xs">
                {TECHNOLOGIES[selectedTech].unlocks.buildings?.map(building => (
                  <li key={building}>{building.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</li>
                ))}
                {TECHNOLOGIES[selectedTech].unlocks.units?.map(unit => (
                  <li key={unit}>{unit.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</li>
                ))}
                {(!TECHNOLOGIES[selectedTech].unlocks.buildings?.length && 
                  !TECHNOLOGIES[selectedTech].unlocks.units?.length) && (
                  <li>Special abilities</li>
                )}
              </ul>
            </div>
          </div>
          
          {TECHNOLOGIES[selectedTech].flavorText && (
            <p className="text-xs italic mt-3 text-muted-foreground">
              "{TECHNOLOGIES[selectedTech].flavorText}"
            </p>
          )}
          
          <div className="mt-4">
            <Button 
              className="w-full"
              onClick={() => handleResearchTech(selectedTech)}
            >
              Research {TECHNOLOGIES[selectedTech].name}
            </Button>
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <h4 className="font-medium text-sm">Researched Technologies</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {researchedTechs.map(techId => (
            <div 
              key={techId}
              className="text-xs py-1 px-2 bg-primary/20 text-primary rounded-full"
            >
              {TECHNOLOGIES[techId].name}
            </div>
          ))}
          
          {researchedTechs.length === 0 && (
            <p className="text-sm text-muted-foreground">No technologies researched yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechTree;