import type { PlanetDef } from "./engine";

export interface QuizQ {
  q: string;
  options: string[];
  correct: number;
  fact: string;
}

export interface PlanetEdu {
  distance: string;
  day: string;
  year: string;
  size: string;
  temp: string;
  moons: string;
  facts: string[];
  quiz: QuizQ[];
}

export interface PlanetData extends PlanetDef {
  edu: PlanetEdu;
}

export const PLANETS: PlanetData[] = [
  {
    id: "mercury",
    name: "Mercury",
    tag: "The Speedy Planet",
    base: "#e0cdb4",
    dark: "#8f7a62",
    accent: "#ffd23f",
    ring: false,
    seed: 11,
    edu: {
      distance: "58 million km from the Sun",
      day: "59 Earth days to spin once",
      year: "Only 88 Earth days",
      size: "About 1/3 as wide as Earth",
      temp: "-173°C to 427°C — wild swings!",
      moons: "0 moons",
      facts: [
        "Mercury is the smallest planet — only a little bigger than our Moon!",
        "It zooms around the Sun faster than any other planet.",
        "One full spin takes 59 Earth days, so its days are looong.",
      ],
      quiz: [
        {
          q: "How long is ONE YEAR on Mercury?",
          options: ["88 Earth days", "12 Earth months", "7 Earth years"],
          correct: 0,
          fact: "Mercury orbits the Sun in just 88 days — the fastest trip of all the planets!",
        },
        {
          q: "Mercury is the ______ planet in our solar system.",
          options: ["biggest", "smallest", "coldest"],
          correct: 1,
          fact: "Mercury is the smallest planet — it's only slightly wider than Earth's Moon.",
        },
        {
          q: "How many moons does Mercury have?",
          options: ["Two big ones", "One tiny one", "Zero — none at all!"],
          correct: 2,
          fact: "Mercury and Venus are the only planets with no moons at all.",
        },
      ],
    },
  },
  {
    id: "venus",
    name: "Venus",
    tag: "The Hottest Planet",
    base: "#ffdf8a",
    dark: "#c9873d",
    accent: "#fff6e3",
    ring: false,
    seed: 27,
    edu: {
      distance: "108 million km from the Sun",
      day: "243 Earth days to spin once",
      year: "225 Earth days",
      size: "Almost Earth's twin in size",
      temp: "465°C — hot enough to melt metal!",
      moons: "0 moons",
      facts: [
        "Venus is the hottest planet — its thick clouds trap heat like a giant oven.",
        "Venus spins backwards! There, the Sun rises in the west.",
        "It shines so brightly you can sometimes spot it from Earth at sunset.",
      ],
      quiz: [
        {
          q: "Which planet is the HOTTEST?",
          options: ["Mercury", "Venus", "Mars"],
          correct: 1,
          fact: "Surprise! Venus is farther from the Sun than Mercury, but its heat-trapping clouds make it the hottest.",
        },
        {
          q: "What unusual thing does Venus do?",
          options: ["Spins backwards", "Has 10 moons", "Is made of ice"],
          correct: 0,
          fact: "Venus rotates the opposite way — on Venus, the Sun rises in the west and sets in the east!",
        },
        {
          q: "A day on Venus (one spin) is ______ its year.",
          options: ["shorter than", "longer than", "exactly the same as"],
          correct: 1,
          fact: "Venus takes 243 Earth days to spin but only 225 to orbit the Sun — its day is longer than its year!",
        },
      ],
    },
  },
  {
    id: "mars",
    name: "Mars",
    tag: "The Red Planet",
    base: "#ff8a5c",
    dark: "#b3452e",
    accent: "#ffd23f",
    ring: false,
    seed: 43,
    edu: {
      distance: "228 million km from the Sun",
      day: "24.6 hours — nearly like Earth's!",
      year: "687 Earth days",
      size: "About half as wide as Earth",
      temp: "Average -63°C — pack a coat!",
      moons: "2 tiny moons: Phobos & Deimos",
      facts: [
        "Mars looks red because its rocky soil is full of rusty iron.",
        "It has the tallest volcano anywhere — Olympus Mons, 3× higher than Mount Everest!",
        "Right now, robot rovers from Earth are driving around Mars taking photos.",
      ],
      quiz: [
        {
          q: "Why does Mars look red?",
          options: ["Rusty iron in its rocks", "It has red oceans", "It's covered in paint"],
          correct: 0,
          fact: "Mars' soil and dust contain lots of iron that has rusted — like an old bike left in the rain!",
        },
        {
          q: "What is Olympus Mons?",
          options: ["A giant ocean", "The tallest volcano in the solar system", "A spaceship"],
          correct: 1,
          fact: "Olympus Mons on Mars is about 3 times taller than Mount Everest. The biggest volcano we know!",
        },
        {
          q: "How many moons does Mars have?",
          options: ["Two — Phobos & Deimos", "Five shiny ones", "None at all"],
          correct: 0,
          fact: "Mars has two small, lumpy moons named Phobos and Deimos, which mean 'fear' and 'terror' in Greek!",
        },
      ],
    },
  },
  {
    id: "jupiter",
    name: "Jupiter",
    tag: "The Giant Planet",
    base: "#f2c48f",
    dark: "#a86b3f",
    accent: "#ff9d5c",
    ring: false,
    bands: true,
    spot: true,
    seed: 59,
    edu: {
      distance: "778 million km from the Sun",
      day: "About 10 hours — fastest spinner!",
      year: "12 Earth years",
      size: "11× wider than Earth",
      temp: "Cloud tops around -110°C",
      moons: "95 moons!",
      facts: [
        "Jupiter is the biggest planet — more than 1,300 Earths could fit inside!",
        "The Great Red Spot is a storm bigger than Earth that has raged for hundreds of years.",
        "It spins super fast: a whole Jupiter day lasts just 10 hours!",
      ],
      quiz: [
        {
          q: "Which planet is the BIGGEST?",
          options: ["Saturn", "Earth", "Jupiter"],
          correct: 2,
          fact: "Jupiter is huge — you could line up 11 Earths across its middle!",
        },
        {
          q: "What is Jupiter's Great Red Spot?",
          options: ["A giant storm", "A red lake", "A giant moon"],
          correct: 0,
          fact: "The Great Red Spot is a spinning storm bigger than Earth that has lasted hundreds of years.",
        },
        {
          q: "About how many moons does Jupiter have?",
          options: ["2", "95", "1"],
          correct: 1,
          fact: "Scientists have counted 95 moons around Jupiter — and some are still tiny mysteries!",
        },
      ],
    },
  },
  {
    id: "saturn",
    name: "Saturn",
    tag: "The Ringed Planet",
    base: "#ffe3ae",
    dark: "#c9974f",
    accent: "#ffd23f",
    ring: true,
    bands: true,
    seed: 71,
    edu: {
      distance: "1.4 billion km from the Sun",
      day: "About 10.7 hours",
      year: "29 Earth years",
      size: "9× wider than Earth",
      temp: "Cloud tops around -140°C",
      moons: "146 moons — the most of all!",
      facts: [
        "Saturn's rings are billions of chunks of ice and rock, all spinning around it.",
        "Saturn is so light for its size that it could float in a giant bathtub of water!",
        "It has more moons than any other planet — over 140 and counting!",
      ],
      quiz: [
        {
          q: "What are Saturn's rings made of?",
          options: ["Space cheese", "Ice and rock", "Fluffy clouds"],
          correct: 1,
          fact: "The rings are billions of pieces of ice and rock — some as small as sand, some as big as houses!",
        },
        {
          q: "Saturn is so light for its size that it could ______ in water!",
          options: ["sink", "float", "dissolve"],
          correct: 1,
          fact: "Saturn is less dense than water — in a big enough bathtub, it would bob like a rubber duck!",
        },
        {
          q: "Which planet is famous for its bright rings?",
          options: ["Venus", "Mercury", "Saturn"],
          correct: 2,
          fact: "Saturn's rings stretch 280,000 km wide — but in places they're thinner than a kilometre!",
        },
      ],
    },
  },
  {
    id: "neptune",
    name: "Neptune",
    tag: "The Windy Planet",
    base: "#4f8fff",
    dark: "#2743a8",
    accent: "#3ee6c1",
    ring: false,
    bands: true,
    seed: 88,
    edu: {
      distance: "4.5 billion km from the Sun",
      day: "About 16 hours",
      year: "165 Earth years — wow!",
      size: "4× wider than Earth",
      temp: "About -201°C — brrrr!",
      moons: "16 moons",
      facts: [
        "Neptune is the farthest planet from the Sun — super cold and deep blue.",
        "Its winds are the fastest in the solar system: over 2,000 km/h!",
        "Neptune was the first planet found using math, before telescopes spotted it!",
      ],
      quiz: [
        {
          q: "Which planet is FARTHEST from the Sun?",
          options: ["Mars", "Neptune", "Venus"],
          correct: 1,
          fact: "Neptune is so far away that sunlight takes over 4 hours to reach it!",
        },
        {
          q: "Neptune's winds are the ______ in the solar system.",
          options: ["slowest", "quietest", "fastest"],
          correct: 2,
          fact: "Neptune's winds scream along at more than 2,000 km/h — faster than a jet plane!",
        },
        {
          q: "How long is one year on Neptune?",
          options: ["165 Earth years", "30 Earth days", "1 Earth year"],
          correct: 0,
          fact: "Neptune orbits so slowly that it finished just its first orbit since being discovered in 1846 — in 2011!",
        },
      ],
    },
  },
];
