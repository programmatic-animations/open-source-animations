const EXPORT_SERVER = 'http://127.0.0.1:5174';

async function checkExportServer() {
  try {
    const response = await fetch(`${EXPORT_SERVER}/health`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error('unhealthy');
  } catch {
    throw new Error('Export server unavailable. Start npm run dev (or node export-server.mjs).');
  }
}

export function isExportMode() {
  return new URLSearchParams(window.location.search).get('export') === '1';
}

function showStatus(text) {
  let status = document.getElementById('export-status');

  if (!status) {
    status = document.createElement('div');
    status.id = 'export-status';

    Object.assign(status.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#111',
      color: '#fff',
      padding: '10px 16px',
      borderRadius: '8px',
      fontFamily: 'sans-serif',
      zIndex: '9999'
    });

    document.body.appendChild(status);
  }

  status.textContent = text;
}

export function setupExportButton({ getSceneEndTime }) {
  const exportButton = document.createElement('button');

  function refresh() {
    const sceneEndTime = getSceneEndTime();

    exportButton.textContent = sceneEndTime
      ? 'Export 1080p MP4'
      : 'Set End Before Export';

    exportButton.disabled = !sceneEndTime;

    exportButton.style.background = sceneEndTime
      ? '#111'
      : '#777';

    exportButton.style.cursor = sceneEndTime
      ? 'pointer'
      : 'not-allowed';
  }

  Object.assign(exportButton.style, {
    position: 'fixed',
    top: '70px',
    right: '20px',
    padding: '12px 18px',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    zIndex: '9999'
  });

  exportButton.onclick = async () => {
    const sceneEndTime = getSceneEndTime();

    if (!sceneEndTime) return;

    try { await checkExportServer(); } catch (error) { showStatus(error.message); return; }

    const url = new URL(window.location.href);

    url.searchParams.set('export', '1');
    url.searchParams.delete('t');

    window.location.href = url.toString();
  };

  refresh();

  document.body.appendChild(exportButton);

  return {
    refresh
  };
}

export function createVideoExporter({
  renderer,
  camera,
  sceneConfig,
  getSceneEndTime,
  restartScene,
  pauseScene
}) {
  let exportRecorder = null;
  let exportChunks = [];
  let exportFinished = false;

  function onAfterRender(time) {
    if (
      isExportMode() &&
      exportRecorder?.state === 'recording' &&
      !exportFinished &&
      time >= getSceneEndTime()
    ) {
      exportFinished = true;
      pauseScene();

      exportRecorder.requestData();
      exportRecorder.stop();
    }
  }

  async function startExport() {
    const sceneEndTime = getSceneEndTime();

    if (!sceneEndTime) {
      showStatus('No scene end has been set.');
      return;
    }

    try {
    await checkExportServer();
    if (typeof MediaRecorder === 'undefined' || !renderer.domElement.captureStream) {
      throw new Error('This browser cannot record canvas video. Use Chrome for export.');
    }
    renderer.setPixelRatio(1);
    renderer.setSize(1920, 1080, false);

    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
    renderer.domElement.style.objectFit = 'contain';

    camera.aspect = 1920 / 1080;
    camera.updateProjectionMatrix();

    const stream = renderer.domElement.captureStream(60);

    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) { stream.getTracks().forEach(track => track.stop()); throw new Error('No supported video recording format.'); }

    exportRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 16_000_000
    });

    exportChunks = [];

    exportRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        exportChunks.push(event.data);
      }
    };

    exportRecorder.onstop = async () => {
      showStatus('Creating MP4...');

      try {
        const blob = new Blob(exportChunks, {
          type: mimeType
        });

        const response = await fetch(
          `${EXPORT_SERVER}/export`,
          {
            method: 'POST',
            headers: {
              'Content-Type': mimeType,
              'X-Scene-Id': sceneConfig.id
            },
            body: blob
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error);
        }

        showStatus(`Done: ${result.file}`);
      } catch (error) {
        showStatus(`Export failed: ${error.message}`);
      } finally {
        stream.getTracks().forEach(track => track.stop());
      }
    };

    exportRecorder.onerror = event => {
      pauseScene();
      stream.getTracks().forEach(track => track.stop());
      showStatus(`Recording failed: ${event.error?.message ?? 'unknown error'}`);
    };
    exportFinished = false;
    restartScene();

    exportRecorder.start();

    showStatus(`Recording ${sceneConfig.title}...`);
    } catch (error) {
      pauseScene();
      showStatus(`Export failed: ${error.message}`);
    }
  }

  return {
    onAfterRender,
    startExport
  };
}
