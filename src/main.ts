import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initSky } from './background/sky';
import { initRuler } from './background/ruler';
import { initHero } from './scenes/hero';
import { initCh1 } from './scenes/ch1-height';
import { initCh2 } from './scenes/ch2-speed';

gsap.registerPlugin(ScrollTrigger);
initSky();
initRuler();

const hero = document.querySelector<HTMLElement>('#hero');
if (hero) initHero(hero);

const ch1 = document.querySelector<HTMLElement>('#ch1');
if (ch1) initCh1(ch1);

const ch2 = document.querySelector<HTMLElement>('#ch2');
if (ch2) initCh2(ch2);
