import { render } from 'preact';
import { App } from '@/popup/App';
import '@/popup/styles/global.css';

render(<App />, document.getElementById('root')!);
