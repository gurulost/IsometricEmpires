import { useEffect } from 'react';
import { useAudio } from '@/lib/stores/useAudio';

const AudioProvider = () => {
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  useEffect(() => {
    // Initialize sound assets
    const loadAudio = async () => {
      // Background music
      const bgMusic = new Audio('/audio/background_music.mp3');
      bgMusic.loop = true;
      bgMusic.volume = 0.2;
      setBackgroundMusic(bgMusic);

      // Hit sound
      const hit = new Audio('/audio/hit.mp3');
      setHitSound(hit);

      // Success sound
      const success = new Audio('/audio/success.mp3');
      success.volume = 0.5;
      setSuccessSound(success);

      console.log('Audio assets loaded');
    };

    loadAudio().catch(error => {
      console.error('Failed to load audio assets:', error);
    });
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  return null; // This component doesn't render anything
};

export default AudioProvider;