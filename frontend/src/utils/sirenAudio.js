let audioCtx = null;
let sirenInterval = null;

export function playSiren() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    if (sirenInterval) return;

    let high = true;
    sirenInterval = setInterval(() => {
      try {
        if (!audioCtx || audioCtx.state === "closed") return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(high ? 880 : 620, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
        high = !high;
      } catch (err) {
        console.error(err);
      }
    }, 480);
  } catch (e) {
    console.warn("Audio alert not permitted by browser autoplay policy yet:", e);
  }
}

export function stopSiren() {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
}
