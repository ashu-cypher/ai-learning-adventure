/**
 * Self-contained AI Game Engine (TypeScript)
 * Ports the Python SmartRules AI provider into the browser.
 * No backend needed — this runs 100% offline on the device.
 */

import type { LessonPlan, GameActivity, VisualObject } from '../types';

// ─── Knowledge Base ─────────────────────────────────────────────────────────

export interface ConceptData {
  title: string;
  greeting: string;
  hear: string;
  fact: string;
  song: string;
  story: string;
  items: Array<{
    id: string; name: string; label: string; color?: string;
    shape?: string; icon: string; is_target?: boolean; size?: string;
  }>;
  targets?: Array<{ color: string; label: string; icon: string; target_color: string }>;
  correct_id: string;
  instruction: string;
  spoken: string;
  hint: string;
}

const CONCEPT_KNOWLEDGE: Record<string, ConceptData> = {
  red: {
    title: 'Find Red',
    greeting: "Hi little friend! I'm Milo the Bunny! Let's discover RED together! 🍎",
    hear: 'Red! Like a yummy, juicy red apple!',
    fact: 'Did you know ladybugs and strawberries are bright RED?',
    song: 'Red, red, look around!\nRed is the color that we found!\nRed apple, red car, beep beep zoooom!\nBright red flowers in our room! 🍓',
    story: "Buddy the Bunny hopped into the magical garden. 'Oh look!' shouted Buddy, 'A shiny red apple waiting for us!' Can you spot what is red?",
    items: [
      { id: 'apple', name: 'Apple', label: 'Red Apple', color: 'red', icon: '🍎', is_target: true },
      { id: 'banana', name: 'Banana', label: 'Yellow Banana', color: 'yellow', icon: '🍌', is_target: false },
      { id: 'leaf', name: 'Leaf', label: 'Green Leaf', color: 'green', icon: '🍃', is_target: false },
      { id: 'ball', name: 'Blue Ball', label: 'Blue Ball', color: 'blue', icon: '⚽', is_target: false },
    ],
    correct_id: 'apple',
    instruction: 'Can you tap the RED apple?',
    spoken: 'Can you find the red apple? Tap it!',
    hint: 'Look for the color of ripe strawberries and fire trucks! Warm and bright red! 🍎',
  },
  blue: {
    title: 'Find Blue',
    greeting: 'Woohoo! Milo here! Today the sky is shining BLUE! Can you see it? 🌊',
    hear: 'Blue! Cool like the ocean waves and the sunny sky!',
    fact: 'Blue whales are the biggest friendly animals in the whole blue ocean!',
    song: 'Blue, blue, deep and wide!\nBlue blue ocean on a slide!\nBlue bird singing in the tree,\nBlue is pretty as can be! 🐦',
    story: "Milo looked up at the fluffy clouds. 'The sky is such a peaceful blue!' Milo noticed something blue on the ground too. Let's find it!",
    items: [
      { id: 'butterfly', name: 'Butterfly', label: 'Blue Butterfly', color: 'blue', icon: '🦋', is_target: true },
      { id: 'orange_fruit', name: 'Orange', label: 'Orange', color: 'orange', icon: '🍊', is_target: false },
      { id: 'strawberry', name: 'Strawberry', label: 'Red Strawberry', color: 'red', icon: '🍓', is_target: false },
      { id: 'sunflower', name: 'Sunflower', label: 'Yellow Flower', color: 'yellow', icon: '🌻', is_target: false },
    ],
    correct_id: 'butterfly',
    instruction: 'Tap the beautiful BLUE butterfly!',
    spoken: 'Can you find the blue butterfly? Tap it!',
    hint: 'It has lovely fluttery wings colored just like the ocean and the clear sky! 🦋',
  },
  yellow: {
    title: 'Find Yellow',
    greeting: 'Rise and shine! Milo is so happy to see you! Let\'s find sunny YELLOW! ☀️',
    hear: 'Yellow! Warm and cheerful like the morning sunshine!',
    fact: 'Baby ducklings are soft and fluffy yellow quack-quackers!',
    song: 'Yellow, yellow, shining sun!\nYellow brings a day of fun!\nYellow lemon, yellow star,\nYellow beaming from afar! ⭐',
    story: "A warm ray of sunshine woke Milo. 'Good morning world! Look at that bright yellow star glowing in the sky!' Let's find yellow together!",
    items: [
      { id: 'duck', name: 'Duckling', label: 'Yellow Duckling', color: 'yellow', icon: '🐥', is_target: true },
      { id: 'grape', name: 'Grapes', label: 'Purple Grapes', color: 'purple', icon: '🍇', is_target: false },
      { id: 'cherry', name: 'Cherries', label: 'Red Cherries', color: 'red', icon: '🍒', is_target: false },
      { id: 'frog_y', name: 'Tree Frog', label: 'Green Frog', color: 'green', icon: '🐸', is_target: false },
    ],
    correct_id: 'duck',
    instruction: 'Can you tap the happy YELLOW duckling?',
    spoken: 'Can you find the yellow duckling? Quack quack! Tap it!',
    hint: 'Look for the sunny little friend that says quack quack! 🐥',
  },
  green: {
    title: 'Find Green',
    greeting: 'Hello explorer! Milo is hopping in the green grass! Let\'s explore GREEN! 🌿',
    hear: 'Green! Fresh like leaves, frogs, and tall jungle trees!',
    fact: 'Frogs love hopping on green lily pads in ponds!',
    song: 'Green, green, grass so tall!\nGreen green frog upon the wall!\nGreen juicy pear upon the tree,\nGreen is good for you and me! 🍐',
    story: "Milo hopped through the lush meadow. 'Listen! Ribbit ribbit! A friendly green frog is playing hide and seek!' Where is the green frog?",
    items: [
      { id: 'frog', name: 'Frog', label: 'Green Frog', color: 'green', icon: '🐸', is_target: true },
      { id: 'fire', name: 'Campfire', label: 'Red Fire', color: 'red', icon: '🔥', is_target: false },
      { id: 'star_g', name: 'Star', label: 'Yellow Star', color: 'yellow', icon: '⭐', is_target: false },
      { id: 'cloud', name: 'Cloud', label: 'Blue Cloud', color: 'blue', icon: '🌧️', is_target: false },
    ],
    correct_id: 'frog',
    instruction: 'Can you tap the friendly GREEN frog?',
    spoken: 'Find the green frog! Ribbit ribbit! Tap it!',
    hint: 'Ribbit! Look for the leaping friend who loves green lily pads! 🐸',
  },
  color_matching: {
    title: 'Match Colors',
    greeting: 'Milo has special paint buckets! Can you match the right color? 🎨',
    hear: 'Match the colors! Red with Red, Blue with Blue, Yellow with Yellow!',
    fact: 'Artists mix matching colors to make lovely rainbow paintings!',
    song: 'Matching colors, one two three!\nMatch them up for you and me!\nRed to red and blue to blue,\nYellow makes it happy too! 🎨',
    story: 'Milo opened an artist box with three colorful buckets: Red, Blue, and Yellow. Can you help Milo put each toy in its matching color bucket?',
    items: [
      { id: 'match_apple', name: 'Apple', label: 'Red', color: 'red', icon: '🍎', is_target: true },
      { id: 'match_balloon', name: 'Balloon', label: 'Blue', color: 'blue', icon: '🎈', is_target: true },
      { id: 'match_star', name: 'Star', label: 'Yellow', color: 'yellow', icon: '⭐', is_target: true },
    ],
    targets: [
      { color: 'red', label: 'Red Bucket', icon: '🪣', target_color: '#EF4444' },
      { color: 'blue', label: 'Blue Bucket', icon: '🪣', target_color: '#3B82F6' },
      { color: 'yellow', label: 'Yellow Bucket', icon: '🪣', target_color: '#EAB308' },
    ],
    correct_id: 'all_matched',
    instruction: 'Match each colored toy to its matching bucket!',
    spoken: 'Match the red apple to red, blue balloon to blue, and yellow star to yellow!',
    hint: 'Put each item into the bucket that has the very same color! 🎨',
  },
  color_sorting: {
    title: 'Color Sorting',
    greeting: "Our toy room needs tidying up! Let's sort toys by color! 🧸",
    hear: 'Sorting means putting things of the same color into their own box!',
    fact: 'Sorting helps us keep our toys neat and organized!',
    song: 'Sort the colors, put them in!\nEvery toy inside its bin!\nRed and Blue and Yellow bright,\nEverything is clean and right! 📦',
    story: "Milo has toys scattered around! There are red hearts and blue crystals and yellow crowns. Let's put them into their color treasure chests!",
    items: [
      { id: 'sort_heart', name: 'Heart', label: 'Red Heart', color: 'red', icon: '❤️', is_target: true },
      { id: 'sort_blue_gem', name: 'Gem', label: 'Blue Gem', color: 'blue', icon: '💎', is_target: true },
      { id: 'sort_crown', name: 'Crown', label: 'Yellow Crown', color: 'yellow', icon: '👑', is_target: true },
      { id: 'sort_car', name: 'Red Car', label: 'Red Car', color: 'red', icon: '🚗', is_target: true },
    ],
    targets: [
      { color: 'red', label: 'Red Chest', icon: '🧰', target_color: '#EF4444' },
      { color: 'blue', label: 'Blue Chest', icon: '🧰', target_color: '#3B82F6' },
      { color: 'yellow', label: 'Yellow Chest', icon: '🧰', target_color: '#EAB308' },
    ],
    correct_id: 'all_sorted',
    instruction: 'Sort the toys into the matching treasure chests!',
    spoken: 'Drag or tap toys into the chest with the same color!',
    hint: 'Look at the color of each toy and place it in the chest of the same color!',
  },
  color_challenge: {
    title: 'Color Challenge',
    greeting: "You're doing fantastic! Are you ready for the grand Color Master Challenge? 🏆",
    hear: 'Listen carefully! Milo will ask you special questions!',
    fact: 'When you know Red, Blue, and Yellow, you can make every color of the rainbow!',
    song: 'We are masters, yes we are!\nShining bright just like a star!\nColors here and colors there,\nRainbows dancing in the air! 🌈',
    story: "The Rainbow Fairy visited Milo and asked: 'Who is ready to earn the Grand Color Crown?' Milo pointed to you! Let's solve the master riddle!",
    items: [
      { id: 'target_blue_car', name: 'Blue Car', label: 'Blue Car', color: 'blue', icon: '🚙', is_target: true },
      { id: 'red_apple_ch', name: 'Red Apple', label: 'Red Apple', color: 'red', icon: '🍎', is_target: false },
      { id: 'yellow_sun_ch', name: 'Sun', label: 'Yellow Sun', color: 'yellow', icon: '☀️', is_target: false },
      { id: 'green_tree_ch', name: 'Tree', label: 'Green Tree', color: 'green', icon: '🌲', is_target: false },
    ],
    correct_id: 'target_blue_car',
    instruction: 'Find the BLUE car zooming by!',
    spoken: 'Which one is the blue car? Zoom zoom! Tap it!',
    hint: 'It has four wheels and is painted like the bright blue ocean! 🚙',
  },
  // Shapes World
  circle: {
    title: 'Round Circle',
    greeting: "Milo loves things that roll! Let's explore the round CIRCLE! 🔴",
    hear: 'Circle! Round and round, with no corners at all!',
    fact: 'Coins, clocks, and tasty pizzas are all circles!',
    song: 'A circle is round, it rolls on the ground!\nRound and round, no corners found! 🔘',
    story: "Milo found a round shiny coin rolling down the hill. Can you spot which shape is round like a ball?",
    items: [
      { id: 'circle_shape', name: 'Circle', label: 'Circle', shape: 'circle', icon: '🔴', color: 'red', is_target: true },
      { id: 'square_shape', name: 'Square', label: 'Square', shape: 'square', icon: '🟧', color: 'orange', is_target: false },
      { id: 'triangle_shape', name: 'Triangle', label: 'Triangle', shape: 'triangle', icon: '🔺', color: 'red', is_target: false },
    ],
    correct_id: 'circle_shape',
    instruction: 'Can you tap the round CIRCLE?',
    spoken: 'Find the round circle! Tap it!',
    hint: 'It has no pointy corners and rolls round and round! 🔴',
  },
  square: {
    title: 'Square Box',
    greeting: "Milo found a treasure BOX! It is a perfect SQUARE! Let's learn! 🟧",
    hear: 'Square! Four equal sides and four corners!',
    fact: 'Books, windows, and dice are all squares or rectangles!',
    song: 'A square has four sides all the same!\nFour corners, that\'s its name!\nCount them: one, two, three, four!\nA square is fun to explore! 🟧',
    story: "Milo discovered a square treasure box in the forest. 'Four equal sides!' cried Milo. Can you find the square shape?",
    items: [
      { id: 'square_s', name: 'Square', label: 'Square', shape: 'square', icon: '🟧', color: 'orange', is_target: true },
      { id: 'circle_s', name: 'Circle', label: 'Circle', shape: 'circle', icon: '🔴', color: 'red', is_target: false },
      { id: 'triangle_s', name: 'Triangle', label: 'Triangle', shape: 'triangle', icon: '🔺', color: 'red', is_target: false },
    ],
    correct_id: 'square_s',
    instruction: 'Can you tap the SQUARE box?',
    spoken: 'Find the square! It has four equal sides! Tap it!',
    hint: 'It has four equal sides and four corners, like a window! 🟧',
  },
  triangle: {
    title: 'Triangle Wedge',
    greeting: "Milo is wearing a party hat! It is a TRIANGLE! Let's explore! 🔺",
    hear: 'Triangle! Three sides and three pointy corners!',
    fact: 'Pizza slices and mountain peaks are shaped like triangles!',
    song: 'Triangle, triangle, one, two, three!\nThree sides, three corners, look and see!\nLike a mountain or a slice of pie,\nPointing up towards the sky! 🔺',
    story: "Milo wore a pointy party hat shaped like a triangle. 'Three sides, three corners!' Milo cheered. Can you find the triangle?",
    items: [
      { id: 'triangle_t', name: 'Triangle', label: 'Triangle', shape: 'triangle', icon: '🔺', color: 'red', is_target: true },
      { id: 'circle_t', name: 'Circle', label: 'Circle', shape: 'circle', icon: '🔴', color: 'red', is_target: false },
      { id: 'square_t', name: 'Square', label: 'Square', shape: 'square', icon: '🟧', color: 'orange', is_target: false },
    ],
    correct_id: 'triangle_t',
    instruction: 'Can you tap the pointy TRIANGLE?',
    spoken: 'Find the triangle! It has three pointy sides! Tap it!',
    hint: 'It has three sides and three pointy corners, like a mountain peak! 🔺',
  },
  shape_matching: {
    title: 'Match Shapes',
    greeting: "Milo brought shape puzzle pieces! Let's match them together! 🔷",
    hear: 'Match each shape to its matching shadow outline!',
    fact: 'Our world is full of shapes — windows, wheels, pizza slices, coins!',
    song: 'Circles, squares, and triangles too!\nMatch them up, that\'s what we do!\nShape by shape, one by one,\nMilo and you, it\'s so much fun! 🔷',
    story: "Milo opened the magic shape puzzle box! 'Each piece fits perfectly!' said Milo. Can you put each shape in the right spot?",
    items: [
      { id: 'match_circle', name: 'Circle', label: 'Circle', shape: 'circle', icon: '🔴', color: 'red', is_target: true },
      { id: 'match_square', name: 'Square', label: 'Square', shape: 'square', icon: '🟧', color: 'orange', is_target: true },
      { id: 'match_triangle', name: 'Triangle', label: 'Triangle', shape: 'triangle', icon: '🔺', color: 'red', is_target: true },
    ],
    targets: [
      { color: 'circle', label: 'Circle Spot', icon: '⭕', target_color: '#EF4444' },
      { color: 'square', label: 'Square Spot', icon: '🟧', target_color: '#F97316' },
      { color: 'triangle', label: 'Triangle Spot', icon: '🔺', target_color: '#EF4444' },
    ],
    correct_id: 'all_matched',
    instruction: 'Match each shape to its outline!',
    spoken: 'Tap a shape, then tap the outline that matches it!',
    hint: 'Match the circle to the round outline, square to the square outline! 🔷',
  },
};

