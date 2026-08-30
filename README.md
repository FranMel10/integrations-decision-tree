# Integrations Decision Tree

Árbol de decisión interactivo para el flujo de soporte de **Integraciones**
(Support Contact Flow for Integration Concerns). Pensado como herramienta
interna para que el agente navegue el caso haciendo clic en vez de leer todo
el diagrama, con miras a integrarse después a Intercom.

## Cómo correrlo local

```bash
npm install
npm run dev
```

Abrir http://localhost:3000

## Estructura

- `lib/decisionTree.ts` — toda la data del árbol (nodos, opciones, links,
  tags de a quién se escala). **Este es el archivo que se edita** para
  agregar, corregir o expandir ramas — no hace falta tocar el componente.
- `components/DecisionTree.tsx` — la lógica de navegación (breadcrumb,
  avanzar, volver, reiniciar).
- `app/` — layout y página de Next.js (App Router).

## Cómo agregar un nuevo caso o rama

Editar `lib/decisionTree.ts`:

1. Agregar un nuevo objeto al `decisionTree` con un `id` único.
2. Desde el nodo padre, agregar en su array `options` un
   `{ label: "texto del botón", nextId: "id-del-nuevo-nodo" }`.
3. Si el nodo es un punto final del flujo, marcá `isTerminal: true`.

No hace falta reiniciar nada más — Next.js recarga en caliente en dev.

## Deploy

Igual que `ccr-assist`: push a un repo de GitHub y conectarlo a Vercel
(o `vercel --prod` desde la CLI). No requiere variables de entorno ni
backend — todo el árbol vive en el bundle del frontend.

## Roadmap sugerido

- Agregar más flujos aparte de Integraciones (mismo patrón de archivo,
  un `decisionTree` por flujo o una sola data con más ramas).
- Exportar el JSON de `decisionTree` para alimentar un flow de Intercom.
- Buscador rápido para saltar directo a un nodo sin navegar paso a paso.
