export const playNotificationSound = () => {
  try {
    // Base64 encoded short "ding" sound
    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();

    // Oscillator for a clean pure tone (bell-like)
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // High frequency for a "ding"
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800 Hz
    oscillator.frequency.exponentialRampToValueAtTime(
      1200,
      audioContext.currentTime + 0.1,
    );

    // Envelope: quick attack, slower decay
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05); // Attack
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5,
    ); // Decay

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error("Audio playback failed", error);
  }
};
