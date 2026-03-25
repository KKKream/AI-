import { ChangeEvent, DragEvent, startTransition, useEffect, useRef, useState } from 'react';
import { preload, removeBackground, type Config } from '@imgly/background-removal';

type ModelMode = 'fast' | 'quality';

type DownloadProgress = {
  current: number;
  key: string;
  total: number;
};

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const MODEL_OPTIONS: Array<{
  description: string;
  id: ModelMode;
  label: string;
}> = [
  {
    id: 'fast',
    label: '快速模式',
    description: '首次下载更小，适合先快速试跑和日常使用。'
  },
  {
    id: 'quality',
    label: '精细模式',
    description: '模型更大，复杂边缘效果通常更稳定。'
  }
];

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatProgress(progress: DownloadProgress | null) {
  if (!progress || progress.total <= 0) {
    return '等待开始';
  }

  const percent = Math.min(100, Math.round((progress.current / progress.total) * 100));
  return `${progress.key} ${percent}% (${formatBytes(progress.current)} / ${formatBytes(progress.total)})`;
}

function buildConfig(
  mode: ModelMode,
  onProgress?: (progress: DownloadProgress) => void
): Config {
  return {
    debug: false,
    device: 'cpu',
    model: mode === 'fast' ? 'isnet_quint8' : 'isnet_fp16',
    output: {
      format: 'image/png',
      quality: 1
    },
    progress: (key, current, total) => {
      onProgress?.({ key, current, total });
    }
  };
}

