export type NexoAIMotionEngine = "css" | "rive" | "lottie";

export type NexoAIMascotMood =
  | "idle"
  | "reading"
  | "processing"
  | "responding"
  | "alert"
  | "confident"
  | "curious"
  | "thinking"
  | "speaking"
  | "listening";

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
  curious: {
    label: "Surpresa / curiosidade",
    purpose: "Reage a input inesperado, incompleto ou fora do padrao.",
    cubeBehavior: "Cubo inclina de lado de forma simpatica.",
    faceBehavior: "Olhos levemente maiores e boca pequena de curiosidade.",
    motionNotes: "Uma inclinacao curta seguida de retorno ao repouso.",
  },
} satisfies Record<
  Exclude<NexoAIMascotMood, "thinking" | "speaking" | "listening">,
  NexoAIMascotStateSpec
>;

export const NEXO_AI_MASCOT_STATE_ALIASES = {
  thinking: "processing",
  speaking: "responding",
  listening: "idle",
} satisfies Record<"thinking" | "speaking" | "listening", keyof typeof NEXO_AI_MASCOT_STATES>;

export const NEXO_AI_MOTION_MANIFEST = {
  engine: "rive",
  version: "rive-ready-v1",
  rive: {
    // Keep null until the exported file exists. When ready, use "/rive/nexo-mascot.riv".
    asset: null,
    stateMachine: "NexoMascot",
    inputs: {
      mood: "mood",
      intensity: "intensity",
      hovered: "hovered",
      blink: "blink",
    },
  },
  lottie: {
    idle: null,
    reading: null,
    processing: null,
    responding: null,
    alert: null,
    confident: null,
    curious: null,
    thinking: null,
    speaking: null,
    listening: null,
  },
} as const;

export function resolveMascotMotionEngine(
  engine?: NexoAIMotionEngine
): NexoAIMotionEngine {
  return engine ?? NEXO_AI_MOTION_MANIFEST.engine;
}
