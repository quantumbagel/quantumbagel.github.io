import os

# ==============================================================================
# PORTFOLIO DATA
# ==============================================================================
# All the content for your portfolio website is stored here.
# To update your website, you only need to change the data in this section.
# ==============================================================================

PERSONAL_INFO = {
    "name": "Julian Reder",
    "title": "Computer Engineering Student @ NCSU",
    "profile_image": "pfp.webp",
    "social_links": {
        "github": "https://github.com/quantumbagel",
        "linkedin": "https://www.linkedin.com/in/julian-reder-nc/",
        "discord": "https://discordapp.com/users/897146430664355850",
        "resume": "https://docs.google.com/document/d/1gq5sdEZpf0Aa72OVL7mjcgrHgKJGtB1S-MCWjtZQWz8/edit"
    },
    "contact_details": [
        {"icon": "calendar-outline", "label": "Birthday", "value": "March 13"},
        {"icon": "location-outline", "label": "Location", "value": "North Carolina, USA"},
        {"icon": "paw-outline", "label": "Number of Cats", "value": "3"},
        {"icon": "logo-github", "label": "GitHub", "value": "@quantumbagel"},
        {"icon": "logo-linkedin", "label": "LinkedIn", "value": "@julian-reder-nc"},
        {"icon": "logo-discord", "label": "Discord", "value": "@thequantumbagel"}
    ]
}

ABOUT_ME = [
    "Hello! I'm <strong class=\"text-gray-800 dark:text-white\">Julian Reder</strong>, a programmer and student at North Carolina State University. This is version 2 of my portfolio website, with this one being entirely coded from scratch using Tailwind CSS for styling and layout.",
    "This website serves as mostly just a list of the projects I've made. Feel free to look at my <a href=\"#projects\" class=\"text-blue-500 hover:underline\">projects</a> or learn more about my <a href=\"#experience\" class=\"text-blue-500 hover:underline\">experience</a>.",
    "Hopefully you find something interesting here! If you want to get in touch, feel free to reach out via the <a href=\"#contact\" class=\"text-blue-500 hover:underline\">contact form</a> at the bottom of the page."
]

EXPERIENCES = [
    {
        "icon": "school-outline",
        "title": "North Carolina State University",
        "date": "Fall 2025 - Present",
        "description": "I am currently enrolled in the Computer Engineering program at North Carolina State University. I am pursuing a Bachelor's in Statistics and Computer Engineering and a Master's of Computer Science."
    },
    {
        "icon": "code-slash-outline",
        "title": "AERPAW Developer",
        "date": "Summer 2023 - Present",
        "description": "I have had the pleasure to work with Dr. Mihail Sichitiu at the Aerial Experimentation and Research Platform for Advanced Wireless at North Carolina State University for a couple of years now."
                       "I have built several interesting projects including a plane tracker and a drone flight recorder."
    },
    {
        "icon": "school-outline",
        "title": "Wake Tech Community College",
        "date": "Fall 2023 - Spring 2025",
        "description": "This was my first experience taking college coursework. I graduated with multiple appearances on the Dean's List, membership in the Phi Theta Kappa chapter, and an Associate in Science degree."
    }
]

