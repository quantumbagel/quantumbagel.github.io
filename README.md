# the quantumbagel developer portfolio

Welcome to the repository for my personal portfolio website, hosted at [quantumbagel.github.io](https://quantumbagel.github.io). This is version 2 of my site, rebuilt from the ground up to be more dynamic, modern, and easily maintainable.

## Overview

This website serves as a showcase for my software development projects, experience, and skills. It is designed to be a clean, professional, and dark-mode-ready single-page application.

## Tools:

- **Frontend:** 
  - [Tailwind CSS](https://tailwindcss.com/) for styling and layout.
  - [Ionicons](https://ionicons.com/) for clean, vector-based iconography.
  - [Inter Font](https://rsms.me/inter/) for modern typography.
  - [Python](https://www.python.org/) script to manage content and generate the static site.
  - `htmlmin` for production-ready HTML minification.
  - [GitHub Pages](https://pages.github.com/) for seamless deployment.

## cool things it dodes

- Automatically detects user preferences and provides a polished dark experience.
- Interactive filtering for different categories (Discord Bots, Internships, etc.) and project-specific modals for more detail.
- Fully responsive layout that looks okayish on mobile devices.
- Content is decoupled from the layout, allowing for quick updates by editing a single Python file. (and honestly its pretty fun to code in python)

## Project Structure

- `generator.py`: The core of the project. All portfolio data (projects, skills, experience) is defined here. When run, it injects this data into an HTML template and outputs a minified `index.html`.
- `index.html`: The final, minified production file used by GitHub Pages.
- `tailwind.js`: tailwind library file
- `font.css`: The fonts
- `pfp.webp`: Profile picture

## If you want to use this

To update the website or run it locally:

### Prerequisites
Ensure you have Python installed. You will also need the `htmlmin` library:
```bash
pip install htmlmin
```

### Updating Content
Open `generator.py` and modify the data structures at the top of the file (e.g., `PERSONAL_INFO`, `ABOUT_ME`, `PROJECTS`).

### Rebuilding the Site
Run the generator script to apply your changes and rebuild the minified `index.html`:
```bash
python generator.py
```

*note that even though it is forked from vcard, that was v1 and this is completely original code*
