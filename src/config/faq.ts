// =============================================================
// FAQ on the home page ("Najczęstsze pytania"). Answers come from Oskar —
// add a question here and it shows up on the page and in Google's
// structured data (FAQPage) at the same time.
// =============================================================

export type FaqItem = { question: string; answer: string };

export const FAQ: FaqItem[] = [
  {
    question: "Ile zajmuje cały proces zakupu ubezpieczenia?",
    answer:
      "Najczęściej mieścimy się w 45 minutach — w pełni zdalnie, na spotkaniu w Microsoft Teams. Jeśli wolisz, spotkamy się też na żywo.",
  },
  {
    question: "Ile kosztuje ubezpieczenie na życie i zdrowie?",
    answer:
      "Ceny zaczynają się od 39 zł miesięcznie, a górnego limitu nie ma. Ostateczna składka zależy od zakresu ochrony, który wybierzesz.",
  },
  {
    question: "Czy za Waszą pomoc płacę coś dodatkowo?",
    answer:
      "Nie. Nasze wsparcie masz za darmo — od pierwszej rozmowy aż po wypłatę świadczenia (odpukać!).",
  },
  {
    question: "Mam ubezpieczenie grupowe w pracy. Czy potrzebuję jeszcze indywidualnego?",
    answer:
      "Nie chodzi o to, żeby coś Ci dosprzedać. Ubezpieczenie grupowe jest stosunkowo tanie i ma szeroki zakres, ale jego główny minus to zwykle niskie wypłaty przy chorobach. Z kolei np. pobyty w szpitalu często bardziej opłacają się właśnie w grupowym. Chętnie sprawdzimy, czego Ci brakuje.",
  },
  {
    question: "Od kiedy działa ochrona? Czy jest karencja?",
    answer:
      "Ubezpieczenie zwykle zaczyna działać drugiego dnia roboczego po uruchomieniu. Niektóre zdarzenia mają karencję — np. 3 miesiące w umowach na wypadek nowotworu albo 12 miesięcy od początku umowy w przypadku śmierci samobójczej.",
  },
  {
    question: "Czy potrzebne są badania lekarskie albo dokumenty?",
    answer:
      "To zależy od umowy. Przy ubezpieczeniu wypadkowym nie są potrzebne żadne informacje o stanie zdrowia. Przy pozostałych wypełniasz ankietę medyczną — jeśli na pytania odpowiadasz „nie”, żadna dokumentacja nie jest potrzebna. Pamiętaj tylko, żeby podawać prawdziwe informacje.",
  },
  {
    question: "Czy pomagacie, gdy trzeba zgłosić zdarzenie i odebrać wypłatę?",
    answer:
      "Tak. Gdy zdecydujesz się na współpracę z nami, jesteśmy zawsze pod telefonem — pomagamy przy zgłoszeniu i odpowiadamy na każde pytanie.",
  },
  {
    question: "Czy mogę zmienić polisę albo z niej zrezygnować?",
    answer:
      "Tak. Zmiany w ubezpieczeniu są możliwe, a my pomożemy je przeprowadzić. Ubezpieczenia w Polsce są dobrowolne — ochrona wygasa choćby po nieopłaceniu dwóch składek. Nad bezpieczeństwem klientów czuwa Komisja Nadzoru Finansowego (KNF).",
  },
  {
    question: "Czy mogę mieć kilka polis na życie naraz?",
    answer: "Tak. Nie ma limitu liczby ubezpieczeń.",
  },
  {
    question: "Czy ubezpieczenie na życie jest obowiązkowe przy kredycie hipotecznym?",
    answer:
      "I tak, i nie. Banki najczęściej wymagają go przy zawieraniu umowy kredytowej, ale prawnie kredytobiorca nie ma takiego obowiązku.",
  },
  {
    question: "Czy spotkanie musi być online?",
    answer: "Nie. Chętnie spotkamy się na żywo, jeśli mieszkasz maksymalnie 100 km od Katowic.",
  },
];
