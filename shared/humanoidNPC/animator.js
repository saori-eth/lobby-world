import { walk } from "./animations/walk.js";
import { run } from "./animations/run.js";
import { idle } from "./animations/idle.js";
import { wave } from "./animations/wave.js";
import { dance } from "./animations/dance.js";
import { attack } from "./animations/attack.js";

const emoteMap = ["walk", "run", "idle", "wave", "dance", "attack"];

export function createAnimator(armature) {
  const { bones, resetToRest } = armature;

  const animations = {
    walk: walk(bones),
    run: run(bones),
    idle: idle(bones),
    wave: wave(bones),
    dance: dance(bones),
    attack: attack(bones),
  };

  let time = 0;
  let current = "idle";

  function play(name) {
    if (name === current) return;
    current = name;
    resetToRest();
  }

  function setEmote(idx) {
    play(emoteMap[idx != null ? idx : 2] || "idle");
  }

  function update(delta) {
    time += delta;
    const anim = animations[current];
    if (anim) anim.update(time);
  }

  return { play, setEmote, update };
}
