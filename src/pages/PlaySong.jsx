import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, X, Zap } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";

const IconPlay = () => (
  <svg viewBox="0 0 100 100" width="36" height="36" style={{fillRule:'evenodd',clipRule:'evenodd'}} className="pointer-events-none">
    <g transform="matrix(1,0,0,1,0,-150)">
      <g transform="matrix(2.666667,0,0,2.666667,-4310,-5190.924981)"><circle cx="1635" cy="2021.597" r="15" fill="white"/></g>
      <g transform="matrix(0,2.666667,-1.434735,0,2435.044252,-4278.666667)"><path d="M1678.702,1652.596C1678.908,1652.184 1679.197,1651.95 1679.5,1651.95C1679.803,1651.95 1680.092,1652.184 1680.298,1652.596C1681.834,1655.668 1685.232,1662.464 1687.298,1666.596C1687.593,1667.187 1687.672,1668.046 1687.499,1668.784C1687.326,1669.523 1686.934,1670 1686.5,1670C1682.86,1670 1676.14,1670 1672.5,1670C1672.066,1670 1671.674,1669.523 1671.501,1668.784C1671.328,1668.046 1671.407,1667.187 1671.702,1666.596C1673.768,1662.464 1677.166,1655.668 1678.702,1652.596Z" fill="currentColor"/></g>
    </g>
  </svg>
);

const IconPause = () => (
  <svg viewBox="0 0 100 100" width="36" height="36" style={{fillRule:'evenodd',clipRule:'evenodd'}} className="pointer-events-none">
    <g transform="matrix(2.666667,0,0,2.666667,-83.333333,-83.333333)">
      <g transform="matrix(1,0,0,1,-1585,-1971.596868)"><circle cx="1635" cy="2021.597" r="15" fill="white"/></g>
      <g transform="matrix(1,0,0,1,-1495.055622,-1665)">
        <g transform="matrix(-1,0,0,1.015806,3166.111244,-27.106898)"><path d="M1619.69,1707.124C1619.861,1707.124 1620,1707.261 1620,1707.43C1620,1709.425 1620,1720.575 1620,1722.57C1620,1722.739 1619.861,1722.876 1619.69,1722.876C1618.944,1722.876 1617.056,1722.876 1616.31,1722.876C1616.139,1722.876 1616,1722.739 1616,1722.57C1616,1720.575 1616,1709.425 1616,1707.43C1616,1707.261 1616.139,1707.124 1616.31,1707.124C1617.056,1707.124 1618.944,1707.124 1619.69,1707.124Z" fill="currentColor"/></g>
        <g transform="matrix(-1,0,0,1.015806,3160,-27.106898)"><path d="M1619.69,1707.124C1619.861,1707.124 1620,1707.261 1620,1707.43C1620,1709.425 1620,1720.575 1620,1722.57C1620,1722.739 1619.861,1722.876 1619.69,1722.876C1618.944,1722.876 1617.056,1722.876 1616.31,1722.876C1616.139,1722.876 1616,1722.739 1616,1722.57C1616,1720.575 1616,1709.425 1616,1707.43C1616,1707.261 1616.139,1707.124 1616.31,1707.124C1617.056,1707.124 1618.944,1707.124 1619.69,1707.124Z" fill="currentColor"/></g>
      </g>
    </g>
  </svg>
);