SKILLS = {
    "Programming Languages": [
        {
            "name": "Python", 
            "icon": "logo-python",
            "level": "Expert", 
            "percentage": 100,
            "duration": "5+ years",
            "details": "My primary language for most of my programming career. Used for web scraping, automation, data science, and drone software.",
            "projects": ["PyAerial", "airstrik.py", "DroneTracker", "finiteCraft", "Triggered"]
        },
        {
            "name": "C/C++", 
            "icon": "code-slash-outline",
            "level": "Advanced", 
            "percentage": 90,
            "duration": "3+ years",
            "details": "Proficient in C/C++ for systems programming and performance-critical applications. Used in various academic and personal projects.",
            "projects": ["Embedded Systems via Arduino", "Python compiler extensions for aerpaw", "JIT compilation for performance-critical Python code"]
        },
        {
            "name": "JavaScript", 
            "icon": "logo-javascript",
            "level": "Advanced", 
            "percentage": 85,
            "duration": "3+ years",
            "details": "Used extensively for front-end development (Tailwind, React) and specialized automation tools.",
            "projects": ["Portfolio Website (v2)", "Molotov", "finiteCraft"]
        },
        {
            "name": "Java", 
            "icon": "cafe-outline",
            "level": "Competent", 
            "percentage": 80,
            "duration": "4+ years",
            "details": "Really good understanding of OOP principles. Experience mostly in the context of building Minecraft plugins.",
            "projects": ["Statify"]
        },
        {
            "name": "C#", 
            "icon": "code-outline",
            "level": "Competent", 
            "percentage": 75,
            "duration": "2+ years",
            "details": "Experience with .NET and game development. Most recently used for Sebastian Lague's Chess Challenge.",
            "projects": ["Chess-Challenge"]
        },
        {
            "name": "Bash", 
            "icon": "terminal-outline",
            "level": "Competent", 
            "percentage": 70,
            "duration": "4+ years",
            "details": "Proficient in writing scripts for automation, CI/CD pipelines, and Linux system administration.",
            "projects": ["All projects", "Docker setup scripts"]
        },
    ],
    "Technologies & Frameworks": [
        {
            "name": "Linux/Unix", 
            "icon": "desktop-outline",
            "level": "Expert", 
            "percentage": 100,
            "duration": "5+ years",
            "details": "Heavy user of Linux for development and server management, as well as a daily driver of Cosmic.",
            "projects": ["Server Management", "All Projects"]
        },
        {
            "name": "Docker", 
            "icon": "logo-docker",
            "level": "Expert", 
            "percentage": 100,
            "duration": "3+ years",
            "details": "All my major projects are deployed using Docker for reproducibility and scale.",
            "projects": ["PyAerial", "airstrik.py", "DroneTracker", "Piranha"]
        },
        {
            "name": "JetBrains Suite", 
            "icon": "bulb-outline",
            "level": "Expert", 
            "percentage": 100,
            "duration": "5+ years",
            "details": "Advanced user of PyCharm, CLion, and IntelliJ. I use these IDEs for all my development work and am proficient with their advanced features.",
            "projects": ["All Projects"]
        },
        {
            "name": "Git", 
            "icon": "logo-github",
            "level": "Advanced", 
            "percentage": 90,
            "duration": "4+ years",
            "details": "Great understanding of Git workflows, branching strategies, and repository management.",
            "projects": ["All Projects"]
        },
        {
            "name": "Selenium / Web Scraping", 
            "icon": "globe-outline",
            "level": "Advanced", 
            "percentage": 90,
            "duration": "2+ years",
            "details": "Really good at web scraping and browser automation.",
            "projects": ["finiteCraft", "Molotov"]
        },
        {
            "name": "OpenAPI", 
            "icon": "server-outline",
            "level": "Advanced", 
            "percentage": 90,
            "duration": "2+ years",
            "details": "Experience designing and documenting RESTful APIs for complex data systems.",
            "projects": ["PyAerial", "Triggered"]
        },
        {
            "name": "SQL/MySQL/Postgres", 
            "icon": "server-outline",
            "level": "Advanced", 
            "percentage": 90,
            "duration": "4+ years",
            "details": "Relational database design, optimization, and management for high-concurrency applications.",
            "projects": ["PlayCord", "Triggered", "Statify"]
        },
        {
            "name": "MongoDB", 
            "icon": "leaf-outline",
            "level": "Advanced", 
            "percentage": 90,
            "duration": "2+ years",
            "details": "NoSQL database implementations for drone tracking data",
            "projects": ["PyAerial", "airstrik.py"]
        },
    ]
}

