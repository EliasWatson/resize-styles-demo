import './App.css';
import React, {useCallback, useRef, useState} from 'react';
import {Stage} from "@inlet/react-pixi";
import {Channel} from "./Channel";
import {nodeLowerRange, nodeUpperRange} from "./bitwise";

const CANVAS_WIDTH: number = 900;
const CANVAS_HEIGHT: number = 600;

const MIN_HEIGHT: number = 16;

type ResizeStyle = "absolute" | "relative" | "neighbor" | "bsp";

type DragState = {
  channelIndex: number;
  pointerOffset: number;
};

export const App: React.FC = () => {
  const [resizeStyle, setResizeStyle] = useState<ResizeStyle>("absolute");
  const [channelCount, _setChannelCount] = useState(8);
  const [channelHeights, setChannelHeights] = useState<number[]>([]);

  const dragStateRef = useRef<DragState | undefined>(undefined);

  if (channelHeights.length > channelCount) {
    setChannelHeights(channelHeights.slice(0, channelCount));
  } else if (channelHeights.length < channelCount) {
    const newHeights =
      new Array(channelCount - channelHeights.length)
      .fill(CANVAS_HEIGHT / channelCount);

    setChannelHeights([...channelHeights, ...newHeights]);
  }

  let y = 0;
  const channelYs = channelHeights.map((height) => {
    y += height;
    return y - height;
  });

  const channels = channelHeights.map((height, i) => (
    <Channel
      key={`${i}`}
      y={channelYs[i]}
      width={CANVAS_WIDTH}
      height={height}
      color={i % 2 === 0 ? 0x880022 : 0x228800}
    />
  ));

  const onPointerDown = (e: React.PointerEvent) => {
    let channelIndex = channelYs.findIndex(
      (y, i) => e.clientY >= y && e.clientY <= y + channelHeights[i]
    );
    if (channelIndex === -1) return;

    // Check if on the top half of the channel
    if (e.clientY < channelYs[channelIndex] + (channelHeights[channelIndex] / 2)) {
      if (channelIndex === 0) return;

      channelIndex -= 1;
    }

    if (channelIndex === channelCount - 1) {
      if (resizeStyle === "neighbor" || resizeStyle === "bsp") {
        return;
      }
    }

    const channelY = channelYs[channelIndex];
    const channelHeight = channelHeights[channelIndex];
    const channelBottomY = channelY + channelHeight;

    dragStateRef.current = {
      channelIndex,
      pointerOffset: channelBottomY - e.clientY,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStateRef.current === undefined) return;
    const { channelIndex, pointerOffset } = dragStateRef.current;

    const channelY = channelYs[channelIndex];
    const channelHeight = channelHeights[channelIndex];
    const channelBottomY = channelY + channelHeight;

    const newChannelBottomY = e.clientY + pointerOffset;
    let heightDelta = newChannelBottomY - channelBottomY;
    let newHeight = Math.max(MIN_HEIGHT, channelHeight + heightDelta);
    heightDelta = newHeight - channelHeight;

    let newHeights = [...channelHeights];

    if (resizeStyle === "absolute") {
      newHeights[channelIndex] = newHeight;
    } else if (resizeStyle === "relative") {
      const requiredHeightByOthers = (channelCount - 1) * MIN_HEIGHT;
      const maxHeight = CANVAS_HEIGHT - requiredHeightByOthers;
      newHeight = Math.min(maxHeight, newHeight);
      newHeights[channelIndex] = newHeight;

      const channelsSortedAscByHeight = channelHeights
        .map((_height, i) => i)
        .sort((a, b) => channelHeights[a] - channelHeights[b]);

      let heightSum = newHeights.reduce(
        (sum, n, i) => i !== channelIndex ? sum + n : sum,
        0
      );
      let remainingHeight = CANVAS_HEIGHT - newHeight;

      for (const i of channelsSortedAscByHeight) {
        if (i === channelIndex) continue;

        const heightScale = remainingHeight / heightSum;
        const newHeight2 = Math.max(MIN_HEIGHT, newHeights[i] * heightScale);

        heightSum -= newHeight2;
        remainingHeight -= newHeight2;

        newHeights[i] = newHeight2;
      }
    } else if (resizeStyle === "neighbor") {
      const neighborIndex = channelIndex + 1;
      const neighborHeight = channelHeights[neighborIndex];

      newHeights[neighborIndex] = neighborHeight - heightDelta;
      newHeights[channelIndex] = newHeight;
    } else if (resizeStyle === "bsp") {
      const [lowerStart, lowerEnd] = nodeLowerRange(channelIndex);
      const [upperStart, upperEnd] = nodeUpperRange(channelIndex);

      const lowerCount = (lowerEnd - lowerStart) + 1;
      const upperCount = (upperEnd - upperStart) + 1;

      const lowerDeltaPer = heightDelta / lowerCount;
      const upperDeltaPer = -heightDelta / upperCount;

      for (let i = lowerStart; i <= lowerEnd; i++) {
        newHeights[i] = channelHeights[i] + lowerDeltaPer;
      }

      for (let i = upperStart; i <= upperEnd; i++) {
        newHeights[i] = channelHeights[i] + upperDeltaPer;
      }
    }

    setChannelHeights(newHeights);
  };

  const onPointerUp = useCallback(() => {
    dragStateRef.current = undefined;
  }, []);

  const onReset = useCallback(() => {
    setChannelHeights((currHeights) => [...currHeights].fill(CANVAS_HEIGHT / currHeights.length));
  }, []);

  return (
    <div>
      <Stage
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {channels}
      </Stage>
      <div style={{display: "flex", flexDirection: "row", gap: "8px"}}>
        <button onClick={() => setResizeStyle("absolute")}>Absolute</button>
        <button onClick={() => setResizeStyle("relative")}>Relative</button>
        <button onClick={() => setResizeStyle("neighbor")}>Neighbor</button>
        <button onClick={() => setResizeStyle("bsp")}>BSP</button>
        <div>{resizeStyle}</div>
        <div style={{flexGrow: "1"}}></div>
        <button onClick={onReset}>Reset</button>
      </div>
    </div>
  );
};