const IconSetlist = () => (
  <svg viewBox="0 0 100 100" width="36" height="36" style={{fillRule:'evenodd',clipRule:'evenodd'}} className="pointer-events-none">
    <g transform="matrix(1,0,0,1,-300,0)">
      <g transform="matrix(2.666667,0,0,2.666667,-583.333333,-83.333333)">
        <g transform="matrix(1,0,0,1,-1285,-1971.596868)"><circle cx="1635" cy="2021.597" r="15" fill="white"/></g>
        <g transform="matrix(1,0,0,1,-1223.5,-1665.5)">
          <g transform="matrix(-0,0.5,1.015806,-0,-167.106898,902)"><path d="M1619.379,1707.124C1619.722,1707.124 1620,1707.261 1620,1707.43C1620,1709.425 1620,1720.575 1620,1722.57C1620,1722.739 1619.722,1722.876 1619.379,1722.876C1618.629,1722.876 1617.371,1722.876 1616.621,1722.876C1616.278,1722.876 1616,1722.739 1616,1722.57C1616,1720.575 1616,1709.425 1616,1707.43C1616,1707.261 1616.278,1707.124 1616.621,1707.124C1617.371,1707.124 1618.629,1707.124 1619.379,1707.124Z" fill="black"/></g>
          <g transform="matrix(-0,0.5,0.126976,-0,1347.236638,902)"><path d="M1619.379,1707.124C1619.722,1707.124 1620,1708.218 1620,1709.568L1620,1720.432C1620,1721.782 1619.722,1722.876 1619.379,1722.876C1618.629,1722.876 1617.371,1722.876 1616.621,1722.876C1616.278,1722.876 1616,1721.782 1616,1720.432L1616,1709.568C1616,1708.218 1616.278,1707.124 1616.621,1707.124L1619.379,1707.124Z" fill="black"/></g>
          <g transform="matrix(-0,0.5,1.015806,-0,-167.106898,905)"><path d="M1619.379,1707.124C1619.722,1707.124 1620,1707.261 1620,1707.43C1620,1709.425 1620,1720.575 1620,1722.57C1620,1722.739 1619.722,1722.876 1619.379,1722.876C1618.629,1722.876 1617.371,1722.876 1616.621,1722.876C1616.278,1722.876 1616,1722.739 1616,1722.57C1616,1720.575 1616,1709.425 1616,1707.43C1616,1707.261 1616.278,1707.124 1616.621,1707.124C1617.371,1707.124 1618.629,1707.124 1619.379,1707.124Z" fill="black"/></g>
          <g transform="matrix(-0,0.5,0.126976,-0,1347.236638,905)"><path d="M1619.379,1707.124C1619.722,1707.124 1620,1708.218 1620,1709.568L1620,1720.432C1620,1721.782 1619.722,1722.876 1619.379,1722.876C1618.629,1722.876 1617.371,1722.876 1616.621,1722.876C1616.278,1722.876 1616,1721.782 1616,1720.432L1616,1709.568C1616,1708.218 1616.278,1707.124 1616.621,1707.124L1619.379,1707.124Z" fill="black"/></g>
          <g transform="matrix(-0,0.5,1.015806,-0,-167.106898,908)"><path d="M1619.379,1707.124C1619.722,1707.124 1620,1707.261 1620,1707.43C1620,1709.425 1620,1720.575 1620,1722.57C1620,1722.739 1619.722,1722.876 1619.379,1722.876C1618.629,1722.876 1617.371,1722.876 1616.621,1722.876C1616.278,1722.876 1616,1722.739 1616,1722.57C1616,1720.575 1616,1709.425 1616,1707.43C1616,1707.261 1616.278,1707.124 1616.621,1707.124C1617.371,1707.124 1618.629,1707.124 1619.379,1707.124Z" fill="black"/></g>
          <g transform="matrix(-0,0.5,0.126976,-0,1347.236638,908)"><path d="M1619.379,1707.124C1619.722,1707.124 1620,1708.218 1620,1709.568L1620,1720.432C1620,1721.782 1619.722,1722.876 1619.379,1722.876C1618.629,1722.876 1617.371,1722.876 1616.621,1722.876C1616.278,1722.876 1616,1721.782 1616,1720.432L1616,1709.568C1616,1708.218 1616.278,1707.124 1616.621,1707.124L1619.379,1707.124Z" fill="black"/></g>
          <g transform="matrix(-0,0.5,1.015806,-0,-167.106898,911)"><path d="M1619.379,1707.124C1619.722,1707.124 1620,1707.261 1620,1707.43C1620,1709.425 1620,1720.575 1620,1722.57C1620,1722.739 1619.722,1722.876 1619.379,1722.876C1618.629,1722.876 1617.371,1722.876 1616.621,1722.876C1616.278,1722.876 1616,1722.739 1616,1722.57C1616,1720.575 1616,1709.425 1616,1707.43C1616,1707.261 1616.278,1707.124 1616.621,1707.124C1617.371,1707.124 1618.629,1707.124 1619.379,1707.124Z" fill="black"/></g>
          <g transform="matrix(-0,0.5,0.126976,-0,1347.236638,911)"><path d="M1619.379,1707.124C1619.722,1707.124 1620,1708.218 1620,1709.568L1620,1720.432C1620,1721.782 1619.722,1722.876 1619.379,1722.876C1618.629,1722.876 1617.371,1722.876 1616.621,1722.876C1616.278,1722.876 1616,1721.782 1616,1720.432L1616,1709.568C1616,1708.218 1616.278,1707.124 1616.621,1707.124L1619.379,1707.124Z" fill="black"/></g>
        </g>
      </g>
    </g>
  </svg>
);

