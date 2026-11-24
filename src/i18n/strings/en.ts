import type { Dict } from '../apply';

// 英文译文。键与 index.html 的 data-i18n / data-i18n-attr 一一对应（tests/i18n.test.ts 核对）。
// 标点只用 ASCII 与 en dash（–）：Fredoka 的 unicode-range 不含 em dash 和弯引号，会掉到系统字体。
export const en: Dict = {
  'meta.title': 'The Birth and Fall of a Hailstone',
  'meta.desc':
    'Understand hail through animation: it forms 5–10 km up, lands at v ∝ √d, turns dangerous at ⌀2 cm – plus a hail lab where you tune the storm yourself.',

  'hero.title': 'The Birth and Fall of a Hailstone',
  'num.height': 'Birth altitude',
  'num.speed': 'Impact speed',
  'num.danger': 'Danger starts',
  'hero.card1': 'Forms in the "growth zone", high inside a cumulonimbus cloud',
  'hero.card2': 'The bigger it is, the faster it falls: {f}',
  'hero.card3': 'Coin-sized hail can already hurt people',
  'hero.scroll': 'Scroll down and fall with it',

  'ch1.title': '<span class="ch-no">Chapter 1</span>Birth altitude: 5–10&nbsp;km',
  'ch1.s1.h': 'The growth zone sits high in the cloud',
  'ch1.s1.p':
    'Hail forms inside vigorous cumulonimbus clouds. The cloud base may be only 1–2 km up, but the real "growth zone" is in the middle and upper cloud, where it is −10℃ to −30℃ – roughly 5–10 km above the ground in summer.',
  'ch1.s2.h': 'One loop, one layer of ice',
  'ch1.s2.p':
    'The updraft lifts a hail embryo again and again, and every loop through the cloud adds another layer of ice. Slice one open and it looks like an onion: each ring is one loop.',
  'ch1.s3.h': 'Stronger updraft, bigger hail',
  'ch1.s3.p': 'The stronger the updraft, the bigger the hailstones it can hold up.',
  'ch1.s4.h': 'Too small? It melts into rain',
  'ch1.s4.p':
    'Stones that are too small melt into rain once they fall through the 0℃ level (about 4–5 km). The ones that reach the ground are usually already a decent size.',
  'ch1.svg':
    'Cross-section of a cumulonimbus cloud. The vertical axis runs from 0 to 12 km with matching temperatures; the cloud base is about 1.5 km and the anvil top about 11.5 km; the 0℃ line is at 4.5 km; the growth zone spans about 5 to 10 km. In the growth zone the updraft carries a hail embryo around a looping path four times, adding a layer of ice each loop; sliced open, it shows four onion-like rings of alternating clear and opaque ice. A stone that is too small falls past the 0℃ line and turns into a raindrop.',
  'ch1.zone': 'Growth zone',
  'ch1.zoneTemp': '−10 to −30℃',
  'ch1.zoneKm': 'about 5–10 km',
  'ch1.updraft': 'Updraft',
  'ch1.cloudBase': 'Cloud base 1–2 km',
  'ch1.onion1': 'Onion-like inside',
  'ch1.onion2': '1 ring = 1 loop',
  'ch1.axisTemp': 'Temp',

  'ch2.title': '<span class="ch-no">Chapter 2</span>Impact speed: {f}',
  'ch2.lead':
    'As it falls, gravity and air drag quickly balance out and the stone reaches its "terminal velocity". Mass grows with the cube of the diameter, but the area facing the wind only grows with the square – so <span class="formula">{f}: the bigger it is, the faster it falls</span>.',
  'ch2.mathTitle': "Let's derive it",
  'ch2.leg.rhoIce': 'density of ice',
  'ch2.leg.rhoAir': 'density of air',
  'ch2.leg.cd': 'drag coefficient',
  'ch2.leg.g': 'gravitational acceleration',
  'ch2.leg.d': 'diameter',
  'ch2.mathNote':
    'For the proportionality we treat the first three as constants. In reality the drag coefficient changes with size and shape, so speed does not follow this formula exactly.',
  'obj.bean': 'Pea',
  'obj.pingpong': 'Ping-pong ball',
  'obj.golf': 'Golf ball',
  'obj.golfball': 'Golf ball',
  'obj.softball': 'Softball',
  'lane.bean': 'Pea',
  'lane.pingpong': 'Ping-pong',
  'lane.golf': 'Golf ball',
  'lane.softball': 'Softball',
  'ch2.replay': 'Race again',
  'ch2.raceLegend':
    'Four hailstones drop from the same height at the same moment. A full speed bar under each reading is 160 km/h; the two marks are <b>60</b> city driving and <b>120</b> highway.',
  'ch2.chartTitle': 'Bigger stones fall faster',
  'ch2.chartAria':
    'Chart of hail diameter against impact speed. The horizontal axis is diameter from 0 to 8 cm; the vertical axis is speed from 0 to 45 m/s. The curve is the simplified law v ∝ √d; four dots show typical values for each size – pea 1 cm, ping-pong ball 2.5 cm, golf ball 4.5 cm, softball 7.5 cm – with speed rising in that order. Two dashed reference lines: city driving 60 km/h and highway 120 km/h.',
  'ch2.axisY': 'Speed (m/s)',
  'ch2.axisX': 'Diameter (cm)',
  'ch2.ref60': 'City driving 60 km/h',
  'ch2.ref120': 'Highway 120 km/h',
  'ch2.chartCaption':
    'The curve is the simplified law (calibrated on 2–3 cm hail); the dots are typical values for each size. Large hail really falls faster than the curve, so dots sitting off the line are expected. The dashed lines are two reference speeds.',
  'ch2.th.d': 'Diameter',
  'ch2.th.ref': 'About the size of',
  'ch2.th.v': 'Impact speed',
  'ch2.th.danger': 'Danger',
  'ch2.row1.ref': 'Pea to fingernail',
  'ch2.row1.kmh': '(35 km/h)',
  'ch2.row1.danger': 'Stings, mostly harmless',
  'ch2.row2.ref': 'Coin to ping-pong ball',
  'ch2.row2.kmh': '(50–70 km/h)',
  'ch2.row2.danger': 'Bruises, eye injuries',
  'ch2.row3.ref': 'Golf ball',
  'ch2.row3.kmh': '(about 100 km/h)',
  'ch2.row3.danger': 'Head cuts, concussion risk',
  'ch2.row4.ref': 'Baseball to softball',
  'ch2.row4.kmh': '(130–160 km/h)',
  'ch2.row4.danger': 'Can be fatal',
  'ch2.tableNote': 'Values depend on shape, density and wind; these are typical ranges.',

  'ch3.title': '<span class="ch-no">Chapter 3</span>Danger threshold: ⌀2&nbsp;cm and up',
  'ch3.lead':
    "Many countries use 2–2.5 cm as the threshold for severe thunderstorm warnings – and that number wasn't picked at random.",
  'ch3.threshold': '2 cm warning threshold',
  'ch3.harm1': 'Mostly harmless',
  'ch3.harm2': 'Can bruise',
  'ch3.harm3': 'Concussion risk',
  'ch3.harm4': 'Can be fatal',
  'ch3.energyTitle': 'Feel it as kinetic energy',
  'ch3.mathTitle': 'Working out the energy',
  'ch3.mathNote':
    'Ice density is taken as 0.9 g/cm³. Speeds come from the matching range in the Chapter 2 speed table, not from the simplified Chapter 4 formula.',
  'ch3.e1.h': '⌀5 cm hailstone · just over 50 g',
  'ch3.e1.p': '≈ a baseball hitting you at 60 km/h',
  'ch3.e2.h': "Pro pitcher's fastball",
  'ch3.e2.p': 'A baseball at about 150 km/h',
  'ch3.e3.h': '⌀8 cm hailstone',
  'ch3.e3.p': 'Hits harder than a pro fastball – a direct hit to the head can kill',
  'ch3.historyTitle': '1986 · Bangladesh',
  'ch3.historyText':
    'One of the deadliest hailstorms on record: a single hailstone weighed about 1 kg, and close to 100 people died.',
  'ch3.coin.h': 'Coin-sized',
  'ch3.coin.p': "Don't hang around outside – find somewhere to shelter.",
  'ch3.golf.h': 'Golf-ball-sized',
  'ch3.golf.p':
    'Get inside a sturdy building right away and stay clear of windows – injuries from shattered glass are common with large hail.',
  'ch3.season':
    "In Japan's Kanto region hail peaks in early summer, so take extra care around June – severe storms tend to break out on early-summer afternoons.",

  'ch4.title': '<span class="ch-no">Chapter 4</span>Hail Lab',
  'ch4.lead':
    'Why do some thunderstorms drop hail while others only bring heavy rain? Forecasters watch two numbers: <b>updraft strength</b> (how big a stone it can hold up) and <b>0℃ level height</b> (how much melts before it lands). Try it yourself.',
  'ch4.w': 'Updraft strength',
  'ch4.h0': '0℃ level height',
  'ch4.kicker': 'How this storm ends',
  'outcome.hail': 'Dangerous hail',
  'ch4.dmax': 'Max size in cloud',
  'ch4.dfinal': 'Landing diameter',
  'ch4.vland': 'Impact speed',
  'ch4.stageAria':
    'Thunderstorm cross-section with a vertical axis from 0 to 8 km. The updraft holds hail in the cloud while it grows; then it falls, melting and shrinking once it passes the 0℃ line. Its size when it lands is the landing diameter.',
  'ch4.scale': 'Size scale',
  'ch4.zeroLabel': '0℃ level {km} km',
  'ch4.zeroPillW': '118',
  'ch4.zeroTextX': '111',
  'ch4.melt': 'Melting zone',
  'ch4.meltPillW': '86',
  'ch4.meltTextX': '95',
  'ch4.mathTitle': 'The model in three formulas',
  'ch4.leg.d': 'diameter, cm',
  'ch4.leg.v': 'fall speed, m/s',
  'ch4.leg.w': 'updraft strength, m/s',
  'ch4.leg.h0': '0℃ level height, km',
  'ch4.leg.eta': 'growth efficiency',
  'ch4.leg.r': 'melting rate',
  'ch4.mathNote':
    '{k} is calibrated on 2–3 cm hail. Above 4 cm, typical speeds run <span class="nobr">15–25%</span> faster than this formula – that is why the dots sit above the curve in the Chapter 2 chart.',
  'ch4.liveHead': 'With the current values',
  'ch4.fall': 'Fall time',
  'ch4.melted': 'Melted',
  'ch4.dLand': '<i>d</i><sub>land</sub>',
  'ch4.note':
    'Simplified teaching model: {f} plus a linear melting loss. It is meant to build intuition, not to serve as numerical weather prediction.',

  'end.title': 'Landed.',
  'end.lead':
    "A hailstone's life: it grows by tumbling 5–10 km up, falls at a speed proportional to {f} (the square root of its diameter), and once it tops 2 cm, it is worth taking seriously.",
  'end.sources': 'Sources',
  'end.src1': 'NOAA NSSL, Severe Weather 101: Hail',
  'end.src2':
    'WMO Weather and Climate Extremes Archive: heaviest hailstone, 1.02 kg, Gopalganj, Bangladesh, <span class="nowrap">1986-04-14</span>',
  'end.credits': 'Numbers in the text are typical ranges; see each chapter for details. Handmade with Vite and GSAP.',
  'end.groundAria':
    'A small house and two trees on the grass. The hailstone that landed has melted into a little smiling puddle, with a tiny sprout growing beside it.',
};
