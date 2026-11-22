# Kickback_.cal website

A plain static site: HTML, CSS and a little JavaScript. No build step, no framework, no server. It runs free on GitHub Pages.

## What is in the folder

```
index.html            the page structure
css/style.css         the black and gold design (brand colours are at the top)
js/app.js             draws the pages from the data files
js/config.js          settings: Instagram link and the registration endpoint
data/events.json      upcoming events and past events   <- your "database"
data/team.json        team names and positions          <- your "database"
data/photos.json      gallery photo list                <- your "database"
images/               logo banner, logo mark and gallery photos
```

The data files are the database. To change what the site shows, edit a file in `data/`, commit it, and the site updates in about a minute.

## Put it online with GitHub Pages

1. Sign in at github.com and click **New repository**. Name it `kickback` (any name works). Keep it **Public** (free Pages needs this). Click **Create repository**.
2. On the new repository page click **uploading an existing file**. Drag in everything inside this folder (index.html, css, js, data, images, README.md). Keep the folders. Click **Commit changes**.
3. Go to **Settings, Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**. Choose branch **main** and folder **/ (root)**. Click **Save**.
4. Wait a minute and refresh the page. GitHub shows your address: `https://YOUR-USERNAME.github.io/kickback/`.

To use your own domain later, add it in the same Pages screen.

## Turn on registration (so you receive sign-ups)

GitHub Pages cannot store form data by itself, so registrations go to a free form service.

1. Sign up at https://formspree.io and click **New form**.
2. Copy the form address. It looks like `https://formspree.io/f/abcdwxyz`.
3. Open `js/config.js` on GitHub, click the pencil icon, paste the address between the quotes after `registrationEndpoint:`, and commit.

Every registration then arrives in your email and in your Formspree dashboard (name, phone, category, partner, notes). Until you do this, the form still works: it shows people a pre-filled message to send to your Instagram.

## Add an upcoming event

Open `data/events.json` and put the event inside `"upcoming"`. The site shows it on the home page and the Events page, adds it to the registration form, and moves on automatically after the date passes.

```json
"upcoming": [
  {
    "title": "Shuttle Showdown 2",
    "sport": "Badminton",
    "date": "2026-12-20",
    "time": "4:00 PM onwards",
    "venue": "Spuddy Badminton Academy, Kolkata",
    "fee": "₹1500 per team",
    "prize": "₹5,000 / ₹3,500 / ₹1,500",
    "desc": "Boys and girls singles, boys doubles, mixed doubles."
  }
],
```

The date must be written year-month-day. Only `title`, `sport` and `date` are required. Put a comma between events if you add more than one.

## Add a past event

Add a block inside `"past"` in `data/events.json`. The `key` is a short word you also use when adding photos for it.

```json
{
  "key": "showdown2",
  "title": "Shuttle Showdown 2",
  "sport": "Badminton",
  "lines": ["Sunday, 20 December 2026", "Venue, Kolkata", "Prize money: ..."]
}
```

## Add photos

1. Upload the picture into `images/gallery/` (on GitHub: open the folder, **Add file, Upload files**). Keep each under about 500 KB so the site stays fast.
2. Add a line to `data/photos.json`. `event` must match an event `key`.

```json
{ "file": "images/gallery/showdown2-1.jpg", "event": "showdown2", "caption": "Finals day" }
```

The first photo for an event is also used as its card picture on the home page.

## Change the team

Edit `data/team.json`. People appear in the order listed.

```json
{ "name": "Full Name", "role": "Co-Founder" }
```

## Check it on your computer first (optional)

Opening index.html by double-click will not load the data, because browsers block that. Run a tiny server in the folder instead:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Notes

- JSON is strict: every item needs double quotes, and no comma after the last item in a list. If the site shows empty sections after an edit, a comma or quote is usually the cause. https://jsonlint.com will point to it.
- The site fonts load from Google Fonts, so visitors need an internet connection.
- Registrations are not stored on the site. They live in Formspree. Do not put phone numbers or other personal data in any file in this repository, because it is public.