PROJECTS = [
    {
        "category": "internship",
        "image": "https://placehold.co/400x250/3498DB/FFFFFF?text=PyAerial",
        "title": "PyAerial",
        "date": "2024 - Present",
        "description": "A better plane tracker for AERPAW, successor to airstrik.py.",
        "details": "PyAerial is a comprehensive ADS-B tracking solution developed for the AERPAW research platform at NC State. It provides real-time aircraft position tracking, historical data storage, and visualization capabilities.",
        "features": ["Real-time ADS-B decoding", "MongoDB integration for data persistence", "Docker containerized deployment", "RESTful API for data access"],
        "link": "https://github.com/quantumbagel/PyAerial",
        "skills": ["Python", "MavSDK", "Docker", "MongoDB", "ADS-B"],
    },
    {
        "category": "internship",
        "image": "https://placehold.co/400x250/E74C3C/FFFFFF?text=airstrik.py",
        "title": "airstrik.py",
        "date": "2023 - 2024",
        "description": "A pure-python ADS-B plane tracker for AERPAW.",
        "details": "The original pure-Python implementation of an ADS-B tracker for drone airspace monitoring. This project laid the groundwork for PyAerial.",
        "features": ["Pure Python implementation", "ADS-B signal processing", "Integration with MavSDK for drone communication"],
        "link": "https://github.com/quantumbagel/airstrik.py",
        "skills": ["Python", "MavSDK", "Docker", "MongoDB", "ADS-B"]
    },
    {
        "category": "discord-bots",
        "image": "https://placehold.co/400x250/2ECC71/FFFFFF?text=Piranha",
        "title": "Piranha",
        "date": "2022",
        "description": "A chess-playing Discord bot with various features.",
        "details": "Piranha is a feature-rich Discord bot that allows users to play chess directly within Discord. It integrates with the Stockfish chess engine for AI opponents.",
        "features": ["Play chess against AI or friends", "Multiple difficulty levels via Stockfish", "Game history and statistics", "Docker deployment support"],
        "link": None,
        "skills": ["Python", "Stockfish", "Docker"]
    },
    {
        "category": "other",
        "image": "https://placehold.co/400x250/E74C3C/FFFFFF?text=finiteCraft",
        "title": "finiteCraft",
        "date": "2024",
        "description": "A web scraper and craft finder for Neal Agarwal's Infinite Craft.",
        "details": "finiteCraft is an automation tool that scrapes and discovers all possible crafting combinations in the game Infinite Craft. Uses distributed proxy networks for efficient scraping.",
        "features": ["Selenium-based automation", "Proxy rotation support", "Crafting recipe database", "Pathfinding algorithms for recipe discovery"],
        "link": "https://github.com/finiteCraft/finiteCraft",
        "skills": ["Python", "Selenium", "Web Scraping", "Proxies", "Automation"]
    },
    {
        "category": "internship",
        "image": "https://placehold.co/400x250/9B59B6/FFFFFF?text=DroneTracker",
        "title": "DroneTracker",
        "date": "2024",
        "description": "Track drones with cameras! Another AERPAW project.",
        "details": "DroneTracker is a computer vision system that uses PTZ cameras to track drones in real-time. It integrates with AXIS cameras via VAPIX protocol.",
        "features": ["PTZ camera control via VAPIX", "Real-time drone position estimation", "MavSDK integration for telemetry", "Containerized deployment"],
        "link": "https://github.com/quantumbagel/DroneTracker",
        "skills": ["Python", "VAPIX", "Docker", "MavSDK", "netcat", "Linux"]
    },
    {
        "category": "discord-bots",
        "image": "https://placehold.co/400x250/F1C40F/FFFFFF?text=Triggered",
        "title": "Triggered",
        "date": "2023 - 2024",
        "description": "An if-this-than-that Discord bot for automation and fun.",
        "details": "Triggered allows Discord server administrators to create custom automation rules based on triggers and actions, similar to IFTTT.",
        "features": ["Custom trigger/action system", "Programmable API", "MySQL database for persistence", "Extensive customization options"],
        "link": "https://github.com/quantumbagel/Triggered",
        "skills": ["Python", "discord.py", "MySQL", "Programmable API"]
    },
    {
        "category": "discord-bots",
        "image": "https://placehold.co/400x250/F1C40F/FFFFFF?text=PlayCord",
        "title": "PlayCord",
        "date": "2025 - Present",
        "description": "A Discord bot for paper and pencil games with fully functional local and global leaderboards, and dynamic loading of games.",
        "details": "PlayCord brings classic paper and pencil games to Discord with a competitive twist. Features global and server-specific leaderboards.",
        "features": ["Multiple game modes", "Global and local leaderboards", "Dynamic game loading system", "MySQL persistence"],
        "link": "https://github.com/PlayCord/bot",
        "skills": ["Python", "discord.py", "MySQL", "Programmable API"]
    },
    {
        "category": "other",
        "image": "https://placehold.co/400x250/3498DB/FFFFFF?text=Statify",
        "title": "Statify",
        "date": "2022",
        "description": "A SpigotMC plugin for statistics aggregation and leaderboards",
        "details": "Statify is a Minecraft server plugin that tracks player statistics and generates leaderboards for competitive servers.",
        "features": ["Comprehensive stat tracking", "Customizable leaderboards", "SpigotMC API integration"],
        "link": "https://github.com/quantumbagel/Statify",
        "skills": ["Java", "SpigotMC"]
    },
    {
        "category": "other",
        "image": "https://placehold.co/400x250/2ECC71/FFFFFF?text=Molotov",
        "title": "Molotov",
        "date": "2022",
        "description": "A Selenium-based bot for the game Bomb Party (jklm.fun)",
        "details": "Molotov is an automation bot for the word game Bomb Party. It uses Selenium to interact with the game and an optimized word database for fast responses.",
        "features": ["Selenium automation", "Optimized word lookup", "Configurable response timing", "JavaScript injection for speed"],
        "link": "https://github.com/quantumbagel/Molotov",
        "skills": ["Python", "Selenium", "JavaScript"]
    },
    {
        "category": "discord-bots",
        "image": "https://placehold.co/400x250/9B59B6/FFFFFF?text=discord.py+template",
        "title": "discord.py-template",
        "date": "2025",
        "description": "A simple, modern, and clean discord.py 2.0+ template.",
        "details": "A well-structured template for building Discord bots using discord.py 2.0+. Designed to be easy to understand and extend for beginners and experienced developers alike.",
        "features": ["Clean project structure", "Modern discord.py 2.0+ syntax", "Slash command support", "Easy to customize and extend"],
        "link": "https://github.com/quantumbagel/discord.py-template",
        "skills": ["Python", "discord.py"]
    },
    {
        "category": "other",
        "image": "https://placehold.co/400x250/1ABC9C/FFFFFF?text=Chess-Challenge",
        "title": "Chess-Challenge",
        "date": "2023",
        "description": "A mini-chess bot for Sebastian Lague's chess bot challenge.",
        "details": "An entry for Sebastian Lague's Tiny Chess Bot Challenge. The goal was to create the strongest chess AI possible within strict code size limitations.",
        "features": ["Minimax algorithm with alpha-beta pruning", "Compact code optimization", "Custom evaluation function", "Competitive performance under constraints"],
        "link": "https://github.com/quantumbagel/Chess-Challenge",
        "skills": ["C#", "Chess", "AI"]
    },
    {
        "category": "internship",
        "image": "https://placehold.co/400x250/F1C40F/FFFFFF?text=aerpawlib",
        "title": "aerpawlib",
        "date": "2025 - Present",
        "description": "A MAVLink/MAVSDK abstraction layer for experimenters under the AERPAW platform.",
        "details": "aerpawlib provides a high-level Python interface for controlling drones on the AERPAW testbed. It abstracts away the complexity of MAVLink/MAVSDK for easier experiment development.",
        "features": ["High-level drone control API", "MAVLink/MAVSDK abstraction", "Simplified experiment development", "AERPAW platform integration"],
        "link": "https://github.com/aerpaw/aerpawlib",
        "skills": ["Python", "MAVLink", "MAVSDK", "Drones"]
    },
]

