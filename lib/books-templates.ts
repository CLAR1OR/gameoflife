export type BookTemplate = {
  title: string;
  authors: string;
  year?: number;
  isbn?: string;
};

export type ReadingListTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  coverImage?: string;
  books: BookTemplate[];
};

export const READING_LIST_TEMPLATES: ReadingListTemplate[] = [
  {
    id: "hesse-major",
    name: "Hermann Hesse — Major Works",
    description:
      "The essential Hesse: the big philosophical novels that defined his voice.",
    icon: "🧘",
    books: [
      { title: "Siddhartha", authors: "Hermann Hesse", year: 1922, isbn: "9780553208849" },
      { title: "Steppenwolf", authors: "Hermann Hesse", year: 1927, isbn: "9780312278670" },
      { title: "The Glass Bead Game", authors: "Hermann Hesse", year: 1943, isbn: "9780312278496" },
      { title: "Demian", authors: "Hermann Hesse", year: 1919, isbn: "9780060931919" },
      { title: "Narcissus and Goldmund", authors: "Hermann Hesse", year: 1930, isbn: "9780312422288" },
      { title: "The Journey to the East", authors: "Hermann Hesse", year: 1932, isbn: "9780312422585" },
      { title: "Beneath the Wheel", authors: "Hermann Hesse", year: 1906, isbn: "9780312422301" },
      { title: "Knulp", authors: "Hermann Hesse", year: 1915, isbn: "9780312422295" },
      { title: "Gertrude", authors: "Hermann Hesse", year: 1910, isbn: "9780312422318" },
      { title: "Rosshalde", authors: "Hermann Hesse", year: 1914, isbn: "9780312422646" },
      { title: "Peter Camenzind", authors: "Hermann Hesse", year: 1904, isbn: "9780312422639" },
    ],
  },
  {
    id: "russian-classics",
    name: "Russian Classics — The Essentials",
    description:
      "The cornerstone novels of 19th-century Russian literature.",
    icon: "🇷🇺",
    books: [
      { title: "Crime and Punishment", authors: "Fyodor Dostoevsky", year: 1866, isbn: "9780679734505" },
      { title: "The Brothers Karamazov", authors: "Fyodor Dostoevsky", year: 1880, isbn: "9780374528379" },
      { title: "Notes from Underground", authors: "Fyodor Dostoevsky", year: 1864, isbn: "9780679734529" },
      { title: "The Idiot", authors: "Fyodor Dostoevsky", year: 1869, isbn: "9780375702242" },
      { title: "War and Peace", authors: "Leo Tolstoy", year: 1869, isbn: "9781400079988" },
      { title: "Anna Karenina", authors: "Leo Tolstoy", year: 1878, isbn: "9780143035008" },
      { title: "The Death of Ivan Ilyich", authors: "Leo Tolstoy", year: 1886, isbn: "9780553210354" },
      { title: "Dead Souls", authors: "Nikolai Gogol", year: 1842, isbn: "9780679776444" },
      { title: "Fathers and Sons", authors: "Ivan Turgenev", year: 1862, isbn: "9780375708800" },
      { title: "The Master and Margarita", authors: "Mikhail Bulgakov", year: 1967, isbn: "9780141180144" },
    ],
  },
  {
    id: "nobel-recent",
    name: "Nobel Prize in Literature — Recent Winners",
    description: "One iconic book from each of the most recent Nobel laureates.",
    icon: "🏅",
    books: [
      { title: "The Remains of the Day", authors: "Kazuo Ishiguro", year: 1989, isbn: "9780679731726" },
      { title: "Beloved", authors: "Toni Morrison", year: 1987, isbn: "9781400033416" },
      { title: "The Vegetarian", authors: "Han Kang", year: 2007, isbn: "9781101906118" },
      { title: "Annie John", authors: "Jamaica Kincaid", year: 1985 },
      { title: "The Brief Wondrous Life of Oscar Wao", authors: "Junot Díaz", year: 2007, isbn: "9781594483295" },
      { title: "Disgrace", authors: "J.M. Coetzee", year: 1999, isbn: "9780143036371" },
      { title: "One Hundred Years of Solitude", authors: "Gabriel García Márquez", year: 1967, isbn: "9780060883287" },
      { title: "Never Let Me Go", authors: "Kazuo Ishiguro", year: 2005, isbn: "9781400078776" },
    ],
  },
  {
    id: "dystopian-classics",
    name: "Dystopian Classics",
    description: "The shelf every imagined future rests on.",
    icon: "🔥",
    books: [
      { title: "1984", authors: "George Orwell", year: 1949, isbn: "9780451524935" },
      { title: "Brave New World", authors: "Aldous Huxley", year: 1932, isbn: "9780060850524" },
      { title: "Fahrenheit 451", authors: "Ray Bradbury", year: 1953, isbn: "9781451673319" },
      { title: "The Handmaid's Tale", authors: "Margaret Atwood", year: 1985, isbn: "9780385490818" },
      { title: "We", authors: "Yevgeny Zamyatin", year: 1924, isbn: "9780140185850" },
      { title: "A Clockwork Orange", authors: "Anthony Burgess", year: 1962, isbn: "9780393341768" },
      { title: "The Giver", authors: "Lois Lowry", year: 1993, isbn: "9780544336261" },
      { title: "Never Let Me Go", authors: "Kazuo Ishiguro", year: 2005, isbn: "9781400078776" },
    ],
  },
  {
    id: "kafka-complete",
    name: "Franz Kafka — Novels & Stories",
    description: "Every complete novel plus the essential short fiction.",
    icon: "🪲",
    books: [
      { title: "The Trial", authors: "Franz Kafka", year: 1925, isbn: "9780805210408" },
      { title: "The Castle", authors: "Franz Kafka", year: 1926, isbn: "9780805211061" },
      { title: "The Metamorphosis", authors: "Franz Kafka", year: 1915, isbn: "9780553213690" },
      { title: "Amerika", authors: "Franz Kafka", year: 1927, isbn: "9780805211603" },
      { title: "The Complete Stories", authors: "Franz Kafka", isbn: "9780805210552" },
      { title: "Letters to Milena", authors: "Franz Kafka", isbn: "9780805212655" },
    ],
  },
  {
    id: "scifi-foundations",
    name: "Sci-Fi Foundations",
    description: "The novels that built modern science fiction.",
    icon: "🚀",
    books: [
      { title: "Dune", authors: "Frank Herbert", year: 1965, isbn: "9780441172719" },
      { title: "Foundation", authors: "Isaac Asimov", year: 1951, isbn: "9780553293357" },
      { title: "Hyperion", authors: "Dan Simmons", year: 1989, isbn: "9780553283686" },
      { title: "Neuromancer", authors: "William Gibson", year: 1984, isbn: "9780441569595" },
      { title: "The Left Hand of Darkness", authors: "Ursula K. Le Guin", year: 1969, isbn: "9780441478125" },
      { title: "Do Androids Dream of Electric Sheep?", authors: "Philip K. Dick", year: 1968, isbn: "9780345404473" },
      { title: "Stranger in a Strange Land", authors: "Robert A. Heinlein", year: 1961, isbn: "9780441790340" },
      { title: "Ender's Game", authors: "Orson Scott Card", year: 1985, isbn: "9780812550702" },
      { title: "Snow Crash", authors: "Neal Stephenson", year: 1992, isbn: "9780553380958" },
      { title: "The Three-Body Problem", authors: "Liu Cixin", year: 2008, isbn: "9780765382030" },
    ],
  },
  {
    id: "fantasy-cornerstones",
    name: "Fantasy Cornerstones",
    description: "Tolkien and the giants who built on him.",
    icon: "🗡️",
    books: [
      { title: "The Hobbit", authors: "J.R.R. Tolkien", year: 1937, isbn: "9780547928227" },
      { title: "The Fellowship of the Ring", authors: "J.R.R. Tolkien", year: 1954, isbn: "9780547928210" },
      { title: "The Two Towers", authors: "J.R.R. Tolkien", year: 1954, isbn: "9780547928203" },
      { title: "The Return of the King", authors: "J.R.R. Tolkien", year: 1955, isbn: "9780547928197" },
      { title: "A Wizard of Earthsea", authors: "Ursula K. Le Guin", year: 1968, isbn: "9780547722023" },
      { title: "The Name of the Wind", authors: "Patrick Rothfuss", year: 2007, isbn: "9780756404741" },
      { title: "The Final Empire (Mistborn)", authors: "Brandon Sanderson", year: 2006, isbn: "9780765350381" },
      { title: "The Fifth Season", authors: "N.K. Jemisin", year: 2015, isbn: "9780316229296" },
      { title: "The Lies of Locke Lamora", authors: "Scott Lynch", year: 2006, isbn: "9780553588941" },
      { title: "Assassin's Apprentice", authors: "Robin Hobb", year: 1995, isbn: "9780553573398" },
    ],
  },
  {
    id: "murakami-major",
    name: "Haruki Murakami — Major Novels",
    description: "Jazz clubs, talking cats, parallel worlds. Do the journey in order.",
    icon: "🐱",
    books: [
      { title: "A Wild Sheep Chase", authors: "Haruki Murakami", year: 1982, isbn: "9780375718946" },
      { title: "Hard-Boiled Wonderland and the End of the World", authors: "Haruki Murakami", year: 1985, isbn: "9780679743460" },
      { title: "Norwegian Wood", authors: "Haruki Murakami", year: 1987, isbn: "9780375704024" },
      { title: "Dance Dance Dance", authors: "Haruki Murakami", year: 1988, isbn: "9780679753797" },
      { title: "South of the Border, West of the Sun", authors: "Haruki Murakami", year: 1992, isbn: "9780679767398" },
      { title: "The Wind-Up Bird Chronicle", authors: "Haruki Murakami", year: 1995, isbn: "9780679775430" },
      { title: "Sputnik Sweetheart", authors: "Haruki Murakami", year: 1999, isbn: "9780375726057" },
      { title: "Kafka on the Shore", authors: "Haruki Murakami", year: 2002, isbn: "9781400079278" },
      { title: "After Dark", authors: "Haruki Murakami", year: 2004, isbn: "9780307278739" },
      { title: "1Q84", authors: "Haruki Murakami", year: 2009, isbn: "9780307476463" },
    ],
  },
  {
    id: "modernist-fiction",
    name: "Modernist Fiction — The Canon",
    description: "Stream of consciousness, fragmented time, disillusion. The early 20th century in one shelf.",
    icon: "✒️",
    books: [
      { title: "Ulysses", authors: "James Joyce", year: 1922, isbn: "9780679722762" },
      { title: "To the Lighthouse", authors: "Virginia Woolf", year: 1927, isbn: "9780156907392" },
      { title: "Mrs Dalloway", authors: "Virginia Woolf", year: 1925, isbn: "9780156628709" },
      { title: "The Sound and the Fury", authors: "William Faulkner", year: 1929, isbn: "9780679732242" },
      { title: "Swann's Way", authors: "Marcel Proust", year: 1913, isbn: "9780375751547" },
      { title: "The Waste Land", authors: "T.S. Eliot", year: 1922, isbn: "9780393974997" },
      { title: "The Sun Also Rises", authors: "Ernest Hemingway", year: 1926, isbn: "9780743297332" },
      { title: "The Great Gatsby", authors: "F. Scott Fitzgerald", year: 1925, isbn: "9780743273565" },
    ],
  },
  {
    id: "short-novels",
    name: "Short Novels Worth Your Time",
    description: "Under 200 pages. Every one of these hits hard.",
    icon: "📗",
    books: [
      { title: "Of Mice and Men", authors: "John Steinbeck", year: 1937, isbn: "9780140177398" },
      { title: "The Old Man and the Sea", authors: "Ernest Hemingway", year: 1952, isbn: "9780684801223" },
      { title: "Animal Farm", authors: "George Orwell", year: 1945, isbn: "9780451526342" },
      { title: "Candide", authors: "Voltaire", year: 1759, isbn: "9780140440041" },
      { title: "Heart of Darkness", authors: "Joseph Conrad", year: 1899, isbn: "9780553212143" },
      { title: "The Stranger", authors: "Albert Camus", year: 1942, isbn: "9780679720201" },
      { title: "The Metamorphosis", authors: "Franz Kafka", year: 1915, isbn: "9780553213690" },
      { title: "We Have Always Lived in the Castle", authors: "Shirley Jackson", year: 1962, isbn: "9780143039976" },
      { title: "The Little Prince", authors: "Antoine de Saint-Exupéry", year: 1943, isbn: "9780156012195" },
      { title: "Siddhartha", authors: "Hermann Hesse", year: 1922, isbn: "9780553208849" },
    ],
  },
];

export function getReadingListTemplate(id: string): ReadingListTemplate | undefined {
  return READING_LIST_TEMPLATES.find((t) => t.id === id);
}
