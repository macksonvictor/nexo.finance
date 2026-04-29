# Nexo IA Rive mascot

Place the exported Rive file here:

```txt
client/public/rive/nexo-mascot.riv
```

When the file exists, enable it in:

```txt
client/src/lib/nexoAIMotion.ts
```

Use:

```ts
asset: "/rive/nexo-mascot.riv"
```

## Runtime contract

State machine name:

```txt
NexoMascot
```

Inputs:

```txt
mood: number
intensity: number
hovered: boolean
blink: trigger
```

Mood values:

```txt
0 idle
1 reading
2 processing
3 responding
4 alert
5 confident
6 curious
```

Intensity values:

```txt
0 soft
1 hero
```

Guidelines:

```txt
No background glow, rings, aura, blur, or radial light in the Rive file.
Keep the cube clean and isolated.
Use hover/tap to grow slightly and blink.
Use responding for mouth movement during AI output.
```