const SEE_OBJECTS: Record<string, VisualObject[]> = {
  red: [
    { id: 's1', name: 'Red Apple', label: 'Apple', color: 'red', icon: '🍎', size: 'giant', is_target: true },
    { id: 's2', name: 'Strawberry', label: 'Strawberry', color: 'red', icon: '🍓', size: 'giant', is_target: true },
    { id: 's3', name: 'Fire Engine', label: 'Fire Engine', color: 'red', icon: '🚒', size: 'giant', is_target: true },
  ],
  blue: [
    { id: 's1', name: 'Blue Butterfly', label: 'Butterfly', color: 'blue', icon: '🦋', size: 'giant', is_target: true },
    { id: 's2', name: 'Blue Whale', label: 'Whale', color: 'blue', icon: '🐳', size: 'giant', is_target: true },
    { id: 's3', name: 'Blue Balloon', label: 'Balloon', color: 'blue', icon: '🎈', size: 'giant', is_target: true },
  ],
  yellow: [
    { id: 's1', name: 'Yellow Sun', label: 'Sun', color: 'yellow', icon: '☀️', size: 'giant', is_target: true },
    { id: 's2', name: 'Yellow Duckling', label: 'Duckling', color: 'yellow', icon: '🐥', size: 'giant', is_target: true },
    { id: 's3', name: 'Yellow Banana', label: 'Banana', color: 'yellow', icon: '🍌', size: 'giant', is_target: true },
  ],
  green: [
    { id: 's1', name: 'Green Frog', label: 'Frog', color: 'green', icon: '🐸', size: 'giant', is_target: true },
    { id: 's2', name: 'Green Tree', label: 'Tree', color: 'green', icon: '🌲', size: 'giant', is_target: true },
    { id: 's3', name: 'Green Leaf', label: 'Leaf', color: 'green', icon: '🍃', size: 'giant', is_target: true },
  ],
  circle: [
    { id: 's1', name: 'Full Moon', label: 'Moon', icon: '🌕', size: 'giant', is_target: true },
    { id: 's2', name: 'Pizza', label: 'Pizza', icon: '🍕', size: 'giant', is_target: true },
    { id: 's3', name: 'Donut', label: 'Donut', icon: '🍩', size: 'giant', is_target: true },
  ],
  square: [
    { id: 's1', name: 'Gift Box', label: 'Box', icon: '📦', size: 'giant', is_target: true },
    { id: 's2', name: 'Window', label: 'Window', icon: '🪟', size: 'giant', is_target: true },
    { id: 's3', name: 'Die / Dice', label: 'Dice', icon: '🎲', size: 'giant', is_target: true },
  ],
  triangle: [
    { id: 's1', name: 'Party Hat', label: 'Party Hat', icon: '🎉', size: 'giant', is_target: true },
    { id: 's2', name: 'Mountain', label: 'Mountain', icon: '⛰️', size: 'giant', is_target: true },
    { id: 's3', name: 'Pizza Slice', label: 'Pizza Slice', icon: '🍕', size: 'giant', is_target: true },
  ],
};

