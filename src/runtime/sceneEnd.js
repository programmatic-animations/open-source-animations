function endTimeKey(sceneId) {
  return `scene-end:${sceneId}`;
}

export function getSceneEndTime(sceneId) {
  return Number(localStorage.getItem(endTimeKey(sceneId))) || null;
}

export function setSceneEndTime(sceneId, time) {
  localStorage.setItem(endTimeKey(sceneId), String(time));
  return time;
}

export function clearSceneEndTime(sceneId) {
  localStorage.removeItem(endTimeKey(sceneId));
}

export function setupSceneEndButton({
  sceneId,
  sceneEndTime,
  getCurrentTime,
  onSetEnd
}) {
  const setEndButton = document.createElement('button');

  setEndButton.textContent = sceneEndTime
    ? `End: ${sceneEndTime.toFixed(2)}s`
    : 'Set End';

  Object.assign(setEndButton.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#111',
    color: '#fff',
    cursor: 'pointer',
    zIndex: '9999'
  });

  setEndButton.onclick = () => {
    const time = getCurrentTime();
    onSetEnd(time);
    setSceneEndTime(sceneId, time);

    setEndButton.textContent =
      `End: ${time.toFixed(2)}s`;
  };

  document.body.appendChild(setEndButton);
}