# ==============================================================================
# HTML GENERATION FUNCTIONS
# ==============================================================================

def project_anchor_id(title):
    slug = "".join(ch.lower() if ch.isalnum() else "-" for ch in title).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return f"project-{slug}"

def generate_timeline_item(item):
    return f'''
        <div class="relative pl-8 mb-8 border-l border-zinc-200 dark:border-zinc-800 last:mb-0">
            <div class="absolute w-3 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full -left-[6.5px] top-1.5 border-2 border-white dark:border-zinc-950"></div>
            <h3 class="text-base font-medium text-zinc-900 dark:text-zinc-100">{item['title']}</h3>
            <div class="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{item['date']}</div>
            <p class="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{item['description']}</p>
        </div>'''

def generate_skill_bar(skill):
    projects_html = ""
    if skill.get("projects"):
        project_ids = {
            project.get("title"): project_anchor_id(project["title"])
            for project in PROJECTS
            if project.get("title")
        }
        project_pills = "".join(
            [
                (
                    f'<a href="#{project_ids[p]}" class="project-jump inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 mr-1.5 mb-1.5 transition-colors">{p}</a>'
                    if p in project_ids else
                    f'<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 mr-1.5 mb-1.5">{p}</span>'
                )
                for p in skill['projects']
            ]
        )
        projects_html = f'<div class="mt-2 flex flex-wrap">{project_pills}</div>'
        
    icon_html = f'<ion-icon name="{skill["icon"]}" class="text-xl mr-2"></ion-icon>' if skill.get("icon") else ''
    duration_html = f'<span class="text-xs text-zinc-500 dark:text-zinc-400 ml-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{skill["duration"]}</span>' if skill.get("duration") else ''

    return f'''
        <div class="mb-6 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
            <div class="flex items-center mb-2">
                {icon_html}
                <span class="text-base font-semibold text-zinc-900 dark:text-zinc-100">{skill['name']}</span>
                {duration_html}
            </div>
            <div class="mb-2">
                <span class="text-xs text-zinc-500 dark:text-zinc-400">{skill['level']}</span>
            </div>
            <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{skill.get('details', '')}</p>
            {projects_html}
        </div>'''

