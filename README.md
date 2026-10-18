# Portfolio site generator

This repository builds a static site for GitHub Pages from `site.toml` and the Jinja2 templates in `templates/`. `generator.py` loads the config, prepares page data, and renders the templates.

## Project structure

- `site.toml` — site content and options
- `requirements.txt` — Python dependencies (`jinja2`, `markdown`)
- `site.css` — CSS rules shared by every content page
- `templates/base.html` — document shell (doctype, `head`, stylesheet link, `{% block head %}`, `{% block body %}`)
- `templates/macros.html` — prose, bullet lists, skill pills, project links, figures, galleries, and labeled sections
- `templates/partials/` — nav, project list, writing list, bio list, blog list, figure, gallery, and labeled section
- `templates/styles/` — page-specific CSS, included from each page's `{% block head %}`
- `templates/index.html` — homepage
- `templates/project.html` — project writeup
- `templates/blog_index.html` and `templates/blog_post.html` — writing
- `templates/redirect.html` — redirect pages
- `posts/*.md` — blog posts with TOML front matter
- `generator.py` — TOML loader, data preparation, and page writer
- `dist/` — generated site (HTML, CSS, and static assets) deployed to GitHub Pages

## Configuration

Edit `site.toml`. These are the tables the generator reads.

### Site, user, and contact

- `[site]` — `lang`
- `[meta]` — `description`, `favicon`. `page_title` is optional; when it is omitted the generator uses the user name and headline.
- `[user]` — `name`, `headline`, `profile_image`, `email`
- `[user.social]` — `github`, `linkedin`, `discord`, `discord_handle`, `resume`, `email`
- `[contact]` — `form_action`, `submit_label`, `intro`

### Homepage

`[home.headings]` sets the writing, experience, elsewhere, and contact headings. The generator escapes `&` when it renders them.

`[[home.intro]]` is the intro. Each entry has `text` (HTML is allowed) and an optional `class`, rendered as a `<p>`.

`[[home.groups]]` splits the project list. Each group has:

- `title` — section heading
- `category` — a project category key, or `*` for every project not already claimed by an earlier group
- `note` — optional HTML paragraph under that group's list

Groups render in the order they appear. An earlier group keeps a project, so a later group cannot list it again.

### Categories and projects

`[categories]` maps a project `category` key to the label used in the project-page kicker. If `[categories]` is omitted, labels fall back to a title-cased category name.

Each `[[projects]]` entry can include `title`, `date`, `category`, `description`, `link`, `skills`, `featured`, `page`, `hero`, `hero_caption`, `built` or `details`, `challenges`, `learned`, `features`, `essay`, `gallery`, `demo`, and `links`.

To add a project, append a `[[projects]]` table. Set `page = true` (or add an `essay` or `hero`) to generate `dist/projects/<slug>/index.html`. The slug comes from the title.

Homepage rows show a code link when `link` is set and a writeup link when the project has a page. Extra links go in `links` and render after those two:

```toml
[[projects]]
title = "Example"
category = "solo"
date = "2026"
description = "A short summary."
link = "https://github.com/example/example"
page = true
links = [
  { label = "docs", url = "https://example.com/docs" },
]

[[projects.essay]]
heading = "What it does"
body = "A paragraph of HTML or plain text."
```

Add the category key to `[categories]` when the project page should show a custom label.

To add a homepage group, append a `[[home.groups]]` table. Use a specific `category`, or `category = "*"` for whatever projects are still left.

### Experience

`[[experiences]]` entries have `title`, `date`, and an optional `link`. They render in the homepage bio list, in file order.

### Blog posts

Add a Markdown file under `posts/`. Front matter is TOML, delimited by lines that contain exactly `+++`:

```toml
+++
title = "Hello World"
date = "October 2026"
description = "Welcome to my blog :D"
tags = ["General"]
draft = false
+++
```

Quote strings, including `date`. Write `draft = true` to skip a post, and `tags` as a TOML array. Optional fields are `slug` and `featured`. The homepage writing list and `/blog/` are generated from the posts that are not drafts.

### Redirects

`[redirects]` keys become directories with a refresh page:

```toml
[redirects]
resume = "https://example.com/resume"
```

This writes `dist/resume/index.html`.

## Templates

Pages `{% extends "base.html" %}`. `base.html` sets the doctype, language, charset, viewport, title, description, author, and favicon, then links `site.css`. The link uses `{{ root }}`: empty on the homepage, `../` for `blog/index.html`, and `../../` for project pages and blog posts. Page-specific CSS is included after that link, inside `{% block head %}`.

`site.css` holds only rules that are the same on every content page (same selector and same declarations). Rules that differ, including `h1`, `h2`, `h3`, `ul`, `li`, and `.section`, stay in that page's style block. Redirect pages override the stylesheet block and do not load `site.css`.

Shared pieces live in `templates/partials/` and `templates/macros.html`. Config strings that contain HTML (intro text, group notes, descriptions, essay bodies, built/challenges/learned/features, contact intro, and captions) are marked `|safe`. Titles, URLs, alt text, and `data-*` values are escaped.

### Adding a section

1. Add the markup to the page template, or add a partial under `templates/partials/` and `{% include %}` it.
2. If the section comes from `site.toml`, read that table in `generator.py` and pass plain dicts, lists, and strings in the template context. Leave the tags in the template.
3. If the CSS is identical on every content page, add it to `site.css`. Otherwise add it to that page's file in `templates/styles/`.

## Build

Install dependencies into a virtual environment, then build:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
python generator.py
```

Use `python` from the virtual environment (`source .venv/bin/activate`, or run `.venv/bin/python generator.py`).

`generator.py` deletes and recreates `dist/`, writes every page there, and copies the static files the pages need (`site.css`, `pfp.webp`, `media/`, `.well-known/`, and any other local file referenced by the HTML). Preview the result by opening `dist/index.html` or serving `dist/`.

`htmlmin` is optional. If it is installed, pages are minified; otherwise the HTML is written as rendered.

## Deploy

`.github/workflows/static.yml` deploys the site to GitHub Pages. On a push to `main` or `master`, or a manual `workflow_dispatch`, the workflow checks out the repo, sets up Python 3.12, runs `pip install -r requirements.txt`, runs `python generator.py`, and uploads the `dist/` directory as the Pages artifact. GitHub Pages deploys that artifact.

The live site is https://quantumbagel.github.io. The resume redirect is https://quantumbagel.github.io/resume.
