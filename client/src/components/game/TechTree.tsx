import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { phaserEvents, EVENTS, COMMANDS } from '@/game/utils/events';
import { useGameState } from '@/lib/stores/useGameState';
import { TECHNOLOGIES, TechnologyDefinition } from '@/game/config/technologies';

const TechTree: React.FC = () => {
  const { currentPlayer } = useGameState();
  const [researchedTechs, setResearchedTechs] = useState<string[]>([]);
  const [currentResearch, setCurrentResearch] = useState<{techId: string, progress: number}>({techId: '', progress: 0});
  const [techsAvailable, setTechsAvailable] = useState<TechnologyDefinition[]>([]);

  // Listen for tech research events
  useEffect(() => {
    const handleTechResearched = (event: CustomEvent) => {
      if (event.detail.playerId === currentPlayer) {
        setResearchedTechs(prev => [...prev, event.detail.techId]);
      }
    };

    // Fetch initial tech data
    // This would be done through the tech manager in Phaser
    const fetchTechData = () => {
      // In a real implementation, this would query the Phaser game state
      // For now, we'll use default values for demo
      setResearchedTechs(['writing', 'priesthood']); // Example initial techs
      setCurrentResearch({techId: '', progress: 0}); // No active research initially
      
      // Set available techs (techs with prerequisites met)
      const availableTechs = Object.values(TECHNOLOGIES).filter(tech => {
        // Skip already researched
        if (['writing', 'priesthood'].includes(tech.id)) return false;
        
        // Check prerequisites
        return tech.prerequisites.every(prereq => ['writing', 'priesthood'].includes(prereq));
      });
      
      setTechsAvailable(availableTechs);
    };
    
    fetchTechData();
    
    phaserEvents.on(EVENTS.TECH_RESEARCHED, handleTechResearched);
    
    return () => {
      phaserEvents.removeEventListener(EVENTS.TECH_RESEARCHED, handleTechResearched);
    };
  }, [currentPlayer]);

  // Handle starting research
  const handleResearch = (techId: string) => {
    // Emit event to start research
    phaserEvents.emit(COMMANDS.RESEARCH_TECH, { techId });
    
    // Update local state (in a real game, this would be confirmed by the tech manager)
    setCurrentResearch({techId, progress: 0});
  };

  // Group techs by era
  const techsByEra = Object.values(TECHNOLOGIES).reduce((acc, tech) => {
    if (!acc[tech.era]) {
      acc[tech.era] = [];
    }
    acc[tech.era].push(tech);
    return acc;
  }, {} as Record<string, TechnologyDefinition[]>);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Technology Tree</h3>
      
      {/* Current research */}
      {currentResearch.techId && (
        <div className="bg-card/50 p-3 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">Researching: {TECHNOLOGIES[currentResearch.techId]?.name || 'Unknown'}</span>
            <span className="text-sm">{currentResearch.progress}%</span>
          </div>
          <Progress value={currentResearch.progress} className="h-2" />
        </div>
      )}
      
      {/* Available techs */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Available Technologies</h4>
        {techsAvailable.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {techsAvailable.map(tech => (
              <Card key={tech.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{tech.name}</h5>
                      <p className="text-xs text-muted-foreground mb-1">{tech.description}</p>
                      
                      {/* Prerequisites */}
                      <div className="flex flex-wrap gap-1 mb-1">
                        {tech.prerequisites.map(prereq => (
                          <Badge key={prereq} variant="outline" className="text-xs">
                            {TECHNOLOGIES[prereq]?.name || prereq}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Unlocks */}
                      {tech.unlocks && (
                        <div className="text-xs text-muted-foreground">
                          Unlocks: {[
                            ...(tech.unlocks.units || []), 
                            ...(tech.unlocks.buildings || []),
                            ...(tech.unlocks.abilities || [])
                          ].map(item => item.replace('_', ' ')).join(', ')}
                        </div>
                      )}
                    </div>
                    
                    {/* Cost and research button */}
                    <div className="text-right">
                      <div className="text-xs mb-1">
                        Cost: {tech.cost.faith} Faith
                        {tech.cost.production && `, ${tech.cost.production} Production`}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleResearch(tech.id)}
                        disabled={currentResearch.techId !== ''}
                      >
                        Research
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No technologies available for research at this time.
          </p>
        )}
      </div>
      
      {/* Tech tree by era */}
      <div className="space-y-4">
        {Object.entries(techsByEra).map(([era, techs]) => (
          <div key={era} className="space-y-2">
            <h4 className="text-sm font-medium capitalize">{era} Era</h4>
            <div className="grid grid-cols-1 gap-2">
              {techs.map(tech => {
                const isResearched = researchedTechs.includes(tech.id);
                const isResearching = currentResearch.techId === tech.id;
                
                return (
                  <Card 
                    key={tech.id} 
                    className={`overflow-hidden ${isResearched ? 'bg-primary/10 border-primary/30' : ''}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium">{tech.name}</h5>
                          <p className="text-xs text-muted-foreground">{tech.description}</p>
                        </div>
                        
                        <Badge variant={isResearched ? "default" : (isResearching ? "secondary" : "outline")}>
                          {isResearched ? "Researched" : (isResearching ? "In Progress" : "Available")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechTree;