def generate_project_card(project):
    project_id = project_anchor_id(project.get("title", "project"))
    skills_html = ""
    if project.get("skills"):
        pills_html = "".join([
            f'<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 mr-1.5 mb-1.5">{skill}</span>'
            for skill in project['skills']
        ])
        skills_html = f'<div class="flex flex-wrap mt-3">{pills_html}</div>'

    link_html = ""
    if project.get("link"):
        link_html = f'<a href="{project["link"]}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-3">View Project <span class="ml-1 text-xs">↗</span></a>'
        
    image_html = ""
    if project.get("image"):
        image_html = f'<img src="{project["image"]}" alt="{project.get("title")}" loading="lazy" decoding="async" class="w-full h-48 object-cover border-b border-zinc-200 dark:border-zinc-800">'

    date_html = ""
    if project.get("date"):
        date_html = f'<span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 block flex items-center"><ion-icon name="time-outline" class="mr-1"></ion-icon>{project["date"]}</span>'

    return f'''
        <div id="{project_id}" class="project-card group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm overflow-hidden" data-category="{project.get('category', 'other')}">
            {image_html}
            <div class="p-5 flex flex-col flex-grow">
                <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{project.get('title')}</h3>
                {date_html}
                <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-4 flex-grow leading-relaxed">{project.get('description')}</p>
                <div>
                    {skills_html}
                    {link_html}
                </div>
            </div>
        </div>'''

