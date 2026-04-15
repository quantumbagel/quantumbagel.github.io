# Portfolio template generator

This repository builds a static portfolio site for GitHub Pages using:

1. `site.toml` for all customizable content/configuration
2. HTML templates in `templates/` with placeholders like `{user.name}`
3. `generator.py` to render templates and output `index.html`

## Project structure

- `site.toml` - template data and options (user info, sections, projects, skills, redirects)
- `templates/index.html` - main page template
- `templates/partials/*.html` - reusable section templates
- `templates/redirect.html` - redirect page template
- `generator.py` - TOML loader + placeholder renderer + static site generator
- `index.html` - generated output file used by GitHub Pages

## Configuration

### Main site data

Edit `site.toml` to customize:

- `user` and `user.social`
- `meta`, `sections`, `contact`, `footer`
- `content.about`, `content.taglines`, `experiences`
- `skills.languages` and `skills.technologies`
- `projects` and `project_filters`

### Redirects

Redirects are generated from `[redirects]` keys:

```toml
[redirects]
resume = "https://google.com"
```

This writes `resume/index.html` so `/resume` redirects to that URL.

## Template placeholders

Templates use dot-path placeholders, for example:

- `{user.name}`
- `{meta.description}`
- `{content.project_cards_html}`

The generator replaces these automatically using `site.toml` values and generated HTML blocks.

## Build

Install optional minification dependency:

```bash
pip install htmlmin
```

Generate the site:

```bash
python3 generator.py
```