function getDefaultSeeObjects(concept: string): VisualObject[] {
  return SEE_OBJECTS[concept] || [
    { id: 's1', name: 'Rainbow Palette', label: 'Colors', icon: '🎨', size: 'giant', is_target: true },
    { id: 's2', name: 'Rainbow', label: 'Rainbow', icon: '🌈', size: 'giant', is_target: true },
  ];
}

// ─── Lesson Plan Generator ───────────────────────────────────────────────────

export function generateLessonPlan(
  worldId: string,
  stageId: string,
  stageNumber: number,
  stageTitle: string,
  concept: string,
  difficulty: number,
  mistakes: number
): LessonPlan {
  const data = CONCEPT_KNOWLEDGE[concept] || CONCEPT_KNOWLEDGE['red'];
  let items = [...data.items];

  // Adaptive difficulty: trim distractors for easier mode
  if (difficulty === 1 && items.length > 3) {
    const targets = items.filter(i => i.is_target);
    const others = items.filter(i => !i.is_target).slice(0, 2);
    items = [...targets, ...others];
  }

  // If child is struggling: add glow highlight on target
  const glowTarget = mistakes >= 2;
  const visualObjects: VisualObject[] = items.map(i => ({
    id: i.id,
    name: i.name,
    label: i.label,
    color: i.color,
    shape: i.shape,
    icon: i.icon,
    size: (i.size as 'normal' | 'large' | 'giant') || 'large',
    sound_cue: `${i.name.toLowerCase()}_pop`,
    highlight: glowTarget && !!i.is_target,
    is_target: !!i.is_target,
  }));

  // Determine game type
  let visualType: GameActivity['visual_type'] = 'object_selection';
  if (concept === 'color_matching' || concept === 'shape_matching') visualType = 'color_match';
  else if (concept === 'color_sorting') visualType = 'color_sort';

  const activity: GameActivity = {
    visual_type: visualType,
    instruction: data.instruction,
    spoken_instruction: data.spoken,
    objects: visualObjects,
    targets: data.targets,
    correct_answer: data.correct_id,
    difficulty,
    hint_text: data.hint,
    spoken_hint: data.hint,
  };

  return {
    world_id: worldId,
    world_name: worldId.charAt(0).toUpperCase() + worldId.slice(1),
    stage_id: stageId,
    stage_number: stageNumber,
    stage_title: stageTitle,
    concept,
    greeting: data.greeting,
    spoken_greeting: data.spoken,
    teaching: {
      concept,
      see_objects: getDefaultSeeObjects(concept),
      hear_text: data.hear,
      spoken_text: data.spoken,
      fun_fact: data.fact,
      song_lyrics: data.song,
      story_snippet: data.story,
    },
    activity,
  };
}

