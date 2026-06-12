import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initSky } from './background/sky';
import { initRuler } from './background/ruler';

gsap.registerPlugin(ScrollTrigger);
initSky();
initRuler();
