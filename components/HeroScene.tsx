import { Activity, FileCheck2, GraduationCap, ShieldCheck } from "lucide-react";

const NODES = [
  { label: "Score", value: "620", className: "scene-node scene-node-a" },
  { label: "Rank", value: "AIR", className: "scene-node scene-node-b" },
  { label: "Quota", value: "AIQ", className: "scene-node scene-node-c" },
  { label: "Plan", value: "Ready", className: "scene-node scene-node-d" },
];

export function HeroScene() {
  return (
    <div className="hero-scene" aria-hidden="true">
      <div className="scene-grid" />
      <div className="scene-orbit scene-orbit-one" />
      <div className="scene-orbit scene-orbit-two" />
      <div className="scene-core">
        <GraduationCap />
        <span>MBBS</span>
      </div>
      {NODES.map((node) => (
        <div key={node.label} className={node.className}>
          <span>{node.label}</span>
          <strong>{node.value}</strong>
        </div>
      ))}
      <div className="scene-panel scene-panel-left">
        <Activity />
        <span>Round strategy</span>
      </div>
      <div className="scene-panel scene-panel-right">
        <ShieldCheck />
        <span>Risk checked</span>
      </div>
      <div className="scene-panel scene-panel-bottom">
        <FileCheck2 />
        <span>Documents mapped</span>
      </div>
    </div>
  );
}
