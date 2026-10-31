import './app.css';
import App from './App.svelte';
import { mount } from 'svelte';

const target = document.getElementById('app');
if (!target) throw new Error('App mount element was not found.');

export default mount(App, { target });
