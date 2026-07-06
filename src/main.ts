import './styles.css';

const rootElement = document.querySelector<HTMLDivElement>('#app');

if (rootElement === null) {
  throw new Error('Village Defender requires an #app element to mount.');
}

rootElement.innerHTML = '<main class="boot-screen">Village Defender setup complete.</main>';
