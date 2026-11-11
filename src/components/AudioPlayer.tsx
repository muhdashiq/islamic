import { useEffect, useId, useRef } from 'react';
import {
  Check,
  ChevronDown,
  Download,
  Gauge,
  Headphones,
  LoaderCircle,
  MoreHorizontal,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { AppState, Recitation } from '../lib/schema';
import type { Translate } from '../lib/i18n';
import { updateState } from '../lib/store';
import { clock } from '../lib/audio';
import type { VerseAudio } from '../hooks/useVerseAudio';
interface Props {
  audio: VerseAudio;
  recitation: Recitation;
  title: string;
  state: AppState;
  t: Translate;
  pending?: boolean;
}
export function AudioPlayer({ audio, recitation, title, state, t, pending = false }: Props) {
  const statusId = useId();
  const menu = useRef<HTMLDetailsElement>(null);
  const duration = audio.duration || (recitation.segments.at(-1)?.[3] ?? 0) / 1000;
  const reciter = recitation.reciter[state.lang] || recitation.reciter.en;
  const downloading = audio.storage === 'downloading';
  const checking = audio.storage === 'checking';
  const status =
    audio.storage === 'saved'
      ? t('audioSaved')
      : audio.storage === 'failed'
        ? t('audioSaveFailed')
        : downloading
          ? `${t('audioDownloading')}${audio.progress === null ? '' : ` ${audio.progress}%`}`
          : `${t('audioAutoSave')}${recitation.bytes ? ` · ${(recitation.bytes / 1024 / 1024).toFixed(1)} MB` : ''}`;
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (menu.current && event.target instanceof Node && !menu.current.contains(event.target))
        menu.current.open = false;
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  useEffect(() => {
    if (!audio.playing && !downloading && !pending)
      document.dispatchEvent(new Event('adkar-audio-idle'));
  }, [audio.playing, downloading, pending]);
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const element = audio.audioRef.current;
    if (!element) return;
    const session = navigator.mediaSession;
    if (typeof MediaMetadata !== 'undefined')
      session.metadata = new MediaMetadata({
        title,
        artist: reciter,
        album: 'Adkar',
        artwork: [
          {
            src: new URL(`${import.meta.env.BASE_URL}icon-512.png`, location.origin).href,
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      });
    const actions: Partial<Record<MediaSessionAction, MediaSessionActionHandler>> = {
      play: () => {
        if (element.paused) audio.toggle();
      },
      pause: () => element.pause(),
      stop: () => {
        element.pause();
        audio.seek(0);
      },
      seekbackward: (detail) => audio.seek(element.currentTime - (detail.seekOffset ?? 5)),
      seekforward: (detail) => audio.seek(element.currentTime + (detail.seekOffset ?? 5)),
      seekto: (detail) => {
        if (detail.seekTime !== undefined) audio.seek(detail.seekTime);
      },
    };
    for (const [action, handler] of Object.entries(actions)) {
      try {
        session.setActionHandler(action as MediaSessionAction, handler);
      } catch {
        /* Optional on Safari and older browsers. */
      }
    }
    return () => {
      for (const action of Object.keys(actions)) {
        try {
          session.setActionHandler(action as MediaSessionAction, null);
        } catch {
          /* Unsupported action. */
        }
      }
      session.metadata = null;
      session.playbackState = 'none';
    };
  }, [audio.audioRef, audio.toggle, audio.seek, title, reciter]);
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = audio.playing ? 'playing' : 'paused';
    if (audio.duration > 0 && navigator.mediaSession.setPositionState) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: state.playbackRate,
          position: Math.min(audio.time, audio.duration),
        });
      } catch {
        /* Optional position reporting. */
      }
    }
  }, [audio.playing, audio.time, audio.duration, state.playbackRate]);
  return (
    <section className="audio-player" aria-label={t('audioPlayer')}>
      <audio
        ref={audio.audioRef}
        preload="none"
        crossOrigin="anonymous"
        data-busy={audio.playing || downloading || pending ? 'true' : 'false'}
        hidden
      />
      <div className="audio-heading">
        <span className="audio-reciter">
          <Headphones size={14} />
          <span>{reciter}</span>
        </span>
        <span
          className={`audio-download-badge ${audio.storage === 'saved' ? 'is-saved' : ''}`}
          title={status}
        >
          {audio.storage === 'saved' ? (
            <>
              <Check size={12} />
              <span>{t('audioOffline')}</span>
            </>
          ) : (
            <span>{t('audioListen')}</span>
          )}
        </span>
      </div>
      <div className="audio-main-controls" dir="ltr">
        <button
          className="audio-play"
          aria-label={t(audio.playing ? 'audioPause' : 'audioPlay')}
          aria-describedby={statusId}
          disabled={checking}
          onClick={audio.toggle}
        >
          {checking || audio.buffering ? (
            <LoaderCircle size={20} className="spinning" />
          ) : audio.playing ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" />
          )}
        </button>
        <div className="audio-timeline">
          <input
            type="range"
            aria-label={t('audioSeek')}
            aria-valuetext={`${clock(audio.time)} / ${clock(duration)}`}
            min={0}
            max={duration}
            step={0.01}
            value={Math.min(audio.time, duration)}
            disabled={!audio.duration}
            onChange={(event) => audio.seek(Number(event.target.value))}
          />
          <div className="audio-times">
            <span>{clock(audio.time)}</span>
            <span>{clock(duration)}</span>
          </div>
        </div>
        <button
          className="icon-button audio-restart"
          aria-label={t('audioRestart')}
          disabled={!audio.duration}
          onClick={() => audio.seek(0)}
        >
          <RotateCcw size={17} />
        </button>
        <button
          className={`icon-button audio-loop ${state.audioLoop ? 'is-active' : ''}`}
          aria-label={t('audioRepeat')}
          aria-pressed={state.audioLoop}
          onClick={() => updateState((s) => ({ ...s, audioLoop: !s.audioLoop }))}
        >
          <Repeat size={18} />
        </button>
      </div>
      <div className="audio-options">
        <label className="native-select audio-speed">
          <Gauge size={14} />
          <span className="sr-only">{t('audioSpeed')}</span>
          <select
            value={state.playbackRate}
            onChange={(event) =>
              updateState((s) => ({ ...s, playbackRate: Number(event.target.value) }))
            }
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
              <option key={rate} value={rate}>
                {rate}×
              </option>
            ))}
          </select>
          <ChevronDown size={11} />
        </label>
        <div className="audio-save-status" id={statusId} role={downloading ? undefined : 'status'}>
          {status}
        </div>
        {downloading ? (
          <button
            className="icon-button audio-save"
            aria-label={t('audioCancelDownload')}
            onClick={audio.cancelDownload}
          >
            <X size={16} />
          </button>
        ) : (
          audio.storage !== 'saved' && (
            <button
              className="icon-button audio-save"
              aria-label={t('audioDownload')}
              onClick={() => void audio.download()}
              disabled={checking}
            >
              <Download size={16} />
            </button>
          )
        )}
        <details
          ref={menu}
          className="audio-more"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.currentTarget.open = false;
              event.currentTarget.querySelector('summary')?.focus();
            }
          }}
        >
          <summary role="button" className="icon-button" aria-label={t('audioMore')}>
            <MoreHorizontal size={20} />
          </summary>
          <div className="audio-menu">
            <div className="audio-volume">
              <button
                className="icon-button"
                aria-label={t(state.audioVolume === 0 ? 'audioUnmute' : 'audioMute')}
                onClick={() =>
                  updateState((s) => ({ ...s, audioVolume: s.audioVolume === 0 ? 1 : 0 }))
                }
              >
                {state.audioVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                aria-label={t('audioVolume')}
                min={0}
                max={1}
                step={0.05}
                value={state.audioVolume}
                onChange={(event) =>
                  updateState((s) => ({ ...s, audioVolume: Number(event.target.value) }))
                }
              />
            </div>
            <p className="audio-device-volume">{t('audioDeviceVolume')}</p>
            {audio.storage === 'saved' && (
              <button
                className="audio-remove"
                onClick={() => {
                  void audio.remove();
                  if (menu.current) menu.current.open = false;
                }}
              >
                <Trash2 size={14} />
                <span>{t('audioRemove')}</span>
                <small>{(audio.size / 1024 / 1024).toFixed(1)} MB</small>
              </button>
            )}
            <p className="audio-attribution">
              <a href={recitation.source} target="_blank" rel="noreferrer">
                EveryAyah
              </a>
              <span> · </span>
              <a href={recitation.timingSource} target="_blank" rel="noreferrer">
                {t('audioTimings')}: Collin Fair
              </a>
              <span> · </span>
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY 4.0
              </a>
              {recitation.timingNotes && <span> · {recitation.timingNotes}</span>}
            </p>
          </div>
        </details>
      </div>
      {downloading && (
        <div
          className="audio-download-progress"
          role="progressbar"
          aria-label={t('audioDownloading')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={audio.progress ?? undefined}
        >
          <span style={{ width: `${audio.progress ?? 0}%` }} />
        </div>
      )}
      {audio.error && (
        <p className="audio-error" role="alert">
          {t(
            audio.error === 'offline'
              ? 'audioOfflineError'
              : audio.error === 'download'
                ? 'audioDownloadError'
                : 'audioPlaybackError',
          )}
        </p>
      )}
    </section>
  );
}
