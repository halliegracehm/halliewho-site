# halliewho.com

The new Hallie Who site. Plain HTML built by one small script, so it's fast and easy for Google to read.

## What's here

- `site.config.mjs`: links, prices, contact email, Mailchimp settings. Most edits happen here.
- `content/quizzes.json`: the six quizzes (questions, answers, results).
- `content/extras.json`: quiz intros, SEO titles, and the journal prompts on each pattern page.
- `assets/`: styles, the quiz script, and the favicon.
- `build.mjs`: turns all of the above into the finished site in `dist/`.

## Put it online

1. On GitHub, create a new empty repository named `halliewho-site`.
2. Click "uploading an existing file" and drag in everything from this folder (not the folder itself). Commit.
3. In Vercel, click Add New, then Project, and import `halliewho-site`. Vercel reads `vercel.json`, so just click Deploy.
4. When you're ready to switch from WordPress: in Vercel, open the project, go to Settings, then Domains, and add `halliewho.com`. Vercel shows the DNS records to set.
5. In Google Search Console, add halliewho.com and submit `https://halliewho.com/sitemap.xml`.

## Before you switch the domain

- Fill in `appStoreUrl` and `podcastUrl` in `site.config.mjs`.
- Check the service prices in `site.config.mjs`.
- In Mailchimp, add an audience field with the merge tag `QUIZRES` so you can see each person's quiz result.

## Test it on your computer

```
node build.mjs
npx serve dist
```

## Share images and Pinterest

Every page has a share image (`assets/og/`) and a Pinterest pin (`assets/pins/`). Pinterest reads `https://halliewho.com/pins.xml` and pins new pages on its own.

After adding pages (new episodes, quizzes, patterns), make their images:

```
node build.mjs
python3 tools/make-images.py
```
