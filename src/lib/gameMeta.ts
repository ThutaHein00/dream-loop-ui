export type GameMeta = {
  trailerUrl?: string;
  screenshots?: string[];
  developer?: string;
  publisher?: string;
  releaseDate?: string;
  reviewSummary?: string;
  aboutShort?: string;
  aboutLong?: string;
};

const META_BY_TITLE: Record<string, GameMeta> = {
  "A Short Hike": {
    developer: "adamgryu",
    publisher: "adamgryu",
    releaseDate: "2019",
    reviewSummary: "Very Positive",
    trailerUrl: "https://www.youtube.com/watch?v=usBVx4J4CUM",
    screenshots: ["/AShortHike.jpg"],
    aboutShort:
      "Take a quiet vacation on Hawk Peak and hike at your own pace—chat with friendly campers, find hidden treasures, and glide across the island.",
    aboutLong:
      "Escape to Hawk Peak Provincial Park, a tiny island packed with trails, secrets, and cozy distractions.\n\nWander freely—climb cliffs, paddle across lakes, and soar on the wind. Help other hikers with small quests, collect golden feathers to reach new heights, and discover tucked-away viewpoints that make the climb worth it.\n\nA Short Hike is best enjoyed slowly: explore, relax, and let curiosity lead the way.",
  },

  "Stardew Valley": {
    developer: "ConcernedApe",
    publisher: "ConcernedApe",
    releaseDate: "2016",
    reviewSummary: "Overwhelmingly Positive",
    trailerUrl: "https://www.youtube.com/watch?v=ot7uXNQskhs",
    screenshots: ["/StardewValley.jpg"],
    aboutShort:
      "You’ve inherited your grandfather’s old farm plot in Stardew Valley. Armed with basic tools and a few coins, you begin a new life in a quiet rural town.",
    aboutLong:
      "You’ve inherited your grandfather’s old farm plot in Stardew Valley. Armed with hand-me-down tools and a few coins, you set out to begin your new life.\n\nTurn overgrown fields into a thriving farm, raise animals, grow crops, and craft useful machines. Spend your days fishing, mining, cooking, or socializing with the townsfolk.\n\nBuild relationships, get married, start a family, and uncover secrets hidden in caves and ancient ruins. Stardew Valley rewards patience, creativity, and a slower, more meaningful pace of play.",
  },

  "Alba: A Wildlife Adventure": {
    developer: "Ustwo Games",
    publisher: "Ustwo Games",
    releaseDate: "2020",
    reviewSummary: "Very Positive",
    trailerUrl: "https://www.youtube.com/watch?v=a-Eu9WE3grA",
    screenshots: ["/AlbaAWildlifeAdventure.jpg"],
    aboutShort:
      "A sunny island holiday turns into a gentle mission—photograph wildlife, clean up the coast, and rally your neighbors to protect a local nature reserve.",
    aboutLong:
      "Spend your summer with Alba on a beautiful Mediterranean island where every path leads to something worth noticing.\n\nSnap photos of birds and animals, learn their habits, and build a growing field guide. Along the way you’ll pick up litter, fix small problems around town, and encourage friends and family to join your cause.\n\nIt’s a feel-good adventure about community and conservation—small actions that add up to real change.",
  },

  "Animal Crossing: New Horizons": {
    developer: "Nintendo",
    publisher: "Nintendo",
    releaseDate: "2020",
    reviewSummary: "Very Positive",
    trailerUrl: "https://www.youtube.com/watch?v=_3YNL0OWio0",
    screenshots: ["/AnimalCrossingNewHorizons.jpg"],
    aboutShort:
      "Start fresh on your own island—decorate your home, befriend quirky neighbors, and shape a cozy community that grows day by day.",
    aboutLong:
      "Move to a peaceful island where you set the rhythm: fish at sunrise, garden in the afternoon, and decorate under starlight.\n\nGather materials to craft furniture and tools, design outfits, and plan the layout of your town. Meet new villagers, celebrate seasonal events, and keep improving your island over time.\n\nNew Horizons is a relaxing life sim that rewards creativity and consistency—no rush, just vibes.",
  },

  "Bear and Breakfast": {
    developer: "Gummy Cat",
    publisher: "Armor Games Studios",
    releaseDate: "2022",
    reviewSummary: "Positive",
    trailerUrl: "https://www.youtube.com/watch?v=DVLrWnpRRiE",
    screenshots: ["/Bear&Breakfast.jpg"],
    aboutShort:
      "You’re a bear running a cozy B&B in the woods—renovate cabins, welcome guests, and uncover odd secrets hiding behind the forest’s charm.",
    aboutLong:
      "As Hank the bear, you’ll turn abandoned shacks into warm, inviting rooms—then keep guests happy with good layouts, clean facilities, and thoughtful upgrades.\n\nCraft furniture, manage resources, and expand to new locations with different vibes and challenges. Along the way you’ll meet strange characters and stumble into a mystery that’s bigger than your little business.\n\nIt’s part management sim, part narrative adventure—cute on the outside, surprisingly weird underneath.",
  },

  Celeste: {
    developer: "Maddy Makes Games",
    publisher: "Maddy Makes Games",
    releaseDate: "2018",
    reviewSummary: "Overwhelmingly Positive",
    trailerUrl: "https://www.youtube.com/watch?v=70d9irlxiB4",
    screenshots: ["/Celeste.jpg"],
    aboutShort:
      "Climb Celeste Mountain in a precision platformer about perseverance—tight controls, tough challenges, and a heartfelt story.",
    aboutLong:
      "Help Madeline push through self-doubt and reach the summit. Every screen is a compact challenge built around clean movement, smart checkpoints, and satisfying progress.\n\nYou’ll dash, climb, and time jumps through evolving mechanics, optional collectibles, and extra-hard bonus stages for players who want more.\n\nCeleste is demanding but fair—each failure teaches something new, and every victory feels earned.",
  },

  "Clair Obscur: Expedition 33": {
    developer: "Sandfall Interactive",
    publisher: "Kepler Interactive",
    releaseDate: "2025",
    reviewSummary: "Highly Anticipated",
    trailerUrl: "https://www.youtube.com/watch?v=2VaLOc1FpSo",
    screenshots: ["/ClairObscurExpedition33.jpg"],
    aboutShort:
      "A stylish RPG with a surreal world and turn-based combat—join Expedition 33 on a desperate journey against a strange, repeating fate.",
    aboutLong:
      "Step into a haunting, painterly universe where beauty and dread live side by side. Lead a party of explorers as they push into the unknown, chasing answers and survival.\n\nCombat blends classic turn-based strategy with moments that reward timing and attention. Build your team, refine your tactics, and adapt to enemies that don’t fight fair.\n\nIt’s a story-driven adventure focused on atmosphere, character bonds, and the tension of time running out.",
  },

  "Cozy Grove": {
    developer: "Spry Fox",
    publisher: "The Quantum Astrophysicists Guild",
    releaseDate: "2021",
    reviewSummary: "Very Positive",
    trailerUrl: "https://www.youtube.com/watch?v=El5rjy_-MZI",
    screenshots: ["/CozyGrove.jpg"],
    aboutShort:
      "Camp on a haunted island and help friendly ghost bears—complete daily quests, decorate your campsite, and slowly bring color back to the world.",
    aboutLong:
      "You’re a Spirit Scout assigned to Cozy Grove, an ever-changing island with secrets and spirits who need your help.\n\nEach day brings new tasks: gather items, craft decorations, and learn the stories of ghostly residents. As you make progress, the island transforms—literally shifting from grayscale to vibrant color.\n\nPlay a little each day or binge longer sessions—Cozy Grove is gentle, charming, and designed to feel like a warm routine.",
  },

  Factorio: {
    developer: "Wube Software",
    publisher: "Wube Software",
    releaseDate: "2020",
    reviewSummary: "Overwhelmingly Positive",
    trailerUrl: "https://www.youtube.com/watch?v=J8SBp4SyvLc",
    screenshots: ["/Factorio.jpg"],
    aboutShort:
      "Build an automated factory from scratch—mine resources, design conveyor networks, and optimize production until the whole planet hums with machines.",
    aboutLong:
      "Start small with drills and furnaces, then scale into a sprawling web of belts, trains, robots, and circuitry.\n\nFactorio is all about logistics: balancing inputs and outputs, preventing bottlenecks, and continuously improving efficiency. Every upgrade unlocks new possibilities and new problems to solve.\n\nWhether you play peacefully or defend against hostile creatures, the goal stays the same: automate everything.",
  },

  GRIS: {
    developer: "Nomada Studio",
    publisher: "Devolver Digital",
    releaseDate: "2018",
    reviewSummary: "Very Positive",
    trailerUrl: "https://www.youtube.com/watch?v=v2z8NbmKDQI",
    screenshots: ["/GRIS.jpg"],
    aboutShort:
      "A serene, wordless journey through grief—explore a watercolor world that changes as you regain your voice and your colors.",
    aboutLong:
      "GRIS is a quiet platforming experience focused on mood, art, and emotion rather than combat.\n\nAs you travel, the environment unfolds like a living painting—new abilities reveal paths forward and bring life back to the landscape. Light puzzles and gentle traversal support the story’s themes.\n\nIt’s a short, memorable adventure designed to be felt as much as it’s played.",
  },

  "House Flipper": {
    developer: "Empyrean",
    publisher: "Frozen District",
    releaseDate: "2018",
    reviewSummary: "Mostly Positive",
    trailerUrl: "https://www.youtube.com/watch?v=nh4zuyi7vVM",
    screenshots: ["/HouseFlipper.jpg"],
    aboutShort:
      "Buy, renovate, and sell homes—clean up messes, fix broken rooms, and turn ugly spaces into satisfying before-and-after transformations.",
    aboutLong:
      "Take jobs to earn money, then invest in your own properties. Tear down walls, paint rooms, lay floors, install furniture, and make each house shine.\n\nHouse Flipper is about the satisfaction of progress: watching a messy room become clean, a broken place become livable, and a cheap property become profitable.\n\nGo for efficiency, style, or pure creative chaos—the tools are yours.",
  },

  Journey: {
    developer: "thatgamecompany",
    publisher: "Sony Interactive Entertainment",
    releaseDate: "2012",
    reviewSummary: "Overwhelmingly Positive",
    trailerUrl: "https://www.youtube.com/watch?v=Ie4izgUrUmw",
    screenshots: ["/Journey.jpg"],
    aboutShort:
      "Cross a vast desert toward a distant mountain in a beautiful, minimalist adventure—mysterious ruins, soft music, and quiet discovery.",
    aboutLong:
      "Journey is a poetic exploration game where movement and atmosphere tell the story.\n\nSlide down dunes, uncover ancient structures, and follow a silent path toward the summit. You may meet another traveler—communication is limited, but companionship can emerge naturally.\n\nIt’s short, elegant, and designed to leave an emotional afterglow.",
  },

  Littlewood: {
    developer: "Sean Young",
    publisher: "SmashGames",
    releaseDate: "2019",
    reviewSummary: "Very Positive",
    trailerUrl: "https://www.youtube.com/watch?v=_JxrF3QGBT8",
    screenshots: ["/Littlewood.jpg"],
    aboutShort:
      "After saving the world, you build a town—gather resources, design neighborhoods, and create a calm daily life with friendly villagers.",
    aboutLong:
      "Littlewood flips the classic RPG: the big battle is over, and now it’s time to rebuild.\n\nCollect materials, craft furniture, and place buildings wherever you want. Befriend residents, unlock new facilities, and shape your town to match your style.\n\nDays are measured by stamina instead of time, so you can play at a relaxed pace while still making steady progress.",
  },

  "Monument Valley": {
    developer: "ustwo games",
    publisher: "ustwo games",
    releaseDate: "2014",
    reviewSummary: "Very Positive",
    trailerUrl: "https://www.youtube.com/watch?v=mh_4JJNULZ0",
    screenshots: ["/MonumentValley.jpg"],
    aboutShort:
      "A puzzle journey through impossible architecture—rotate and slide the world itself to reveal hidden paths and gentle surprises.",
    aboutLong:
      "Guide a silent princess through dreamlike monuments inspired by optical illusions.\n\nEach level is a small sculpture you can manipulate: bridges appear where none existed, staircases bend reality, and perspective becomes the key to progress.\n\nMonument Valley is calm, elegant, and visually iconic—more like an interactive art piece than a traditional puzzle game.",
  },

  Moonlighter: {
    developer: "Digital Sun",
    publisher: "11 bit studios",
    releaseDate: "2018",
    reviewSummary: "Mostly Positive",
    trailerUrl: "https://www.youtube.com/watch?v=81FJurvZuOg",
    screenshots: ["/MoonLighter.jpg"],
    aboutShort:
      "By night you dungeon-crawl for loot—by day you run a shop. Balance risk, profit, and upgrades to grow both your gear and your business.",
    aboutLong:
      "Explore dangerous dungeons to collect relics, weapons, and valuables—then bring them home to sell at your storefront.\n\nSet prices, watch customer reactions, and learn what items are truly worth. Use profits to improve your shop, your town, and your combat loadout.\n\nMoonlighter blends action and management into a loop that’s addictive, cozy, and just a little risky.",
  },

  "Octopath Traveler": {
    developer: "Square Enix / Acquire",
    publisher: "Square Enix",
    releaseDate: "2018",
    reviewSummary: "Very Positive",
    trailerUrl: "https://www.youtube.com/watch?v=Fmi8KrntszI",
    screenshots: ["/OctopathTraveler.jpg"],
    aboutShort:
      "Eight travelers, eight stories—explore a classic fantasy world with modern visuals and strategic turn-based combat built around breaking enemy defenses.",
    aboutLong:
      "Choose from eight protagonists, each with their own path, motivations, and unique abilities.\n\nCombat rewards planning: exploit weaknesses to break enemies, then unleash boosted skills at the perfect moment. Between battles, use character talents to interact with the world in different ways.\n\nOctopath Traveler is a love letter to classic JRPGs—rich music, crisp pixel-art style, and a big world to roam.",
  },

  "Slime Rancher": {
    developer: "Monomi Park",
    publisher: "Monomi Park",
    releaseDate: "2017",
    reviewSummary: "Very Positive",
    trailerUrl: "https://www.youtube.com/watch?v=jDZUhN8pU9c",
    screenshots: ["/SlimeRancher.jpg"],
    aboutShort:
      "Run a colorful ranch on an alien world—collect adorable slimes, feed them, and build a thriving farm full of bouncy chaos.",
    aboutLong:
      "Explore a vibrant planet, vacuum up different slime species, and bring them back to your ranch to care for.\n\nEach slime has habits, favorite foods, and quirks that can create hilarious chain reactions. Expand your pens, automate harvesting, and trade plorts for upgrades.\n\nSlime Rancher is wholesome, bright, and surprisingly deep once you start optimizing your little ecosystem.",
  },

  Spiritfarer: {
    developer: "Thunder Lotus Games",
    publisher: "Thunder Lotus Games",
    releaseDate: "2020",
    reviewSummary: "Overwhelmingly Positive",
    trailerUrl: "https://www.youtube.com/watch?v=4pKJ-NuSjNE",
    screenshots: ["/Spiritfarer.jpg"],
    aboutShort:
      "A cozy management adventure about saying goodbye—build a boat, care for spirits, and guide them to the afterlife with kindness.",
    aboutLong:
      "As Stella, you ferry spirits across a beautiful sea. Build and upgrade your ship, grow food, cook meals, and craft comforts for your passengers.\n\nEach spirit has a story, preferences, and requests that deepen your connection. Eventually, you’ll help them accept their journey and let go.\n\nSpiritfarer is heartfelt and calm—full of warmth, humor, and moments that linger.",
  },

  Subnautica: {
    developer: "Unknown Worlds Entertainment",
    publisher: "Unknown Worlds Entertainment",
    releaseDate: "2018",
    reviewSummary: "Very Positive",
    trailerUrl: "https://www.youtube.com/watch?v=gz8H9VDzeqo",
    screenshots: ["/SubNautica.jpg"],
    aboutShort:
      "Crash-landed on an ocean planet, you must survive—dive into alien depths, craft gear, build a base, and uncover what happened here.",
    aboutLong:
      "Subnautica is survival with a sense of wonder: gather resources in shallow reefs, then descend into darker biomes where danger and beauty intensify.\n\nCraft tools, vehicles, and habitats to extend your reach. Manage oxygen and exploration risks while piecing together the planet’s mysteries.\n\nIt’s tense, immersive, and unforgettable—especially when the ocean goes quiet.",
  },

  "Super Mario Odyssey": {
    developer: "Nintendo",
    publisher: "Nintendo",
    releaseDate: "2017",
    reviewSummary: "Very Positive",
    trailerUrl: "https://www.youtube.com/watch?v=wGQHQc_3ycE",
    screenshots: ["/SuperMarioOdyssey.jpg"],
    aboutShort:
      "A globe-trotting 3D platformer—explore imaginative kingdoms, master movement, and use Cappy to capture enemies and objects in clever ways.",
    aboutLong:
      "Join Mario and Cappy on a playful adventure across diverse worlds packed with secrets.\n\nOdyssey focuses on freedom and experimentation: jump, dive, wall-kick, and chain moves together to reach hidden areas. Captures open new mechanics—from controlling creatures to becoming unexpected objects.\n\nIt’s vibrant, creative, and built around pure joy of exploration.",
  },

  "The Wandering Village": {
    developer: "Stray Fawn Studio",
    publisher: "Stray Fawn Studio",
    releaseDate: "2022",
    reviewSummary: "Positive",
    trailerUrl: "https://www.youtube.com/watch?v=Vr0JT7PjnE0",
    screenshots: ["/TheWanderingVillage.jpg"],
    aboutShort:
      "Build a settlement on the back of a giant wandering creature—manage resources, research tech, and survive a world filled with toxic spores.",
    aboutLong:
      "Your village lives on a colossal being named Onbu. You must expand carefully—farms, housing, production chains—while keeping both your people and Onbu healthy.\n\nDecide how to interact with your host: cooperate for mutual survival or push harder for growth at a cost. Explore new biomes, adapt to disasters, and plan around limited space.\n\nA thoughtful city-builder with a unique moving world and tough moral choices.",
  },
};

export function getGameMeta(title: string): GameMeta | undefined {
  return META_BY_TITLE[title];
}
