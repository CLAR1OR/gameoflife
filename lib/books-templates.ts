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
];

export function getReadingListTemplate(id: string): ReadingListTemplate | undefined {
  return READING_LIST_TEMPLATES.find((t) => t.id === id);
}
