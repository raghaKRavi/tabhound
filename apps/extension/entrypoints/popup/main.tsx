import { render } from 'preact';
import { App } from '@/popup/App';
import '@/popup/styles/global.css';

const root = document.getElementById('root')!;
root.textContent = ''; // drop the static loading spinner from index.html
render(<App />, root);
