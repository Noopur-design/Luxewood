const fs = require('fs');

// ── index.html replacements ──────────────────────────────────────
let html = fs.readFileSync('C:/dev/LuxeWood/index.html', 'utf8');

const htmlMap = [
  // Hero
  ['photo-1600607687939-ce8a6c25118c?w=1800&q=90&fit=crop',
   'photo-1618221195710-dd6b41faaea6?w=1800&q=90&fit=crop'],
  // Phase 01 — Discovery (was exterior architecture)
  ['photo-1616486338812-3dadae4b4ace?w=900&q=85&fit=crop',
   'photo-1600210492486-724fe5c67fb0?w=900&q=85&fit=crop'],
  // Phase 02 — Moodboards
  ['photo-1586023492125-27b2c045efd7?w=900&q=85&fit=crop',
   'photo-1513694203232-719a280e022f?w=900&q=85&fit=crop'],
  // Phase 03 — Craftsmanship
  ['photo-1588046130717-0eb0c9a3ba15?w=900&q=85&fit=crop',
   'photo-1595515106969-1ce29566ff1c?w=900&q=85&fit=crop'],
  // Phase 04 — Final Reveal (was duplicate hero)
  ['photo-1600607687939-ce8a6c25118c?w=900&q=85&fit=crop',
   'photo-1616137466211-f939a420be84?w=900&q=85&fit=crop'],
  // BA Living Room — BEFORE
  ['photo-1586023492125-27b2c045efd7?w=800&q=80&fit=crop',
   'photo-1484154218962-a197022b5858?w=800&q=80&fit=crop'],
  // BA Living Room — AFTER
  ['photo-1600607687939-ce8a6c25118c?w=800&q=90&fit=crop',
   'photo-1618221195710-dd6b41faaea6?w=800&q=90&fit=crop'],
  // BA Bedroom — BEFORE
  ['photo-1560185893-a55cbc8c57e8?w=800&q=80&fit=crop',
   'photo-1512917774080-9991f1c4c750?w=800&q=80&fit=crop'],
  // BA Bedroom — AFTER
  ['photo-1631049307264-da0ec9d70304?w=800&q=90&fit=crop',
   'photo-1616594039964-ae9021a400a0?w=800&q=90&fit=crop'],
  // BA Dining — BEFORE
  ['photo-1571508601891-ca5e7a713859?w=800&q=80&fit=crop',
   'photo-1484101403633-562f891dc89a?w=800&q=80&fit=crop'],
  // BA Dining — AFTER
  ['photo-1617806118233-18e1de247200?w=800&q=90&fit=crop',
   'photo-1555396273-367ea4eb4db5?w=800&q=90&fit=crop'],
  // Room pill — Living Room
  ['photo-1600607687939-ce8a6c25118c?w=120&q=75&fit=crop',
   'photo-1618221195710-dd6b41faaea6?w=120&q=75&fit=crop'],
  // Room pill — Bedroom
  ['photo-1631049307264-da0ec9d70304?w=120&q=75&fit=crop',
   'photo-1616594039964-ae9021a400a0?w=120&q=75&fit=crop'],
  // Room pill — Dining
  ['photo-1617806118233-18e1de247200?w=120&q=75&fit=crop',
   'photo-1555396273-367ea4eb4db5?w=120&q=75&fit=crop'],
  // Room pill — Home Office
  ['photo-1593079831268-3381b0db4a77?w=120&q=75&fit=crop',
   'photo-1497366216548-37526070297c?w=120&q=75&fit=crop'],
  // Room pill — Kitchen
  ['photo-1556909172-54557c7e4fb7?w=120&q=75&fit=crop',
   'photo-1556909114-f6e7ad7d3136?w=120&q=75&fit=crop'],
  // Craft main image
  ['photo-1588046130717-0eb0c9a3ba15?w=700&q=85&fit=crop',
   'photo-1581578731548-c64695cc6952?w=700&q=85&fit=crop'],
  // Craft inset
  ['photo-1540518614846-7eded433c457?w=600&q=85&fit=crop',
   'photo-1524758631624-e2822e304c36?w=600&q=85&fit=crop'],
  // Product — Sofa (keep same great sofa image)
  // Product — Coffee Table
  ['photo-1567538096630-e0c55bd6374c?w=600&q=85&fit=crop',
   'photo-1533090161767-e6ffed986c88?w=600&q=85&fit=crop'],
  // Product — Dining
  ['photo-1617806118233-18e1de247200?w=600&q=85&fit=crop',
   'photo-1555396273-367ea4eb4db5?w=600&q=85&fit=crop'],
  // Product — Bed
  ['photo-1631049307264-da0ec9d70304?w=1000&q=85&fit=crop',
   'photo-1616594039964-ae9021a400a0?w=1000&q=85&fit=crop'],
  // Product — Desk
  ['photo-1493809842364-78817add7ffb?w=600&q=85&fit=crop',
   'photo-1497366216548-37526070297c?w=600&q=85&fit=crop'],
];

htmlMap.forEach(([from, to]) => {
  if (html.includes(from)) {
    html = html.split(from).join(to);
    console.log(`✓ HTML: ...${from.slice(-30)} → ...${to.slice(-30)}`);
  } else {
    console.log(`✗ NOT FOUND: ${from}`);
  }
});