def create_html_structure():
    timeline_items_html = "".join([generate_timeline_item(item) for item in EXPERIENCES])
    programming_skills_html = "".join([generate_skill_bar(skill) for skill in SKILLS['Programming Languages']])
    tech_skills_html = "".join([generate_skill_bar(skill) for skill in SKILLS['Technologies & Frameworks']])
    project_cards_html = "".join([generate_project_card(project) for project in PROJECTS])
    about_me_html = "".join([f"<p class='mb-4 last:mb-0'>{paragraph}</p>" for paragraph in ABOUT_ME])

    return f'''<!DOCTYPE html>
<html lang="en" class="antialiased scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{PERSONAL_INFO['name']} - {PERSONAL_INFO['title']}</title>
    <meta name="description" content="Portfolio of {PERSONAL_INFO['name']}, {PERSONAL_INFO['title']}.">
    <link rel="icon" type="image/png" href="pfp.webp">
    <script src="tailwind.js"></script>
    <link href="font.css" rel="stylesheet">
    <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js" defer></script>
    <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js" defer></script>
</head>
<body class="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-zinc-200 dark:selection:bg-zinc-800 selection:text-zinc-900 dark:selection:text-zinc-100">
    <div class="max-w-3xl mx-auto px-6 py-12 md:py-20">
        
        <!-- Header -->
        <header class="mb-16">
            <div class="flex items-center gap-6 mb-6">
                <img src="{PERSONAL_INFO['profile_image']}" alt="{PERSONAL_INFO['name']}" class="w-16 h-16 rounded-full object-cover border border-zinc-200 dark:border-zinc-800">
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{PERSONAL_INFO['name']}</h1>
                    <p class="text-zinc-500 dark:text-zinc-400 mt-0.5">{PERSONAL_INFO['title']}</p>
                </div>
            </div>
            
            <div class="flex gap-4">
                <a href="{PERSONAL_INFO['social_links']['github']}" target="_blank" rel="noopener noreferrer" class="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" aria-label="GitHub">
                    <ion-icon name="logo-github" class="text-xl"></ion-icon>
                </a>
                <a href="{PERSONAL_INFO['social_links']['linkedin']}" target="_blank" rel="noopener noreferrer" class="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" aria-label="LinkedIn">
                    <ion-icon name="logo-linkedin" class="text-xl"></ion-icon>
                </a>
                <a href="{PERSONAL_INFO['social_links']['resume']}" target="_blank" rel="noopener noreferrer" class="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" aria-label="Resume">
                    <ion-icon name="document-text-outline" class="text-xl"></ion-icon>
                </a>
            </div>
        </header>

        <main class="space-y-20">
            <!-- About -->
            <section id="about">
                <h2 class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">About</h2>
                <div class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {about_me_html}
                </div>
            </section>

            <!-- Experience -->
            <section id="experience">
                <h2 class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-6">Experience</h2>
                <div>
                    {timeline_items_html}
                </div>
            </section>

            <!-- Projects -->
            <section id="projects">
                <h2 class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-6">Projects</h2>
                
                <!-- Project Filters -->
                <div class="flex flex-wrap gap-2 mb-6" id="project-filters">
                    <button type="button" aria-pressed="true" class="px-3 py-1 text-sm rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 filter-btn active" data-filter="all">All</button>
                    <button type="button" aria-pressed="false" class="px-3 py-1 text-sm rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 filter-btn transition-colors" data-filter="internship">Internship</button>
                    <button type="button" aria-pressed="false" class="px-3 py-1 text-sm rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 filter-btn transition-colors" data-filter="discord-bots">Discord Bots</button>
                    <button type="button" aria-pressed="false" class="px-3 py-1 text-sm rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 filter-btn transition-colors" data-filter="other">Other</button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" id="project-grid">
                    {project_cards_html}
                </div>
            </section>

            <!-- Skills -->
            <section id="skills">
                <h2 class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-6">Skills</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 class="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">Languages</h3>
                        {programming_skills_html}
                    </div>
                    <div>
                        <h3 class="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">Technologies</h3>
                        {tech_skills_html}
                    </div>
                </div>
            </section>

            <!-- Contact -->
            <section id="contact">
                <h2 class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-6">Contact</h2>
                <div class="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <form action="https://formspree.io/f/moqgwdop" method="POST" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="name" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                                <input type="text" id="name" name="name" required class="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-zinc-900 dark:text-zinc-100">
                            </div>
                            <div>
                                <label for="email" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                                <input type="email" id="email" name="email" required class="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-zinc-900 dark:text-zinc-100">
                            </div>
                        </div>
                        <div>
                            <label for="message" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Message</label>
                            <textarea id="message" name="message" rows="4" required class="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 resize-none"></textarea>
                        </div>
                        <button type="submit" class="inline-flex items-center px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:focus:ring-zinc-100">
                            Send Message
                            <ion-icon name="paper-plane-outline" class="ml-2 text-lg"></ion-icon>
                        </button>
                    </form>
                </div>
            </section>
        </main>
        
        <!-- Footer -->
        <footer class="mt-20 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <p>Made with <3 by @quantumbagel</p>
        </footer>

    </div>

    <!-- Filter Script -->
    <script>
    document.addEventListener('DOMContentLoaded', () => {{
        const filterBtns = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');
        const projectJumpLinks = document.querySelectorAll('.project-jump');
        const activeClasses = ['bg-zinc-900', 'text-white', 'dark:bg-zinc-100', 'dark:text-zinc-900'];
        const inactiveClasses = ['bg-zinc-200', 'text-zinc-700', 'dark:bg-zinc-800', 'dark:text-zinc-300'];
        const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');

        const setActiveFilter = (activeBtn) => {{
            filterBtns.forEach(b => {{
                b.classList.remove(...activeClasses);
                b.classList.add(...inactiveClasses);
                b.setAttribute('aria-pressed', 'false');
            }});
            activeBtn.classList.remove(...inactiveClasses);
            activeBtn.classList.add(...activeClasses);
            activeBtn.setAttribute('aria-pressed', 'true');
        }};

        const applyFilter = (filterValue) => {{
            projectCards.forEach(card => {{
                const shouldShow = filterValue === 'all' || card.getAttribute('data-category') === filterValue;
                card.classList.toggle('hidden', !shouldShow);
            }});
        }};

        filterBtns.forEach(btn => {{
            btn.addEventListener('click', () => {{
                setActiveFilter(btn);
                applyFilter(btn.getAttribute('data-filter'));
            }});
        }});

        projectJumpLinks.forEach(link => {{
            link.addEventListener('click', () => {{
                if (allFilterBtn) {{
                    setActiveFilter(allFilterBtn);
                    applyFilter('all');
                }}
            }});
        }});
    }});
    </script>
</body>
</html>'''