// ─── Assessment Engine ───────────────────────────────────────────────────────

const CORRECT_REACTIONS = [
  (c: string) => `YAY! You found ${c.toUpperCase()}! That's wonderful!`,
  (c: string) => `Super duper job! That is exactly ${c}!`,
  () => `Hooray! Milo is dancing for joy! You're a star!`,
  (c: string) => `High five, Little Explorer! You mastered ${c}!`,
];

const WRONG_REACTIONS_GENTLE = [
  () => "Almost! Look carefully. Let's try again together!",
  () => "Good try! Let's take another look with Milo!",
  () => "Nice try, Little Explorer! Look very closely!",
];

const WRONG_REACTIONS_HELP = [
  () => "Good try! Look where Milo is pointing — the glowing one is the answer!",
  () => "Let's do it together! Tap the one that is glowing bright!",
];

export function evaluateAnswer(
  concept: string,
  selectedAnswer: string,
  correctAnswer: string,
  mistakes: number
): { is_correct: boolean; ai_reaction: string; spoken_feedback: string; next_action: 'celebrate' | 'retry_same' | 'retry_simplified' } {
  const isSpecialMultiStep = correctAnswer === 'all_matched' || correctAnswer === 'all_sorted';
  const is_correct = isSpecialMultiStep
    ? selectedAnswer === correctAnswer
    : selectedAnswer === correctAnswer;

  if (is_correct) {
    const picker = CORRECT_REACTIONS[Math.floor(Math.random() * CORRECT_REACTIONS.length)];
    const msg = picker(concept);
    return { is_correct: true, ai_reaction: msg, spoken_feedback: msg, next_action: 'celebrate' };
  }

  // Not correct
  if (mistakes >= 2) {
    const picker = WRONG_REACTIONS_HELP[Math.floor(Math.random() * WRONG_REACTIONS_HELP.length)];
    const msg = picker();
    return { is_correct: false, ai_reaction: msg, spoken_feedback: msg, next_action: 'retry_simplified' };
  }

  const picker = WRONG_REACTIONS_GENTLE[Math.floor(Math.random() * WRONG_REACTIONS_GENTLE.length)];
  const msg = picker();
  return { is_correct: false, ai_reaction: msg, spoken_feedback: msg, next_action: 'retry_same' };
}

// ─── Simplification Engine ───────────────────────────────────────────────────

export function simplifyActivity(activity: GameActivity): GameActivity {
  const target = activity.objects.find(o => o.is_target) || activity.objects[0];
  const distractor = activity.objects.find(o => !o.is_target);

  const simplified = [
    { ...target, highlight: true, size: 'giant' as const },
    ...(distractor ? [distractor] : []),
  ];

  return {
    ...activity,
    objects: simplified,
    instruction: `Look! Milo made it easier! Can you find the ${target.label}?`,
    spoken_instruction: "Look! Milo made it easier! Tap the glowing one!",
    difficulty: 1,
    hint_text: `Look for the glowing ${target.label}!`,
    spoken_hint: "Look for the one with the glowing golden border!",
  };
}

export { CONCEPT_KNOWLEDGE };