function App() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [modelMode, setModelMode] = useState<ModelMode>('fast');
  const [status, setStatus] = useState('选择一张图片，开始本地 AI 去背景。');
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    return () => {
      if (sourceUrl) {
        URL.revokeObjectURL(sourceUrl);
      }
    };
  }, [sourceUrl]);

  useEffect(() => {
    return () => {
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [resultUrl]);

  function resetResult() {
    setResultUrl(null);
    setDownloadProgress(null);
    setError(null);
  }

  function applyFile(file: File) {
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError('当前仅支持 PNG、JPG、WEBP 图片。');
      return;
    }

    const nextUrl = URL.createObjectURL(file);

    startTransition(() => {
      setSelectedFile(file);
      setSourceUrl(nextUrl);
      resetResult();
      setStatus(`已加载 ${file.name}，现在可以开始去背景。`);
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      applyFile(file);
    }

    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];

    if (file) {
      applyFile(file);
    }
  }

  async function warmupModel() {
    setIsPreparing(true);
    setError(null);
    setStatus('正在预加载 AI 模型，首次下载可能需要一些时间。');
    setDownloadProgress(null);

    try {
      await preload(
        buildConfig(modelMode, (progress) => {
          setDownloadProgress(progress);
          setStatus(`正在预加载模型：${formatProgress(progress)}`);
        })
      );
      setModelReady(true);
      setStatus('模型预加载完成，后续处理会更快。');
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '未知错误';
      setError(`模型预加载失败：${message}`);
      setStatus('模型预加载失败，请稍后重试。');
    } finally {
      setIsPreparing(false);
    }
  }

  async function handleRemoveBackground() {
    if (!selectedFile) {
      setError('请先选择一张图片。');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDownloadProgress(null);
    setStatus(
      modelReady
        ? '正在分离主体与背景，请稍候。'
        : '检测到首次运行，先下载模型资源。'
    );

    try {
      const blob = await removeBackground(
        selectedFile,
        buildConfig(modelMode, (progress) => {
          setDownloadProgress(progress);
          setStatus(`正在下载模型资源：${formatProgress(progress)}`);
        })
      );

      const nextResultUrl = URL.createObjectURL(blob);
      setResultUrl(nextResultUrl);
      setModelReady(true);
      setStatus('处理完成，可以下载透明背景 PNG。');
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '未知错误';
      setError(`去背景失败：${message}`);
      setStatus('处理失败，请换一张图或稍后再试。');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDownload() {
    if (!resultUrl || !selectedFile) {
      return;
    }

    const link = document.createElement('a');
    const baseName = selectedFile.name.replace(/\.[^.]+$/, '');
    link.href = resultUrl;
    link.download = `${baseName}-no-bg.png`;
    link.click();
  }

  const busy = isPreparing || isProcessing;
  const progressPercent =
    downloadProgress && downloadProgress.total > 0
      ? Math.min(100, Math.round((downloadProgress.current / downloadProgress.total) * 100))
      : 0;

  return (
    <main className="page-shell">
      <section className="workspace-stack">
        <div className="panel intake-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Step 1</p>
              <h2>上传图片</h2>
            </div>
            <button className="ghost-button" type="button" onClick={() => inputRef.current?.click()}>
              选择文件
            </button>
          </div>

          <div className="intake-layout">
            <div className="intake-upload">
              <label
                className={`dropzone ${isDragging ? 'dragging' : ''} ${sourceUrl ? 'has-file' : ''}`}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <input
                  ref={inputRef}
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  type="file"
                  onChange={handleFileChange}
                />
                <div className="dropzone-content">
                  <span className="dropzone-icon">+</span>
                  <strong>{selectedFile ? selectedFile.name : '拖拽图片到这里'}</strong>
                  <p>
                    {selectedFile
                      ? `文件大小 ${formatBytes(selectedFile.size)}`
                      : '或点击选择 PNG、JPG、WEBP'}
                  </p>
                </div>
              </label>
            </div>

            <div className="intake-actions">
              <div className="status-card">
                <div className="status-line">
                  <span className={`status-dot ${busy ? 'busy' : modelReady ? 'ready' : ''}`} />
                  <p>{status}</p>
                </div>
                {downloadProgress ? (
                  <div className="progress-wrap">
                    <div aria-hidden="true" className="progress-bar">
                      <span style={{ width: `${progressPercent}%` }} />
                    </div>
                    <small>{formatProgress(downloadProgress)}</small>
                  </div>
                ) : null}
                {error ? <p className="error-text">{error}</p> : null}
              </div>

              <div className="mode-grid">
                {MODEL_OPTIONS.map((option) => (
                  <label className={`mode-card ${modelMode === option.id ? 'active' : ''}`} key={option.id}>
                    <input
                      checked={modelMode === option.id}
                      name="modelMode"
                      type="radio"
                      value={option.id}
                      onChange={() => setModelMode(option.id)}
                    />
                    <span>{option.label}</span>
                    <small>{option.description}</small>
                  </label>
                ))}
              </div>

              <div className="action-row">
                <button
                  className="primary-button"
                  disabled={!selectedFile || busy}
                  type="button"
                  onClick={handleRemoveBackground}
                >
                  {isProcessing ? '处理中...' : '开始去背景'}
                </button>
                <button
                  className="secondary-button"
                  disabled={busy}
                  type="button"
                  onClick={warmupModel}
                >
                  {isPreparing ? '预加载中...' : modelReady ? '重新预热模型' : '预加载模型'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="panel preview-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Step 2</p>
              <h2>结果预览</h2>
            </div>
            <button className="ghost-button" disabled={!resultUrl} type="button" onClick={handleDownload}>
              下载 PNG
            </button>
          </div>

          <div className="preview-grid">
            <article className="preview-card">
              <header>
                <span>原图</span>
              </header>
              <div className="preview-stage">
                {sourceUrl ? <img alt="原图预览" src={sourceUrl} /> : <p>上传后会在这里显示原图。</p>}
              </div>
            </article>

            <article className="preview-card checkerboard">
              <header>
                <span>去背景结果</span>
              </header>
              <div className="preview-stage">
                {resultUrl ? (
                  <img alt="去背景结果预览" src={resultUrl} />
                ) : (
                  <p>处理完成后会在这里显示透明 PNG。</p>
                )}
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