const IconSettings = () => (
  <svg viewBox="0 0 100 100" width="36" height="36" style={{fillRule:'evenodd',clipRule:'evenodd'}} className="pointer-events-none">
    <g transform="matrix(1,0,0,1,-150,0)">
      <g transform="matrix(2.666667,0,0,2.666667,-333.333333,-83.333333)">
        <g transform="matrix(1,0,0,1,-1435,-1971.596868)"><circle cx="1635" cy="2021.597" r="15" fill="white"/></g>
        <g transform="matrix(0.193182,0,0,0.193182,190.340909,-143.638153)">
          <path d="M47.871,958.362C45.488,958.362 43.395,959.944 42.745,962.236C42.362,963.586 41.941,965.072 41.589,966.311C41.118,967.97 39.872,969.299 38.246,969.876C37.247,970.222 36.274,970.623 35.325,971.066C33.775,971.801 31.965,971.742 30.466,970.908C29.327,970.291 27.967,969.535 26.733,968.848C24.653,967.691 22.058,968.054 20.375,969.737C19.413,970.7 18.337,971.775 17.375,972.738C15.692,974.42 15.329,977.015 16.486,979.095C17.173,980.329 17.929,981.689 18.559,982.821C19.394,984.324 19.453,986.139 18.716,987.693C18.26,988.636 17.859,989.61 17.502,990.604C16.926,992.226 15.6,993.468 13.945,993.938C12.71,994.303 11.224,994.724 9.874,995.107C7.582,995.757 6,997.85 6,1000.233C6,1001.599 6,1003.125 6,1004.492C6,1006.874 7.582,1008.967 9.874,1009.617C11.224,1010 12.71,1010.422 13.948,1010.773C15.608,1011.244 16.937,1012.49 17.514,1014.116C17.86,1015.115 18.26,1016.088 18.704,1017.038C19.439,1018.588 19.38,1020.397 18.546,1021.896C17.929,1023.035 17.173,1024.395 16.486,1025.63C15.329,1027.709 15.692,1030.304 17.375,1031.987C18.337,1032.95 19.413,1034.025 20.375,1034.988C22.058,1036.67 24.653,1037.033 26.733,1035.876C27.967,1035.19 29.327,1034.433 30.459,1033.804C31.962,1032.968 33.776,1032.909 35.33,1033.646C36.274,1034.102 37.247,1034.503 38.242,1034.86C39.864,1035.436 41.106,1036.762 41.576,1038.418C41.941,1039.652 42.362,1041.138 42.745,1042.488C43.395,1044.78 45.488,1046.362 47.871,1046.362C49.237,1046.362 50.763,1046.362 52.129,1046.362C54.512,1046.362 56.605,1044.78 57.255,1042.488C57.638,1041.138 58.059,1039.652 58.411,1038.414C58.882,1036.754 60.128,1035.425 61.754,1034.849C62.753,1034.503 63.726,1034.102 64.675,1033.658C66.225,1032.923 68.035,1032.982 69.534,1033.816C70.673,1034.433 72.033,1035.19 73.267,1035.876C75.347,1037.033 77.942,1036.67 79.625,1034.988C80.587,1034.025 81.663,1032.95 82.625,1031.987C84.308,1030.304 84.671,1027.709 83.514,1025.63C82.827,1024.395 82.071,1023.035 81.441,1021.903C80.606,1020.4 80.547,1018.586 81.284,1017.032C81.74,1016.088 82.14,1015.115 82.498,1014.121C83.074,1012.499 84.4,1011.256 86.055,1010.786C87.29,1010.422 88.776,1010 90.126,1009.617C92.418,1008.967 94,1006.874 94,1004.492C94,1003.125 94,1001.599 94,1000.233C94,997.85 92.418,995.757 90.126,995.107C88.776,994.724 87.29,994.303 86.052,993.952C84.392,993.48 83.063,992.234 82.486,990.608C82.141,989.61 81.74,988.636 81.296,987.687C80.561,986.137 80.62,984.327 81.454,982.828C82.071,981.69 82.827,980.329 83.514,979.095C84.671,977.015 84.308,974.42 82.625,972.738C81.663,971.775 80.587,970.7 79.625,969.737C77.942,968.054 75.347,967.691 73.267,968.848C72.033,969.535 70.673,970.291 69.541,970.921C68.038,971.757 66.224,971.815 64.67,971.078C63.726,970.623 62.753,970.222 61.758,969.864C60.136,969.288 58.894,967.963 58.424,966.307C58.059,965.072 57.638,963.586 57.255,962.236C56.605,959.944 54.512,958.362 52.129,958.362C50.763,958.362 49.237,958.362 47.871,958.362ZM50,980.362C62.115,980.362 72,990.247 72,1002.362C72,1014.477 62.115,1024.362 50,1024.362C37.885,1024.362 28,1014.477 28,1002.362C28,990.247 37.885,980.362 50,980.362ZM50,986.362C41.128,986.362 34,993.49 34,1002.362C34,1011.234 41.128,1018.362 50,1018.362C58.872,1018.362 66,1011.234 66,1002.362C66,993.49 58.872,986.362 50,986.362Z" fill="black" fillRule="nonzero"/>
        </g>
      </g>
    </g>
  </svg>
);

