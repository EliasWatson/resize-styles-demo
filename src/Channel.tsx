import React from "react";
import * as Pixi from "pixi.js";
import {Graphics} from "@inlet/react-pixi";

export type ChannelProps = {
  y: number;
  width: number;
  height: number;
  color: number;
};

export const Channel: React.FC<ChannelProps> = ({
  y,
  width,
  height,
  color
}) => {
  const draw = (g: Pixi.Graphics) => {
    g.clear();
    g.beginFill(color);
    g.drawRect(0, 0, width, height);
    g.endFill();
  };

  return <Graphics y={y} draw={draw} />
};