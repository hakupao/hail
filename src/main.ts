import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initSky } from './background/sky';
import { initRuler } from './background/ruler';
import { initHero } from './scenes/hero';

gsap.registerPlugin(ScrollTrigger);
initSky();
initRuler();

const hero = document.querySelector<HTMLElement>('#hero');
if (hero) initHero(hero);
