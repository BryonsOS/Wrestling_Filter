// Curated catalog of promotions, shows, and search queries.
// Each show maps to a YouTube search query tuned to surface full episodes,
// plus a preferred default sort ("chrono" parses dates from titles so you
// can watch in broadcast order; "newest" is for ongoing podcast feeds).

// Words that mark talk-about-it content rather than the shows themselves.
// Applied to every section except Podcasts/Interviews (talk: true) and
// the user's own custom searches. Matched as lowercase substrings.
const GLOBAL_EXCLUDE = [
  "podcast", "review", "react", "watch along", "watchalong", "preview",
  "prediction", "recap", "top 10", "top ten", "tier list", "ranking",
  " 2k", "unboxing", "action figure", "gameplay",
];

// Appended to the YouTube search for non-talk sections so junk mostly
// never comes back in the first place.
const QUERY_NEGATIVES = " -podcast -review -reaction -preview -recap";

// Official channels get top billing and an OFFICIAL badge. When one of
// these has an event, other uploads with the same broadcast date in the
// section are hidden as duplicates. Lowercase, matched exactly.
const PREFERRED_CHANNELS = [
  "wwe vault", "wwe", "wwe español",
  "tna wrestling", "impact wrestling",
  "major league wrestling", "mlw",
  "new japan pro-wrestling", "njpw global", "njpwworld",
];