def generate_redirect_page(url, title="Redirecting...", description="View my resume", image="https://quantumbagel.github.io/pfp.webp"):
    return f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{title}}</title>
    <meta name="description" content="{{description}}">
    <meta http-equiv="refresh" content="0; url={{url}}">
    <link rel="canonical" href="{{url}}">
    <script>window.location.href = "{{url}}";</script>
</head>
<body>
    If you are not redirected, <a href="{{url}}">click here</a>.
</body>
</html>'''

def main():
    html_output = create_html_structure()

    try:
        import htmlmin
        minified = htmlmin.minify(html_output, remove_empty_space=True)
    except Exception:
        minified = html_output

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(minified)
        
    print("Successfully generated clean portfolio website!")

    resume_url = PERSONAL_INFO.get("social_links", {}).get("resume")
    if resume_url:
        if not os.path.exists("resume"):
            os.makedirs("resume")
        redirect_html = generate_redirect_page(
            url=resume_url,
            title=f"{{PERSONAL_INFO['name']}} - Resume",
            description=f"View the resume of {{PERSONAL_INFO['name']}}.",
            image="https://quantumbagel.github.io/pfp.webp"
        )
        with open(os.path.join("resume", "index.html"), "w", encoding="utf-8") as f:
            f.write(redirect_html)

if __name__ == "__main__":
    main()
