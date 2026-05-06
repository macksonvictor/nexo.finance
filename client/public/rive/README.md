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

Temporary test file:

```txt
client/public/rive/nexo-mascot.riv
```

While testing marketplace Rive files, `stateMachine` can stay `null` and the app
plays timeline animations by name.

Final state machine name:

```txt
NEXO_StateMachine
```

Fallback accepted name:

```txt
NexoMascot
```

Final inputs:

```txt
mood: number
intensity: number
hovered: boolean
blink: trigger
```

Mood values:

```txt
0 idle
1 processing
2 responding
3 alert
4 reading
5 surprised
6 confident
```

Intensity values:

```txt
0 soft
1 hero
```

Guidelines:

```txt
No square/background layer in the Rive file.
The app owns the background.
Keep the cube clean and isolated.
Use hover/tap to grow slightly and blink.
Use responding for mouth movement during AI output.
```