const CATALOG = [
  {
    id: "wwe",
    name: "WWE / WWF",
    icon: "🏆",
    color: "#d32f2f",
    shows: [
      { id: "wwf-raw-classic", name: "Raw (Classic Era)", query: "WWF Monday Night Raw full episode 199", require: ["raw"], sort: "chrono" },
      { id: "wwe-raw", name: "Raw (Modern)", query: "WWE Raw full episode", require: ["raw"], sort: "chrono" },
      { id: "wwf-smackdown-classic", name: "SmackDown (Classic Era)", query: "WWF SmackDown full episode 199", require: ["smackdown"], sort: "chrono" },
      { id: "wwf-superstars", name: "Superstars of Wrestling", query: "WWF Superstars of Wrestling full episode", require: ["superstars"], sort: "chrono" },
      { id: "wwf-primetime", name: "Prime Time Wrestling", query: "WWF Prime Time Wrestling full episode", require: ["prime time", "primetime"], sort: "chrono" },
      { id: "wwf-snme", name: "Saturday Night's Main Event", query: "WWF Saturday Night's Main Event full episode", require: ["main event", "snme"], sort: "chrono" },
      { id: "wwf-tnt", name: "Tuesday Night Titans", query: "WWF Tuesday Night Titans full episode", require: ["titans", "tnt"], sort: "chrono" },
      { id: "wwf-wrestling-challenge", name: "Wrestling Challenge", query: "WWF Wrestling Challenge full episode", require: ["challenge"], sort: "chrono" },
      { id: "wwf-ppv", name: "PPVs & Big Events", query: "WWF pay per view full show", require: ["wwf", "wwe"], sort: "chrono" },
      { id: "wwf-golden-era", name: "Golden Era Matches", query: "WWF 1980s full match Hulk Hogan Randy Savage", require: ["wwf", "wwe"], sort: "chrono" },
    ],
  },
  {
    id: "wcw",
    name: "WCW",
    icon: "⚡",
    color: "#fbc02d",
    shows: [
      { id: "wcw-nitro", name: "Monday Nitro", query: "WCW Monday Nitro full episode", require: ["nitro"], sort: "chrono" },
      { id: "wcw-thunder", name: "Thunder", query: "WCW Thunder full episode", require: ["thunder"], sort: "chrono" },
      { id: "wcw-saturday-night", name: "Saturday Night", query: "WCW Saturday Night full episode", require: ["saturday"], sort: "chrono" },
      { id: "wcw-worldwide", name: "WorldWide", query: "WCW WorldWide full episode", require: ["worldwide", "world wide"], sort: "chrono" },
      { id: "wcw-main-event", name: "Main Event", query: "WCW Main Event full episode", require: ["main event"], sort: "chrono" },
      { id: "wcw-ppv", name: "PPVs (Starrcade, Halloween Havoc…)", query: "WCW pay per view full show", require: ["wcw"], sort: "chrono" },
      { id: "nwa-crockett", name: "NWA / Jim Crockett Era", query: "NWA World Championship Wrestling 198 full episode", require: ["nwa", "crockett", "world championship wrestling"], sort: "chrono" },
      { id: "wcw-nwo", name: "nWo Storyline", query: "WCW nWo segment full", require: ["nwo", "wcw"], sort: "chrono" },
    ],
  },
  {
    id: "ecw",
    name: "ECW",
    icon: "🔥",
    color: "#7b1fa2",
    shows: [
      { id: "ecw-hardcore-tv", name: "Hardcore TV", query: "ECW Hardcore TV full episode", require: ["ecw"], sort: "chrono" },
      { id: "ecw-on-tnn", name: "ECW on TNN", query: "ECW on TNN full episode", require: ["ecw"], sort: "chrono" },
      { id: "ecw-ppv", name: "PPVs (Barely Legal, Heat Wave…)", query: "ECW pay per view full show 199", require: ["ecw"], sort: "chrono" },
      { id: "ecw-matches", name: "Classic Matches", query: "ECW full match extreme championship wrestling", require: ["ecw", "extreme championship"], sort: "chrono" },
    ],
  },
  {
    id: "tna",
    name: "TNA / Impact",
    icon: "🔷",
    color: "#1565c0",
    shows: [
      { id: "nwa-tna-weekly", name: "Weekly PPV Era (2002–04)", query: "NWA TNA weekly PPV 2002 full show", require: ["tna", "nwa"], sort: "chrono" },
      { id: "tna-impact-classic", name: "Impact (2004–09)", query: "TNA Impact 200 full episode", require: ["impact", "tna"], sort: "chrono" },
      { id: "tna-impact-2010s", name: "Impact (2010s)", query: "TNA Impact Wrestling 201 full episode", require: ["impact", "tna"], sort: "chrono" },
      { id: "tna-current", name: "TNA (Current)", query: "TNA Wrestling full episode", require: ["tna"], sort: "newest" },
      { id: "tna-xplosion", name: "Xplosion", query: "TNA Xplosion full episode", require: ["xplosion"], sort: "chrono" },
      { id: "tna-ppv", name: "PPVs (Bound for Glory, Slammiversary…)", query: "TNA pay per view full event", require: ["tna"], sort: "chrono" },
      { id: "tna-classic-matches", name: "Classic Matches (X Division & more)", query: "TNA full match AJ Styles Samoa Joe Kurt Angle", require: ["tna"], sort: "chrono" },
    ],
  },
  {
    id: "njpw",
    name: "NJPW",
    icon: "🦁",
    color: "#c9a227",
    shows: [
      { id: "njpw-matches", name: "Full Matches (Official Uploads)", query: "NJPW full match njpwworld", require: ["njpw", "new japan"], sort: "newest" },
      { id: "njpw-wrestle-kingdom", name: "Wrestle Kingdom", query: "NJPW Wrestle Kingdom full match", require: ["wrestle kingdom"], sort: "chrono" },
      { id: "njpw-g1", name: "G1 Climax", query: "NJPW G1 Climax full match", require: ["g1"], sort: "chrono" },
      { id: "njpw-bosj", name: "Best of the Super Juniors", query: "NJPW Best of the Super Juniors full match", require: ["super junior", "bosj"], sort: "chrono" },
      { id: "njpw-classic", name: "Classic NJPW (80s–90s)", query: "New Japan Pro Wrestling classic full match 199", require: ["njpw", "new japan"], sort: "chrono" },
      { id: "njpw-strong", name: "NJPW Strong / US Shows", query: "NJPW Strong full episode", require: ["njpw", "new japan"], sort: "chrono" },
    ],
  },
  {
    id: "mlw",
    name: "MLW",
    icon: "🥊",
    color: "#00695c",
    shows: [
      { id: "mlw-fusion", name: "Fusion", query: "MLW Fusion full episode", require: ["mlw", "fusion"], sort: "chrono" },
      { id: "mlw-underground", name: "Underground (2002–04)", query: "MLW Underground full episode", require: ["mlw", "underground"], sort: "chrono" },
      { id: "mlw-events", name: "Big Events & PPVs", query: "MLW full event Battle Riot", require: ["mlw"], sort: "chrono" },
    ],
  },
  {
    id: "xwf",
    name: "XWF (2001–02)",
    icon: "🎬",
    color: "#e64a19",
    shows: [
      { id: "xwf-tapings", name: "The Universal Studios Tapings", query: "\"Xtreme Wrestling Federation\" 2001 Universal Studios -backyard", require: ["xwf", "xtreme wrestling federation"], exclude: ["backyard", "byw"], sort: "chrono" },
      { id: "xwf-matches", name: "Matches & Segments", query: "\"Xtreme Wrestling Federation\" Jimmy Hart 2001 2002 -backyard", require: ["xwf", "xtreme wrestling federation"], exclude: ["backyard", "byw"], sort: "chrono" },
    ],
  },
  {
    id: "fmw",
    name: "FMW",
    icon: "🧨",
    color: "#ad1457",
    shows: [
      { id: "fmw-shows", name: "Full Shows & Events", query: "FMW wrestling full show Frontier Martial Arts", require: ["fmw", "frontier martial"], sort: "chrono" },
      { id: "fmw-onita", name: "Onita Deathmatches", query: "FMW Atsushi Onita deathmatch full match", require: ["onita", "fmw"], sort: "chrono" },
      { id: "fmw-hayabusa", name: "Hayabusa Era", query: "FMW Hayabusa full match", require: ["hayabusa", "fmw"], sort: "chrono" },
    ],
  },
  {
    id: "territories",
    name: "Territories",
    icon: "🗺️",
    color: "#388e3c",
    shows: [
      { id: "mid-south", name: "Mid-South / UWF", query: "Mid-South Wrestling full episode Bill Watts", require: ["mid-south", "mid south", "uwf"], sort: "chrono" },
      { id: "wccw", name: "World Class (WCCW)", query: "World Class Championship Wrestling full episode", require: ["world class", "wccw"], sort: "chrono" },
      { id: "memphis", name: "Memphis / CWA", query: "Memphis wrestling CWA full episode Lance Russell", require: ["memphis", "cwa", "uswa"], sort: "chrono" },
      { id: "awa", name: "AWA", query: "AWA All-Star Wrestling full episode", require: ["awa"], sort: "chrono" },
      { id: "georgia", name: "Georgia Championship Wrestling", query: "Georgia Championship Wrestling full episode", require: ["georgia"], sort: "chrono" },
      { id: "florida", name: "Championship Wrestling from Florida", query: "Championship Wrestling from Florida full episode", require: ["florida", "cwf"], sort: "chrono" },
      { id: "stampede", name: "Stampede Wrestling", query: "Stampede Wrestling full episode Calgary", require: ["stampede"], sort: "chrono" },
      { id: "portland", name: "Portland Wrestling", query: "Portland Wrestling full episode Don Owen", require: ["portland"], sort: "chrono" },
      { id: "continental", name: "Continental / Southeastern", query: "Continental Championship Wrestling full episode", require: ["continental", "southeastern"], sort: "chrono" },
      { id: "smoky-mountain", name: "Smoky Mountain Wrestling", query: "Smoky Mountain Wrestling full episode", require: ["smoky mountain", "smw"], sort: "chrono" },
      { id: "world-of-sport", name: "World of Sport (UK)", query: "World of Sport wrestling full episode British", require: ["world of sport"], sort: "chrono" },
    ],
  },
  {
    id: "interviews",
    name: "Interviews",
    icon: "🎤",
    color: "#1976d2",
    talk: true,
    shows: [
      { id: "shoot-interviews", name: "Shoot Interviews", query: "wrestling shoot interview full", sort: "newest" },
      { id: "kayfabe-commentaries", name: "Kayfabe Commentaries", query: "Kayfabe Commentaries YouShoot interview", sort: "newest" },
      { id: "legends-interviews", name: "Legend Sit-Downs", query: "wrestling legend full interview career", sort: "newest" },
      { id: "classic-promos", name: "Classic Promos", query: "greatest wrestling promos compilation", sort: "newest" },
      { id: "documentaries", name: "Documentaries", query: "pro wrestling documentary full", sort: "newest" },
    ],
  },
  {
    id: "podcasts",
    name: "Podcasts",
    icon: "🎧",
    color: "#f57c00",
    talk: true,
    shows: [
      { id: "something-to-wrestle", name: "Something to Wrestle (Prichard)", query: "Something to Wrestle Bruce Prichard full episode", sort: "newest" },
      { id: "83-weeks", name: "83 Weeks (Bischoff)", query: "83 Weeks Eric Bischoff full episode", sort: "newest" },
      { id: "grilling-jr", name: "Grilling JR (Jim Ross)", query: "Grilling JR Jim Ross full episode", sort: "newest" },
      { id: "kurt-angle", name: "The Kurt Angle Show", query: "Kurt Angle Show podcast full episode", sort: "newest" },
      { id: "talk-is-jericho", name: "Talk Is Jericho", query: "Talk Is Jericho full episode", sort: "newest" },
      { id: "cornette", name: "Jim Cornette", query: "Jim Cornette Experience full episode", sort: "newest" },
      { id: "insiders", name: "Insiders & Deep Dives", query: "wrestling podcast full episode behind the scenes", sort: "newest" },
    ],
  },
];