fs.writeFileSync('C:/dev/LuxeWood/index.html', html, 'utf8');

// ── rooms.js replacements ────────────────────────────────────────
let rooms = fs.readFileSync('C:/dev/LuxeWood/src/react/data/rooms.js', 'utf8');

const roomsMap = [
  // Living Room — Grand Classic
  ['photo-1600607687939-ce8a6c25118c?w=1400&q=90&fit=crop',
   'photo-1618221195710-dd6b41faaea6?w=1400&q=90&fit=crop'],
  ['photo-1600607687939-ce8a6c25118c?w=600&q=85&fit=crop',
   'photo-1618221195710-dd6b41faaea6?w=600&q=85&fit=crop'],
  // Living Room — Boho Luxe
  ['photo-1616486338812-3dadae4b4ace?w=1400&q=90&fit=crop',
   'photo-1631679706909-1844bbd07221?w=1400&q=90&fit=crop'],
  ['photo-1616486338812-3dadae4b4ace?w=600&q=85&fit=crop',
   'photo-1631679706909-1844bbd07221?w=600&q=85&fit=crop'],
  // Living Room — Nordic Minimal
  ['photo-1583847268964-b28dc8f51f92?w=1400&q=90&fit=crop',
   'photo-1527903789995-dc8ad2ad6de0?w=1400&q=90&fit=crop'],
  ['photo-1583847268964-b28dc8f51f92?w=600&q=85&fit=crop',
   'photo-1527903789995-dc8ad2ad6de0?w=600&q=85&fit=crop'],
  // Living Room — Scandi Rustic
  ['photo-1567538096630-e0c55bd6374c?w=1400&q=90&fit=crop',
   'photo-1493663284031-b7e3aefcae8e?w=1400&q=90&fit=crop'],
  ['photo-1567538096630-e0c55bd6374c?w=600&q=85&fit=crop',
   'photo-1493663284031-b7e3aefcae8e?w=600&q=85&fit=crop'],
  // Bedroom — Serene Retreat
  ['photo-1631049307264-da0ec9d70304?w=1400&q=90&fit=crop',
   'photo-1616594039964-ae9021a400a0?w=1400&q=90&fit=crop'],
  ['photo-1631049307264-da0ec9d70304?w=600&q=85&fit=crop',
   'photo-1616594039964-ae9021a400a0?w=600&q=85&fit=crop'],
  // Bedroom — Dark Romance
  ['photo-1540518614846-7eded433c457?w=1400&q=90&fit=crop',
   'photo-1505693416388-ac5ce068fe85?w=1400&q=90&fit=crop'],
  ['photo-1540518614846-7eded433c457?w=600&q=85&fit=crop',
   'photo-1505693416388-ac5ce068fe85?w=600&q=85&fit=crop'],
  // Dining — Formal
  ['photo-1617806118233-18e1de247200?w=1400&q=90&fit=crop',
   'photo-1555396273-367ea4eb4db5?w=1400&q=90&fit=crop'],
  ['photo-1617806118233-18e1de247200?w=600&q=85&fit=crop',
   'photo-1555396273-367ea4eb4db5?w=600&q=85&fit=crop'],
  // Dining — Casual
  ['photo-1555041469-a586c61ea9bc?w=1400&q=90&fit=crop',
   'photo-1556761175-4b46a572b786?w=1400&q=90&fit=crop'],
  ['photo-1555041469-a586c61ea9bc?w=600&q=85&fit=crop',
   'photo-1556761175-4b46a572b786?w=600&q=85&fit=crop'],
  // Home Office — Focus
  ['photo-1593079831268-3381b0db4a77?w=1400&q=90&fit=crop',
   'photo-1497366216548-37526070297c?w=1400&q=90&fit=crop'],
  ['photo-1593079831268-3381b0db4a77?w=600&q=85&fit=crop',
   'photo-1497366216548-37526070297c?w=600&q=85&fit=crop'],
  // Home Office — Creative
  ['photo-1493809842364-78817add7ffb?w=1400&q=90&fit=crop',
   'photo-1459908676235-d5f02a50184b?w=1400&q=90&fit=crop'],
  ['photo-1493809842364-78817add7ffb?w=600&q=85&fit=crop',
   'photo-1459908676235-d5f02a50184b?w=600&q=85&fit=crop'],
  // Kitchen — Shaker
  ['photo-1556909172-54557c7e4fb7?w=1400&q=90&fit=crop',
   'photo-1556909114-f6e7ad7d3136?w=1400&q=90&fit=crop'],
  ['photo-1556909172-54557c7e4fb7?w=600&q=85&fit=crop',
   'photo-1556909114-f6e7ad7d3136?w=600&q=85&fit=crop'],
];

roomsMap.forEach(([from, to]) => {
  if (rooms.includes(from)) {
    rooms = rooms.split(from).join(to);
    console.log(`✓ ROOMS: ...${from.slice(-30)} → ...${to.slice(-30)}`);
  } else {
    console.log(`✗ NOT FOUND: ${from}`);
  }
});

fs.writeFileSync('C:/dev/LuxeWood/src/react/data/rooms.js', rooms, 'utf8');
console.log('\n✅ All done.');
