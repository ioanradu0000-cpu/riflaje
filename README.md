# PCforge Web

Aplicatie web completa pentru vanzarea de riflaje, impartita in trei parti:

- `client` - website public pentru clienti
- `admin` - panou separat pentru administrare
- `server` - API Node.js + Express, cu date salvate in `server/data/db.json`

Include cos de cumparaturi, checkout, colectii de produse, calcul livrare, transfer bancar si administrare comenzi.

## Rulare

Instaleaza dependintele din root:

```bash
npm install
```

Porneste toate cele trei aplicatii:

```bash
npm run dev
```

URL-uri locale:

- Website public: `http://localhost:5173`
- Admin panel: `http://localhost:5174`
- Backend API: `http://localhost:4000`

## Login admin

Pentru dezvoltare locala, daca nu setezi `.env`, backendul foloseste:

- User: `admin`
- Parola: `admin123`

Pentru configurare reala, copiaza `server/.env.example` in `server/.env` si seteaza:

```bash
ADMIN_USER=admin
ADMIN_PASSWORD_HASH=hash_bcrypt
JWT_SECRET=secret_lung_random
```

Frontendul admin nu contine parola hardcodata. Autentificarea foloseste cookie `httpOnly`.

## Notificari email

Backendul poate trimite email automat pentru:

- comanda noua
- schimbare status comanda
- schimbare status plata

Varianta 1: SMTP clasic, bun pentru local sau Render platit:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@example.com
SMTP_PASS=parola_smtp
SMTP_FROM="DesignRiflaje <no-reply@example.com>"
NOTIFICATION_EMAIL=comenzi@siteul-tau.ro
```

Varianta 2: Resend API, recomandata pentru Render Free:

```bash
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM="DesignRiflaje <onboarding@resend.dev>"
NOTIFICATION_EMAIL=designriflaje@gmail.com
```

Observatii:

- daca `NOTIFICATION_EMAIL` lipseste, se foloseste emailul setat in admin la `Setari`
- daca `RESEND_API_KEY` exista, backendul foloseste Resend prin HTTPS
- daca `RESEND_API_KEY` lipseste, backendul incearca SMTP
- daca nici Resend, nici SMTP nu sunt configurate corect, comenzile merg in continuare, dar nu se trimite niciun email
- pe Render Free, conexiunile SMTP pe porturile `25`, `465` si `587` sunt blocate, deci Gmail SMTP nu va functiona acolo

## Cum modifici datele

Nu trebuie sa editezi codul pentru produse, preturi sau contact.

Intra in admin panel, apoi:

- adaugi produs din formularul `Adauga produs`
- editezi produs cu butonul `Edit`
- stergi produs cu butonul `Sterge`
- adaugi mai multe imagini la produs in `Poze produs`, cu butonul `Adauga poza`
- setezi zoom-ul fiecarei poze de produs din sliderul/inputul `Zoom poza`
- muti fiecare poza in rama cu sagetile si slider-ele `Stanga / dreapta` si `Sus / jos`
- reordonezi pozele cu sagetile sus/jos; prima poza din lista este poza principala
- setezi `Latime utila panou (mm)` si `Lungime / inaltime panou (mm)` pentru calculatorul de necesar
- adaugi poze `cu riflaje` si `fara riflaje` pentru comparatia cu switch de pe pagina produsului
- setezi daca produsul este `Activ` sau `Disponibil`
- creezi colectii din tabul `Colectii`, adaugi poze pentru colectie si bifezi produsele incluse
- vezi comenzile in sectiunea `Comenzi`
- confirmi manual plata sau schimbi statusul comenzii
- modifici `Titlu site`, `Logo URL`, vizibilitatea titlului, `Text principal`, slideshow-ul `Poze meniu principal`, `Email`, `Telefon`, `WhatsApp`, date bancare si costul livrarii din `Setari`
- modifici `URL site public`, `SEO title`, `SEO description` si `SEO image URL` din `Setari` pentru titlul paginii, descrierea din rezultate si preview-urile cand linkul este distribuit
- poti seta emailul public de contact in `Setari`; el poate fi folosit si ca destinatar implicit pentru notificari daca nu setezi `NOTIFICATION_EMAIL`

Serverul salveaza modificarile in:

```text
server/data/db.json
```

Atentie pentru productie pe Render Free:

- fisierul `server/data/db.json` nu este stocare persistenta
- dupa redeploy sau restart, modificarile pot disparea
- pentru produse, comenzi si setari care raman salvate, foloseste o baza de date sau un disk persistent pe un plan compatibil

## Livrare si plata

- Livrare gratuita pentru `Iasi`, inclusiv variante precum `Iași`, `IAȘI`, `iasi` sau `Municipiul Iasi`.
- Pentru alte localitati, livrarea este calculata per bucata comandata.
- Costul implicit este `10 lei / bucata`, editabil din admin.
- Plata este exclusiv prin transfer bancar.
- Comanda ramane cu status `In asteptarea platii` pana cand adminul confirma manual plata.

## Calculator riflaje

Calculatorul de pe pagina produsului presupune montaj vertical. El calculeaza cate fasii sunt necesare pe latimea peretelui si cate panouri trebuie comandate tinand cont de resturile care pot fi refolosite pe inaltime.

## API principal

- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/collections`
- `GET /api/collections/:id`
- `POST /api/orders`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/me`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/collections`
- `POST /api/admin/collections`
- `PUT /api/admin/collections/:id`
- `DELETE /api/admin/collections/:id`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PUT /api/admin/orders/:id/status`
- `PUT /api/admin/orders/:id/payment-status`
- `GET /api/settings/public`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`

## Build productie

```bash
npm run build
```
