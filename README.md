# Kalamata Today

Ειδησεογραφική ιστοσελίδα για την Καλαμάτα και τη Μεσσηνία, με μαύρο και πορτοκαλί θέμα.

## Αρχεία

- `index.html`: η δομή της σελίδας
- `style.css`: το θέμα (μαύρο/πορτοκαλί) και το responsive layout
- `script.js`: η αναζήτηση, τα φίλτρα κατηγοριών, το ticker και ο καιρός
- `news.json`: οι ειδήσεις και τα έκτακτα του ticker
- `admin.html`, `admin.js`, `admin.css`: η σελίδα διαχείρισης

## Διαχείριση ειδήσεων

Ανοίξτε το `https://argirisevgenikos6.github.io/Kalamata-Today/admin.html`.
Από εκεί προσθέτετε, διορθώνετε και διαγράφετε ειδήσεις (με φωτογραφία) και αλλάζετε τα έκτακτα.
Κάθε αλλαγή αποθηκεύεται στο `news.json` του repo και εμφανίζεται στο site σε περίπου 1 λεπτό.

Την πρώτη φορά χρειάζεται ένα GitHub token (οδηγίες μέσα στη σελίδα σύνδεσης):
Fine-grained token → μόνο το repo **Kalamata-Today** → **Contents: Read and write**.
Το token μένει αποθηκευμένο μόνο στον browser σας. Χωρίς αυτό η σελίδα admin δεν μπορεί να αλλάξει τίποτα.

Οι ειδήσεις που υπάρχουν τώρα είναι **δείγματα** — διαγράψτε τις από τη σελίδα admin όταν βάλετε τις δικές σας.

## Δημοσίευση με GitHub Pages

1. Settings → Pages
2. Source: **Deploy from a branch**, Branch: **main**, φάκελος **/ (root)**
3. Η σελίδα θα είναι διαθέσιμη στο `https://argirisevgenikos6.github.io/Kalamata-Today/`
