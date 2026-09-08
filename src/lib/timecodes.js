export function validTimecodes(raw) {
  try {
    const blocks = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(blocks) || !blocks.length) return [];
    let end = 0;
    for (const block of blocks) {
      if (!Number.isFinite(block.start_time) || !Number.isFinite(block.end_time) || block.start_time < end || block.end_time <= block.start_time) return [];
      end = block.end_time;
    }
    return blocks;
  } catch { return []; }
}
