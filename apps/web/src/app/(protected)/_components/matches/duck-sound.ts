const DUCK_SOUND_URL = new URL("../../../../assets/duck.mp3", import.meta.url)
  .href;

export function playDuckSound() {
  const audio = new Audio(DUCK_SOUND_URL);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
