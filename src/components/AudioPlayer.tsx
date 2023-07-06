import React, { useCallback, useEffect, useRef } from 'react';
import StreamCoordinator from '../utils/audio_storage/stream_coordinator';
import AudioStore from '../utils/audio_storage/audio_store';
import Player from '../utils/audio_storage/player';
import './AudioPlayer.css';

declare global {
  interface Window {
    webkitAudioContext: AudioContext;
  }
}

function AudioPlayer({ url }: { url: string }) {
  const el = useRef<HTMLDivElement>(null);
  const ac = useRef<AudioContext>();
  const store = useRef<AudioStore>();
  const streamer = useRef<StreamCoordinator>();
  const logs = useRef<HTMLDivElement>(null);
  const info = console.info;

  const run = useCallback(async () => {
    ac.current = new (window.AudioContext || window.webkitAudioContext)();
    store.current = new AudioStore(ac.current);
    streamer.current = new StreamCoordinator(url, store.current);

    console.info = (str) => {
      requestAnimationFrame(() => {
        const pre = document.createElement('pre');
        pre.textContent = `${str}\n`;
        if (logs.current) {
          logs.current.appendChild(pre);
          logs.current.scrollTop = Math.pow(2, 53) - 1;
        }
        info.call(console, str);
      });
    };

    // initialize the database
    await store.current.init();
    // load all audio assets
    await streamer.current.load();
    // set up the player
    new Player(el.current!, streamer.current!);
  }, [info, url]);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <>
      <div className="player" ref={el}>
        <p className="message"></p>
        <div className="controls">
          <button className="button fa fa-play"></button>
          <div className="track">
            <div className="progress"></div>
            <div className="scrubber"></div>
          </div>
        </div>
      </div>

      <div className="logs" ref={logs}></div>
    </>
  );
}

export default AudioPlayer;
