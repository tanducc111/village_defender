import './styles.css';

import { Game } from './core/Game';

const rootElement = document.querySelector<HTMLDivElement>('#app');

if (rootElement === null) {
  throw new Error('Village Defender requires an #app element to mount.');
}

const game = new Game(rootElement);

game.start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';

  rootElement.innerHTML = `<main class="boot-screen">Failed to start Village Defender: ${message}</main>`;
});
