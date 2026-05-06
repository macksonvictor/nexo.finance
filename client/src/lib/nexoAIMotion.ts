import type { NexoBrainRiveState } from "@shared/riveState";
import {
  NEXO_MASCOT_ALIAS_STATE,
  NEXO_MASCOT_LOTTIE_TIMELINES,
  NEXO_MASCOT_STATE_LOOPS,
  NEXO_MASCOT_STATE_SPEEDS,
  NEXO_MASCOT_STATE_TIMELINES,
  type NexoMascotAlias,
  type NexoMascotMood,
} from "./mascotMotion";

export type NexoAIMotionEngine = "css" | "rive" | "lottie";

export type NexoAIMascotAlias = NexoMascotAlias;

export type NexoAIMascotMood = NexoMascotMood;

export type NexoAIMotionIntensity = "soft" | "hero";

export type NexoAIMascotStateSpec = {
  label: string;
  purpose: string;
  cubeBehavior: string;
  faceBehavior: string;
  motionNotes: string;
};

export const NEXO_AI_MASCOT_STATES = {
  idle: {
    label: "Repouso",
    purpose: "Presenca calma quando a IA esta pronta para ouvir.",
    cubeBehavior: "Cubo estavel, com respiracao quase imperceptivel quando houver motor de animacao.",
    faceBehavior: "Olhos relaxados e sorriso pequeno, sem chamar atencao.",
    motionNotes: "Loop lento, 6 a 8 segundos, sem brilho externo.",
  },
  reading: {
    label: "Leitura",
    purpose: "Mostra que a IA recebeu o texto e esta interpretando o contexto.",
    cubeBehavior: "Cubo levemente inclinado para frente, como se estivesse atento.",
    faceBehavior: "Olhos focados e sorriso neutro, com uma piscada curta.",
    motionNotes: "Micro movimento horizontal dos olhos; nao usar aura nem fundo.",
  },
  processing: {
    label: "Processando",
    purpose: "Estado de pensamento enquanto a resposta esta sendo gerada.",
    cubeBehavior: "Cubo faz um ciclo sutil de pausa, inclinacao e retorno.",
    faceBehavior: "Expressao concentrada, olhos menores e boca quase reta.",
    motionNotes: "Loop medio, 2 a 3 segundos, com easing macio.",
  },
  responding: {
    label: "Respondendo",
    purpose: "Indica que a IA esta transmitindo a resposta ao usuario.",
    cubeBehavior: "Cubo acompanha o ritmo da fala com pequenos pulsos internos no proprio corpo.",
    faceBehavior: "Boca alterna discretamente entre sorriso e fala.",
    motionNotes: "Animacao sincronizavel com streaming; sem particulas externas.",
  },
  alert: {
    label: "Alerta",
    purpose: "Chama atencao para erro, risco ou ponto financeiro importante.",
    cubeBehavior: "Cubo para, contrai um pouco e volta, como um aviso firme.",
    faceBehavior: "Olhos mais abertos e boca neutra/seria.",
    motionNotes: "Movimento curto, uma vez; evitar tremor agressivo.",
  },
  confident: {
    label: "Confianca",
    purpose: "Marca resposta assertiva, recomendacao clara ou confirmacao.",
    cubeBehavior: "Cubo sobe poucos pixels e assenta com firmeza.",
    faceBehavior: "Sorriso seguro e olhos estaveis.",
    motionNotes: "Animacao de 700 a 900 ms, sem loop continuo.",
  },
  surprised: {
    label: "Surpresa / curiosidade",
    purpose: "Reage a input inesperado, incompleto ou fora do padrao.",
    cubeBehavior: "Cubo inclina de lado de forma simpatica.",
    faceBehavior: "Olhos levemente maiores e boca pequena de curiosidade.",
    motionNotes: "Uma inclinacao curta seguida de retorno ao repouso.",
  },
} satisfies Record<NexoBrainRiveState, NexoAIMascotStateSpec>;

export const NEXO_AI_MASCOT_STATE_ALIASES = NEXO_MASCOT_ALIAS_STATE;

export const NEXO_AI_MOTION_MANIFEST = {
  engine: "lottie",
  version: "lottie-mono-v1",
  rive: {
    // Temporary mascot file. The final NEXO cube should keep this same input contract.
    asset: "/rive/nexo-mascot.riv",
    // Keep null while using marketplace/test .riv files that only expose timelines.
    // The final mascot should expose "NEXO_StateMachine" or "NexoMascot".
    stateMachine: null,
    animations: {
      idle: "Listening",
      processing: "Thinking",
      responding: "Speaking",
      alert: "Thinking",
      reading: "Loading Start",
      surprised: "Loading & speaking",
      confident: "Listening",
    },
    inputs: {
      mood: "mood",
      intensity: "intensity",
      hovered: "hovered",
      blink: "blink",
    },
  },
  lottie: {
    asset: "nexo-ai-mascot-orb",
    contentScale: 2.05,
    jumpContentScale: 2.05,
    idleFrame: 31,
    timelines: NEXO_MASCOT_LOTTIE_TIMELINES,
    stateTimelines: NEXO_MASCOT_STATE_TIMELINES,
    segments: {
      idle: NEXO_MASCOT_LOTTIE_TIMELINES.idle,
      reading: NEXO_MASCOT_LOTTIE_TIMELINES.thinking,
      processing: NEXO_MASCOT_LOTTIE_TIMELINES.thinking,
      responding: NEXO_MASCOT_LOTTIE_TIMELINES.yes,
      alert: NEXO_MASCOT_LOTTIE_TIMELINES.alert,
      surprised: NEXO_MASCOT_LOTTIE_TIMELINES.no,
      confident: NEXO_MASCOT_LOTTIE_TIMELINES.yes,
    },
    loop: NEXO_MASCOT_STATE_LOOPS,
    speed: NEXO_MASCOT_STATE_SPEEDS,
  },
} as const;

export function resolveMascotMotionEngine(
  engine?: NexoAIMotionEngine
): NexoAIMotionEngine {
  return engine ?? NEXO_AI_MOTION_MANIFEST.engine;
}
