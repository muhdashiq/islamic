import { useCallback, useEffect, useRef, useState } from 'react';
import type { Recitation } from '../lib/schema';
import { segmentAt } from '../lib/audio';
import {
  downloadRecording,
  readRecording,
  removeRecording,
  saveRecording,
} from '../lib/audio-storage';

type StorageStatus = 'checking' | 'unsaved' | 'downloading' | 'saved' | 'failed';
export type AudioError = 'offline' | 'playback' | 'download' | null;
interface Engine {
  element: HTMLAudioElement;
  blobUrl: string | null;
  blob: Blob | null;
  abort: AbortController | null;
  alive: boolean;
}
interface Preferences {
  playbackRate: number;
  audioLoop: boolean;
  audioVolume: number;
}
export function useVerseAudio(recitation: Recitation | undefined, preferences: Preferences) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const engine = useRef<Engine | null>(null);
  const [storage, setStorage] = useState<StorageStatus>('checking');
  const [progress, setProgress] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegment, setActiveSegment] = useState(-1);
  const [error, setError] = useState<AudioError>(null);
  const [size, setSize] = useState(0);
  const restoreTime = useRef<number | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !recitation) return;
    const current: Engine = { element: audio, blobUrl: null, blob: null, abort: null, alive: true };
    engine.current = current;
    setStorage('checking');
    setTime(0);
    setActiveSegment(-1);
    setError(null);
    let frame = 0;
    const highlight = () =>
      setActiveSegment(audio.ended ? -1 : segmentAt(recitation.segments, audio.currentTime));
    const tick = () => {
      highlight();
      frame = requestAnimationFrame(tick);
    };
    const updateTime = () => {
      setTime(audio.currentTime);
      highlight();
    };
    const play = () => {
      setPlaying(true);
      setError(null);
      cancelAnimationFrame(frame);
      tick();
    };
    const pause = () => {
      setPlaying(false);
      cancelAnimationFrame(frame);
      updateTime();
    };
    const ended = () => {
      pause();
      setActiveSegment(-1);
    };
    const wait = () => setBuffering(true);
    const ready = () => setBuffering(false);
    const metadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
      if (restoreTime.current !== null) {
        audio.currentTime = Math.min(restoreTime.current, audio.duration || 0);
        restoreTime.current = null;
      }
      updateTime();
    };
    const failed = () => {
      pause();
      setBuffering(false);
      setError(navigator.onLine ? 'playback' : 'offline');
    };
    audio.addEventListener('play', play);
    audio.addEventListener('pause', pause);
    audio.addEventListener('ended', ended);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('seeking', updateTime);
    audio.addEventListener('loadedmetadata', metadata);
    audio.addEventListener('waiting', wait);
    audio.addEventListener('playing', ready);
    audio.addEventListener('canplay', ready);
    audio.addEventListener('error', failed);
    void readRecording(recitation.url)
      .then((blob) => {
        if (!current.alive) return;
        if (blob) {
          current.blob = blob;
          current.blobUrl = URL.createObjectURL(blob);
          audio.src = current.blobUrl;
          audio.preload = 'metadata';
          setSize(blob.size);
          setStorage('saved');
        } else {
          audio.src = recitation.url;
          setStorage('unsaved');
        }
      })
      .catch(() => {
        if (current.alive) {
          audio.src = recitation.url;
          setStorage('unsaved');
        }
      });
    return () => {
      current.alive = false;
      current.abort?.abort();
      cancelAnimationFrame(frame);
      audio.removeEventListener('play', play);
      audio.removeEventListener('pause', pause);
      audio.removeEventListener('ended', ended);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('seeking', updateTime);
      audio.removeEventListener('loadedmetadata', metadata);
      audio.removeEventListener('waiting', wait);
      audio.removeEventListener('playing', ready);
      audio.removeEventListener('canplay', ready);
      audio.removeEventListener('error', failed);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      if (current.blobUrl) URL.revokeObjectURL(current.blobUrl);
    };
  }, [recitation?.id, recitation?.url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = preferences.playbackRate;
    audio.preservesPitch = true;
    audio.loop = preferences.audioLoop;
    audio.volume = preferences.audioVolume;
  }, [preferences.playbackRate, preferences.audioLoop, preferences.audioVolume]);

  const download = useCallback(async () => {
    const current = engine.current;
    if (!current?.alive || !recitation || current.abort) return;
    if (current.blob) {
      try {
        await saveRecording(recitation.url, current.blob);
        if (current.alive) setStorage('saved');
      } catch {
        if (current.alive) setStorage('failed');
      }
      return;
    }
    if (!navigator.onLine) {
      setError('offline');
      return;
    }
    const controller = new AbortController();
    current.abort = controller;
    setStorage('downloading');
    setProgress(null);
    setError(null);
    const timeout = setTimeout(
      () => controller.abort(new DOMException('Download timed out', 'TimeoutError')),
      45_000,
    );
    try {
      const blob = await downloadRecording(recitation.url, controller.signal, (value) => {
        if (current.alive) setProgress(value);
      });
      if (!current.alive) return;
      current.blob = blob;
      current.blobUrl = URL.createObjectURL(blob);
      setSize(blob.size);
      try {
        await saveRecording(recitation.url, blob);
        if (current.alive) setStorage('saved');
      } catch {
        if (current.alive) setStorage('failed');
      }
      if (current.alive && current.element.paused && current.element.currentTime === 0) {
        current.element.src = current.blobUrl;
        current.element.preload = 'metadata';
      }
    } catch {
      if (current.alive) {
        setStorage('unsaved');
        if (!controller.signal.aborted || controller.signal.reason?.name === 'TimeoutError')
          setError(navigator.onLine ? 'download' : 'offline');
      }
    } finally {
      clearTimeout(timeout);
      current.abort = null;
    }
  }, [recitation]);

  const toggle = useCallback(() => {
    const current = engine.current;
    if (!current?.alive || storage === 'checking') return;
    const audio = current.element;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (!navigator.onLine && !current.blobUrl) {
      setError('offline');
      return;
    }
    if (current.blobUrl && audio.src !== current.blobUrl) {
      restoreTime.current = audio.currentTime;
      audio.src = current.blobUrl;
    }
    if (audio.ended) audio.currentTime = 0;
    setError(null);
    // Called synchronously from the user gesture for Safari's media policy.
    void audio.play().catch(() => {
      if (current.alive) {
        setPlaying(false);
        setBuffering(false);
        setError('playback');
      }
    });
    void download();
  }, [storage, download]);

  const seek = useCallback(
    (value: number) => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(audio.duration)) return;
      audio.currentTime = Math.max(0, Math.min(value, audio.duration));
      setTime(audio.currentTime);
      if (recitation) setActiveSegment(segmentAt(recitation.segments, audio.currentTime));
    },
    [recitation],
  );
  const cancelDownload = useCallback(() => {
    engine.current?.abort?.abort();
  }, []);
  const remove = useCallback(async () => {
    const current = engine.current;
    if (!current || !recitation) return;
    try {
      await removeRecording(recitation.url);
      if (!current.alive) return;
      current.element.pause();
      current.element.preload = 'none';
      current.element.src = recitation.url;
      if (current.blobUrl) URL.revokeObjectURL(current.blobUrl);
      current.blob = null;
      current.blobUrl = null;
      setStorage('unsaved');
      setSize(0);
      setTime(0);
      setActiveSegment(-1);
    } catch {
      if (current.alive) setStorage('failed');
    }
  }, [recitation]);
  return {
    audioRef,
    storage,
    progress,
    playing,
    buffering,
    time,
    duration,
    activeSegment,
    error,
    size,
    toggle,
    seek,
    download,
    cancelDownload,
    remove,
  };
}
export type VerseAudio = ReturnType<typeof useVerseAudio>;
