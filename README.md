## Bijuterii
Fiecare bijuterie are urmatorii parametri:

- `id` (string) → Identificator unic al bijuteriei
- `cod` (string) → Codul bijuteriei (ex: `I1`, `I2`)
- `categorie` (string) → Categoria bijuteriei (ex: `inel`, `cercei`)
- `pret` (number) → Pretul bijuteriei
- `pietre` (boolean) → Indica daca bijuteria are pietre (true/false)
- `data` (Date) → Data crearii sau modificarii bijuteriei

```js
const bijuterie = new Bijuterie({
  id: "1",
  cod: "I1",
  categorie: "inel",
  pret: 120,
  pietre: true,
  data: new Date()
});