export default function PlaySong() {
  const { id, songIndex } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [setlist, setSetlist] = useState(null);
  const [items, setItems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(parseInt(songIndex) || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  
  // Configurações salvas localmente
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem("ls_fontSize") || "24"));
  const [lineHeight, setLineHeight] = useState(() => parseFloat(localStorage.getItem("ls_lineHeight") || "1.8"));
  const [setlistFontSize, setSetlistFontSize] = useState(() => parseInt(localStorage.getItem("ls_setlistFontSize") || "48"));
  const [isAutoPlay, setIsAutoPlay] = useState(() => localStorage.getItem("ls_autoPlay") === "true");

  const wakeLockRef = useRef(null);
  const lyricsRef = useRef(null);
  const scrollInterval = useRef(null);
  const startTime = useRef(null);
  const touchStartY = useRef(null);

  const currentItem = items[currentIdx];
  const isDivider = currentItem?.item_type === "divider";
  const currentSong = isDivider ? null : currentItem;

  // Bloqueio de tela (não deixa o celular apagar)
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.warn('Wake Lock error:', err.name, err.message);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current !== null) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    requestWakeLock();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, []);

  useEffect(() => {
    if (user && id) loadData();
  }, [id, user]);

  const loadData = async () => {
    // Busca dados do Setlist
    const { data: sl } = await supabase.from('setlists').select('*').eq('id', id).single();
    setSetlist(sl);

    // Busca os Itens na ordem
    const { data: setlistItems } = await supabase.from('setlist_items')
      .select('*')
      .eq('setlist_id', id)
      .order('order_index', { ascending: true });

    // Pega as Músicas referentes aos itens
    const songIds = (setlistItems || []).filter(i => i.item_type !== 'divider').map(i => i.song_id);
    const { data: songsData } = await supabase.from('songs').select('*').in('id', songIds);
    const songMap = Object.fromEntries((songsData || []).map(s => [s.id, s]));

    // Monta o array misturado (Divisores + Músicas completas)
    const mixed = (setlistItems || []).map(item => {
      if (item.item_type === "divider") {
        return { item_type: "divider", id: item.id, content: item.content || "", performance_notes: item.performance_notes || "" };
      } else {
        const song = songMap[item.song_id];
        return song ? { ...song, item_type: "song" } : null;
      }
    }).filter(Boolean);

    setItems(mixed);
  };

  const stopScroll = useCallback(() => {
    setIsPlaying(false);
    if (scrollInterval.current) {
      cancelAnimationFrame(scrollInterval.current);
      scrollInterval.current = null;
    }
  }, []);

  const startScroll = useCallback(() => {
    if (!lyricsRef.current || !currentSong || isDivider) return;
    const container = lyricsRef.current;
    const sh = container.scrollHeight - container.clientHeight;
    if (sh <= 0) return;

    const currentScroll = container.scrollTop;
    const READING_OFFSET = 64;

    const tcBlocks = currentSong.timecode_blocks;
    if (tcBlocks && tcBlocks.length > 0) {
      // Lógica de blocos de tempo (Timecodes)
      const sorted = [...tcBlocks].sort((a, b) => a.start_time - b.start_time);
      let calculatedElapsedSec = 0;

      if (currentScroll <= 10) {
        calculatedElapsedSec = 0;
      } else {
        const blockElements = Array.from(container.querySelectorAll('[data-block-id]'));
        let foundTime = false;
        for (let i = 0; i < blockElements.length; i++) {
          const el = blockElements[i];
          const blockId = el.getAttribute('data-block-id');
          const blockData = sorted.find(b => b.block_id === blockId);
          if (!blockData) continue;
          
          const blockTop = Math.max(0, el.offsetTop - READING_OFFSET);
          const blockBottom = Math.max(0, (el.offsetTop + el.offsetHeight) - READING_OFFSET);
          
          if (currentScroll >= blockTop && currentScroll <= blockBottom) {
            const progress = (currentScroll - blockTop) / Math.max(blockBottom - blockTop, 1);
            const blockDur = Math.max(blockData.end_time - blockData.start_time, 0.01);
            calculatedElapsedSec = blockData.start_time + (progress * blockDur);
            foundTime = true;
            break;
          } else if (currentScroll < blockTop) {
            const prevBlockData = i > 0 ? sorted.find(b => b.block_id === blockElements[i-1].getAttribute('data-block-id')) : null;
            calculatedElapsedSec = prevBlockData ? prevBlockData.end_time : 0;
            foundTime = true;
            break;
          }
        }
        if (!foundTime && blockElements.length > 0) {
          calculatedElapsedSec = sorted[sorted.length - 1].end_time;
        }
      }

      setElapsed(Math.floor(calculatedElapsedSec));
      const wallStart = performance.now() - (calculatedElapsedSec * 1000);
      let isTransitioning = false;
      let transitionStartScroll = 0;
      
      const animate = (now) => {
        const elapsedSec = (now - wallStart) / 1000;
        setElapsed(Math.floor(elapsedSec));

        const lastEnd = sorted[sorted.length - 1]?.end_time || 0;
        const songTotalSec = currentSong.duration_seconds || 0;
        const targetEnd = Math.max(songTotalSec, lastEnd);
        
        if (elapsedSec > targetEnd) { setIsPlaying(false); return; }

        const currentSh = container.scrollHeight - container.clientHeight;
        let activeBlock = null;
        let nextBlock = null;
        for (let i = 0; i < sorted.length; i++) {
          if (elapsedSec >= sorted[i].start_time && elapsedSec <= sorted[i].end_time) { activeBlock = sorted[i]; break; }
          if (elapsedSec < sorted[i].start_time) { nextBlock = sorted[i]; break; }
        }

        if (activeBlock) {
          isTransitioning = false;
          const el = container.querySelector(`[data-block-id="${activeBlock.block_id}"]`);
          if (el) {
            const blockTop = el.offsetTop - READING_OFFSET;
            const blockBottom = (el.offsetTop + el.offsetHeight) - READING_OFFSET;
            const sScroll = Math.max(0, Math.min(blockTop, currentSh));
            const eScroll = Math.max(0, Math.min(blockBottom, currentSh));
            const blockDur = Math.max(activeBlock.end_time - activeBlock.start_time, 0.01);
            const progress = Math.min((elapsedSec - activeBlock.start_time) / blockDur, 1);
            container.scrollTop = sScroll + (eScroll - sScroll) * progress;
          }
        } else if (nextBlock) {
          const timeToNext = nextBlock.start_time - elapsedSec;
          const preRollDur = 0.5;
          if (timeToNext <= preRollDur) {
            const el = container.querySelector(`[data-block-id="${nextBlock.block_id}"]`);
            if (el) {
              if (!isTransitioning) { isTransitioning = true; transitionStartScroll = container.scrollTop; }
              const targetScroll = Math.max(0, Math.min(el.offsetTop - READING_OFFSET, currentSh));
              const progress = 1 - (timeToNext / preRollDur);
              const easeOut = progress * (2 - progress);
              container.scrollTop = transitionStartScroll + (targetScroll - transitionStartScroll) * easeOut;
            }
          } else {
            isTransitioning = false;
          }
        }
        scrollInterval.current = requestAnimationFrame(animate);
      };
      scrollInterval.current = requestAnimationFrame(animate);
      setIsPlaying(true);

    } else {
      // Lógica Simples baseada na Duração
      if (!currentSong.duration_seconds) return;
      const durationMs = currentSong.duration_seconds * 1000;
      const currentProgress = currentScroll / sh;
      const calculatedElapsedMs = currentProgress * durationMs;
      
      startTime.current = performance.now() - calculatedElapsedMs;
      
      const animate = (now) => {
        const elapsed = now - startTime.current;
        const progress = Math.min(elapsed / durationMs, 1);
        container.scrollTop = sh * progress;
        setElapsed(Math.floor(elapsed / 1000));
        
        if (progress < 1) { scrollInterval.current = requestAnimationFrame(animate); }
        else { setIsPlaying(false); }
      };
      scrollInterval.current = requestAnimationFrame(animate);
      setIsPlaying(true);
    }
  }, [currentSong, isDivider]);

  const handlePlayStop = () => {
    if (isDivider) return;
    if (isPlaying) stopScroll();
    else startScroll();
  };

  const goToSong = (idx) => {
    stopScroll();
    setCurrentIdx(idx);
    setElapsed(0);
    setShowList(false);
    navigate(`/setlists/${id}/play/${idx}`, { replace: true });
    setTimeout(() => {
      if (lyricsRef.current) lyricsRef.current.scrollTop = 0;
    }, 50);
  };

  const goPrev = () => { if (currentIdx > 0) goToSong(currentIdx - 1); };
  const goNext = () => { if (currentIdx < items.length - 1) goToSong(currentIdx + 1); };

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchMove = (e) => {
    if (isPlaying && touchStartY.current !== null) {
      const diff = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (diff > 10) stopScroll();
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const totalDuration = currentSong?.duration_seconds || 0;

  // Auto-Play: pula para próxima música ao terminar
  useEffect(() => {
    if (isAutoPlay && !isDivider && totalDuration > 0 && elapsed >= totalDuration) {
      const nextItem = items[currentIdx + 1];
      if (nextItem && nextItem.item_type !== "divider") {
        const timer = setTimeout(() => { goNext(); }, 1500);
        return () => clearTimeout(timer);
      } else {
        stopScroll();
      }
    }
  }, [elapsed, totalDuration, isAutoPlay, currentIdx, items, isDivider]);

  const prevItem = items[currentIdx - 1];
  const nextItem = items[currentIdx + 1];
  const prevLabel = prevItem ? (prevItem.item_type === "divider" ? `— ${prevItem.content}` : prevItem.title) : "—";
  const nextLabel = nextItem ? (nextItem.item_type === "divider" ? `— ${nextItem.content}` : nextItem.title) : "—";

  let listSongNum = 0;

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden overscroll-y-none z-50">
      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/95 z-20 flex flex-col px-6 py-10">
          <div className="flex items-center justify-between mb-10">
            <span className="font-bold text-2xl uppercase tracking-widest">Configurações</span>
            <button onClick={() => setShowSettings(false)} className="w-16 h-16 flex items-center justify-center text-white/60 hover:text-white bg-white/10 rounded-2xl">
              <X size={28} />
            </button>
          </div>
          <div className="space-y-10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-xl text-white/60 font-bold">Tamanho da fonte (letra)</label>
                <span className="text-2xl font-black">{fontSize}px</span>
              </div>
              <input type="range" min="14" max="64" step="1" value={fontSize}
                onChange={e => { const v = parseInt(e.target.value); setFontSize(v); localStorage.setItem("ls_fontSize", v); }}
                className="w-full accent-white h-4 rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-xl text-white/60 font-bold">Espaço entre linhas</label>
                <span className="text-2xl font-black">{lineHeight.toFixed(1)}</span>
              </div>
              <input type="range" min="1.2" max="3.0" step="0.1" value={lineHeight}
                onChange={e => { const v = parseFloat(e.target.value); setLineHeight(v); localStorage.setItem("ls_lineHeight", v); }}
                className="w-full accent-white h-4 rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-xl text-white/60 font-bold">Tamanho do texto no setlist</label>
                <span className="text-2xl font-black">{setlistFontSize}px</span>
              </div>
              <input type="range" min="24" max="128" step="2" value={setlistFontSize}
                onChange={e => { const v = parseInt(e.target.value); setSetlistFontSize(v); localStorage.setItem("ls_setlistFontSize", v); }}
                className="w-full accent-white h-4 rounded-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-safe-top">
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => { stopScroll(); navigate(-1); }}
            className="w-14 h-14 flex items-center justify-center text-white/50 hover:text-white active:opacity-60"
          >
            <ChevronLeft size={32} className="pointer-events-none" />
          </button>
          <div className="flex items-center gap-3">
            {!isDivider && (
              <p className={`text-base md:text-lg font-black tracking-widest tabular-nums mt-1 ${isPlaying ? 'text-[#00FF00]' : 'text-red-500'}`}>
                {totalDuration > 0 ? `${formatTime(Math.min(elapsed, totalDuration))} / ${formatTime(totalDuration)}` : "—"}
              </p>
            )}
            <button
              onClick={() => {
                const v = !isAutoPlay;
                setIsAutoPlay(v); 
                localStorage.setItem("ls_autoPlay", v);
              }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${isAutoPlay ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/40'}`}
              title="Auto-Play Próxima Música"
            >
              <Zap size={20} fill={isAutoPlay ? "black" : "none"} className="pointer-events-none" />
            </button>
            <button onClick={() => setShowList(!showList)} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center active:scale-95 transition-transform text-black">
              <IconSetlist />
            </button>
            <button onClick={() => setShowSettings(true)} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center active:scale-95 transition-transform text-black">
               <IconSettings />
            </button>
          </div>
        </div>
        <div className="border-b border-white/10" />
        <div className="flex items-center justify-between py-3">
          <h2 className="text-xl font-black uppercase tracking-wide truncate">
            {isDivider ? currentItem?.content : (currentSong?.title || "Carregando...")}
          </h2>
          <span className="text-sm text-white/40 flex-shrink-0 ml-3 font-bold">
            {items.length > 0 ? `${currentIdx + 1}/${items.length}` : ""}
          </span>
        </div>
      </div>

      {/* Song List Overlay */}
      {showList && (
        <div className="absolute inset-0 bg-black z-20 flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
            <span className="font-bold text-sm uppercase tracking-widest">{setlist?.event_name}</span>
             <button onClick={() => setShowList(false)} className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white active:opacity-60 transition-colors">
              <X size={22} className="pointer-events-none" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {items.map((item, idx) => {
              if (item.item_type === "divider") {
                return (
                  <div key={item.id || idx} className="flex items-center justify-center py-3 px-4">
                     <div className="bg-white/10 rounded-full px-5 py-1.5">
                      <span className="text-white/60 text-xs font-black uppercase tracking-widest">{item.content}</span>
                    </div>
                  </div>
                );
              } else {
                listSongNum++;
                return (
                  <button
                    key={item.id || idx}
                    onClick={() => goToSong(idx)}
                    className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-colors ${idx === currentIdx ? "bg-white/10" : "hover:bg-white/5"}`}
                   >
                    <span className="text-white/30 text-xl w-8 text-right flex-shrink-0 font-bold">{listSongNum}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black uppercase tracking-wide truncate leading-tight" style={{ fontSize: `${setlistFontSize}px` }}>{item.title}</p>
                       <p className="text-white/40 uppercase truncate mt-0.5" style={{ fontSize: `${Math.round(setlistFontSize * 0.5)}px` }}>{item.artist}</p>
                    </div>
                  </button>
                );
              }
            })}
          </div>
        </div>
      )}

      {/* Main content area */}
      {isDivider ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="border-4 border-white/20 rounded-3xl p-10 mb-8">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-widest text-white">
              {currentItem?.content}
            </h2>
          </div>
          {currentItem?.performance_notes && (
             <div className="max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-yellow-400 font-bold uppercase tracking-widest text-xs mb-3">Nota de Performance</p>
              <p className="text-white text-xl md:text-2xl font-medium leading-relaxed">{currentItem.performance_notes}</p>
            </div>
          )}
        </div>
      ) : (
        <div
          ref={lyricsRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className="flex-1 overflow-y-auto px-4 py-2 scrollbar-none relative"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}
        >
          <div
            className="whitespace-pre-wrap font-sans text-white leading-relaxed pt-[64px] pb-[50vh]"
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
          >
            {currentSong?.timecode_blocks?.length > 0
              ? [...currentSong.timecode_blocks]
                  .sort((a, b) => a.start_time - b.start_time)
                  .map((block) => {
                    const isActive = elapsed >= block.start_time && elapsed <= block.end_time;
                    return (
                       <div
                        key={block.block_id}
                        data-block-id={block.block_id}
                        className={`mb-16 transition-all duration-300 ease-in-out ${isActive ? "text-white font-black opacity-100" : "text-white/30 font-normal"}`}
                        style={{ fontSize: isActive ? `${fontSize + 5}px` : `${fontSize}px` }}
                      >
                        {block.text_content}
                       </div>
                    );
                  })
              : (currentSong?.lyrics_text || "Sem letra cadastrada.")
            }
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex-shrink-0 px-4 pb-safe-bottom pb-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="flex-1 min-h-[56px] bg-white/10 rounded-2xl text-sm md:text-base font-bold text-center disabled:opacity-20 hover:bg-white/20 transition-all truncate px-2 active:scale-95"
          >
             <span className="pointer-events-none">{prevLabel}</span>
          </button>

          {/* Botão Central de Play/Pause */}
          <div className="w-20 md:w-24 flex-shrink-0 flex items-center justify-center">
            {!isDivider && (
              <button
                onClick={handlePlayStop}
                className={`w-full h-14 rounded-2xl flex items-center justify-center transition-colors active:scale-95 ${isPlaying ? 'bg-[#00FF00]' : 'bg-red-600'}`}
              >
                <div className="text-white flex items-center justify-center pointer-events-none">
                  {isPlaying ? <IconPause /> : <IconPlay />}
                </div>
              </button>
            )}
          </div>

          <button
            onClick={goNext}
            disabled={currentIdx >= items.length - 1}
            className="flex-1 min-h-[56px] bg-white/10 rounded-2xl text-sm md:text-base font-bold text-center disabled:opacity-20 hover:bg-white/20 transition-all truncate px-2 active:scale-95"
          >
            <span className="pointer-events-none">{nextLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}