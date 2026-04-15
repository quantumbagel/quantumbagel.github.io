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
    "Hello! I'm <strong class=\"text-gray-800 dark:text-white\">Julian Reder</strong>, a programmer and student at North Carolina State University. This website has a brief overview of my projects and skillset, as well as a contact form.",
    "Hopefully you find something interesting here! Feel free to reach out if you want to chat about anything or have any questions about my projects or experience.",
]

TAGLINES = [
    "is a Computer Engineering and Statistics student @ NCSU",
    "is a full-stack developer",
    "likes drones :D",
    "is a open source enthusiast",
    "has three cats :3",
    "is always learning",
    "would like a job 🥺",
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
        "description": "I have had the pleasure to work with Dr. Mihail Sichitiu at the Aerial Experimentation and Research Platform for Advanced Wireless at North Carolina State University for a couple of years now. "
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
    skill_id = skill['name'].lower().replace('/', '-').replace('+', 'plus').replace(' ', '-')
    
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
        
    icon_html = f'<ion-icon name="{skill["icon"]}" class="text-lg mr-2"></ion-icon>' if skill.get("icon") else ''
    duration_html = f'<span class="text-xs text-zinc-500 dark:text-zinc-400">{skill["duration"]}</span>' if skill.get("duration") else ''
    details_section = f'<p class="text-sm text-zinc-600 dark:text-zinc-400 mb-3 mt-2">{skill.get("details", "")}</p>' if skill.get("details") else ''

    return f'''
        <div class="skill-item group mb-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition-all">
            <button class="skill-toggle w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left" data-skill-id="{skill_id}">
                <div class="flex items-center gap-2 flex-1">
                    {icon_html}
                    <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{skill['name']}</span>
                    {duration_html}
                </div>
                <ion-icon name="chevron-down-outline" class="skill-toggle-icon text-zinc-500 dark:text-zinc-400 transition-transform"></ion-icon>
            </button>
            <div class="skill-content hidden px-4 pb-4 border-t border-zinc-200 dark:border-zinc-800 skill-rollout">
                <div class="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-4 pt-2">{skill.get("level", "")}</div>
                {details_section}
                {projects_html}
            </div>
        </div>'''

def generate_project_card(project):
    project_id = project_anchor_id(project.get("title", "project"))
    modal_id = f"modal-{project_id}"
    
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

    details_button = ""
    if project.get("details") or project.get("features"):
        details_button = f'<button class="project-details-btn text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mt-3" data-modal-id="{modal_id}">More Info →</button>'

    return f'''
        <div id="{project_id}" class="project-card group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm overflow-hidden" data-category="{project.get('category', 'other')}">
            {image_html}
            <div class="p-5 flex flex-col flex-grow">
                <div class="flex items-start justify-between">
                    <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex-1">{project.get('title')}</h3>
                    <button class="copy-link-btn ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors" data-project-id="{project_id}" title="Copy link to project">
                        <ion-icon name="link" class="text-lg"></ion-icon>
                    </button>
                </div>
                {date_html}
                <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-4 flex-grow leading-relaxed">{project.get('description')}</p>
                <div>
                    {skills_html}
                    {link_html}
                    {details_button}
                </div>
            </div>
        </div>'''

def generate_project_modal(project):
    project_id = project_anchor_id(project.get("title", "project"))
    modal_id = f"modal-{project_id}"
    
    features_html = ""
    if project.get("features"):
        features_list = "".join([
            f'<li class="text-sm text-zinc-600 dark:text-zinc-400 flex items-start"><span class="mr-3">•</span><span>{feature}</span></li>'
            for feature in project['features']
        ])
        features_html = f'<div class="mt-4"><h4 class="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Features</h4><ul class="space-y-1">{features_list}</ul></div>'

    details_html = ""
    if project.get("details"):
        details_html = f'<p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">{project["details"]}</p>'

    link_button = ""
    if project.get("link"):
        link_button = f'<a href="{project["link"]}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">View on GitHub <span class="ml-2">↗</span></a>'

    return f'''
        <div id="{modal_id}" class="fixed inset-0 z-50 hidden overflow-y-auto bg-black/50 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
                <div class="p-6">
                    <div class="flex items-start justify-between mb-4">
                        <h2 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{project.get('title')}</h2>
                        <button class="modal-close-btn text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" data-modal-id="{modal_id}">✕</button>
                    </div>
                    {details_html}
                    {features_html}
                    <div class="mt-6 flex gap-3">
                        {link_button}
                    </div>
                </div>
            </div>
        </div>'''

def create_html_structure():
    timeline_items_html = "".join([generate_timeline_item(item) for item in EXPERIENCES])
    programming_skills_html = "".join([generate_skill_bar(skill) for skill in SKILLS['Programming Languages']])
    tech_skills_html = "".join([generate_skill_bar(skill) for skill in SKILLS['Technologies & Frameworks']])
    project_cards_html = "".join([generate_project_card(project) for project in PROJECTS])
    project_modals_html = "".join([generate_project_modal(project) for project in PROJECTS])
    about_me_html = "".join([f"<p class='mb-4 last:mb-0'>{paragraph}</p>" for paragraph in ABOUT_ME])
    taglines_json = str(TAGLINES).replace("'", '"')

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
<body class="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-zinc-700 dark:selection:bg-zinc-300 selection:text-white dark:selection:text-zinc-950 relative overflow-x-hidden">
    <canvas id="matrix-bg" class="fixed inset-0 pointer-events-none z-0 opacity-20" aria-hidden="true"></canvas>
    <div class="relative z-10 max-w-3xl mx-auto px-6 py-12 md:py-20">
        
        <!-- Header -->
        <header class="mb-16">
            <div class="flex items-center gap-6 mb-6">
                <img src="{PERSONAL_INFO['profile_image']}" alt="{PERSONAL_INFO['name']}" class="w-16 h-16 rounded-full object-cover border border-zinc-200 dark:border-zinc-800">
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{PERSONAL_INFO['name']}</h1>
                    <p id="tagline" class="text-zinc-500 dark:text-zinc-400 mt-0.5 h-6 overflow-hidden relative">{TAGLINES[0]}</p>
                </div>
            </div>
            
            <div class="flex gap-5 text-sm font-mono">
                <a href="{PERSONAL_INFO['social_links']['github']}" target="_blank" rel="noopener noreferrer" class="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1" aria-label="GitHub">
                    GitHub/<ion-icon name="logo-github" class="text-base"></ion-icon>
                </a>
                <a href="{PERSONAL_INFO['social_links']['linkedin']}" target="_blank" rel="noopener noreferrer" class="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1" aria-label="LinkedIn">
                    LinkedIn/<ion-icon name="logo-linkedin" class="text-base"></ion-icon>
                </a>
                <a href="{PERSONAL_INFO['social_links']['discord']}" target="_blank" rel="noopener noreferrer" class="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1" aria-label="Discord">
                    Discord/<ion-icon name="logo-discord" class="text-base"></ion-icon>
                </a>
                <a href="{PERSONAL_INFO['social_links']['resume']}" target="_blank" rel="noopener noreferrer" class="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1" aria-label="Resume">
                    Resume/<ion-icon name="document-text-outline" class="text-base"></ion-icon>
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
                    <button type="button" aria-pressed="true" class="px-3 py-1 text-sm rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 filter-btn active hover:bg-zinc-800 dark:hover:bg-zinc-200" data-filter="all">All</button>
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
        <footer id="footer-easter-egg" class="mt-20 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center text-sm text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors select-none">
            <p>Made with <3 by @quantumbagel</p>
        </footer>

     </div>

    <!-- Project Modals -->
    {project_modals_html}

    <!-- Filter Script -->
    <script>
    document.addEventListener('DOMContentLoaded', () => {{
        const taglines = {taglines_json};
        const taglineEl = document.getElementById('tagline');
        let currentIndex = 0;

        const cycleTagline = () => {{
            if (taglineEl && taglines.length > 0) {{
                currentIndex = (currentIndex + 1) % taglines.length;
                const nextTagline = taglines[currentIndex];
                
                taglineEl.style.opacity = '0';
                taglineEl.style.transform = 'translateY(1.5rem)';
                taglineEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                
                setTimeout(() => {{
                    taglineEl.textContent = nextTagline;
                    taglineEl.style.opacity = '1';
                    taglineEl.style.transform = 'translateY(0)';
                }}, 150);
            }}
        }};

        setInterval(cycleTagline, 4000);

        // Skill toggle functionality (click only)
        const skillToggles = document.querySelectorAll('.skill-toggle');
        let openSkill = null;

        skillToggles.forEach(toggle => {{
            const skillItem = toggle.closest('.skill-item');
            const skillContent = skillItem.querySelector('.skill-content');
            const toggleIcon = toggle.querySelector('.skill-toggle-icon');

            const openSkillContent = () => {{
                skillContent.classList.remove('hidden');
                toggleIcon.style.transform = 'rotate(180deg)';
            }};

            const closeSkillContent = () => {{
                skillContent.classList.add('hidden');
                toggleIcon.style.transform = 'rotate(0deg)';
            }};

            toggle.addEventListener('click', () => {{
                if (openSkill && openSkill !== skillItem) {{
                    const prevContent = openSkill.querySelector('.skill-content');
                    const prevIcon = openSkill.querySelector('.skill-toggle-icon');
                    prevContent.classList.add('hidden');
                    prevIcon.style.transform = 'rotate(0deg)';
                }}

                if (skillContent.classList.contains('hidden')) {{
                    openSkillContent();
                    openSkill = skillItem;
                }} else {{
                    closeSkillContent();
                    openSkill = null;
                }}
            }});
        }});

        const filterBtns = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');
        const projectJumpLinks = document.querySelectorAll('.project-jump');
        const activeClasses = ['bg-zinc-900', 'text-white', 'dark:bg-zinc-100', 'dark:text-zinc-900'];
        const inactiveClasses = ['bg-zinc-200', 'text-zinc-700', 'dark:bg-zinc-800', 'dark:text-zinc-300'];
        const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
        const matrixCanvas = document.getElementById('matrix-bg');
        const matrixContext = matrixCanvas ? matrixCanvas.getContext('2d') : null;

        if (matrixCanvas && matrixContext) {{
            const glyphs = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%*+-';
            const fontSize = 14;
            const frameInterval = 55;
            let drops = [];
            let lastFrameTime = 0;

            const resizeMatrix = () => {{
                matrixCanvas.width = window.innerWidth;
                matrixCanvas.height = window.innerHeight;
                const totalColumns = Math.ceil(matrixCanvas.width / fontSize);
                const maxRows = Math.ceil(matrixCanvas.height / fontSize);
                drops = Array.from({{ length: totalColumns }}, () => Math.floor(Math.random() * maxRows));
                matrixContext.font = fontSize + 'px monospace';
                matrixContext.textBaseline = 'top';
            }};

            const drawMatrix = (timestamp) => {{
                if (!lastFrameTime || timestamp - lastFrameTime >= frameInterval) {{
                    lastFrameTime = timestamp;
                    matrixContext.fillStyle = 'rgba(0, 0, 0, 0.12)';
                    matrixContext.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
                    matrixContext.fillStyle = 'rgba(255, 255, 255, 0.9)';

                    for (let i = 0; i < drops.length; i += 1) {{
                        const char = glyphs.charAt(Math.floor(Math.random() * glyphs.length));
                        const x = i * fontSize;
                        const y = drops[i] * fontSize;
                        matrixContext.fillText(char, x, y);

                        if (y > matrixCanvas.height && Math.random() > 0.975) {{
                            drops[i] = 0;
                        }} else {{
                            drops[i] += 1;
                        }}
                    }}
                }}

                window.requestAnimationFrame(drawMatrix);
            }};

            resizeMatrix();
            window.addEventListener('resize', resizeMatrix);
            window.requestAnimationFrame(drawMatrix);
        }}

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
            
            // Add hover brightening for active buttons
            btn.addEventListener('mouseenter', () => {{
                if (btn.classList.contains('active')) {{
                    btn.classList.add('hover:bg-zinc-800');
                }}
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

        // Modal functionality
        const detailsBtns = document.querySelectorAll('.project-details-btn');
        const closeBtns = document.querySelectorAll('.modal-close-btn');

        detailsBtns.forEach(btn => {{
            btn.addEventListener('click', () => {{
                const modalId = btn.getAttribute('data-modal-id');
                const modal = document.getElementById(modalId);
                if (modal) {{
                    modal.classList.remove('hidden');
                    modal.style.display = 'flex';
                }}
            }});
        }});

        closeBtns.forEach(btn => {{
            btn.addEventListener('click', () => {{
                const modalId = btn.getAttribute('data-modal-id');
                const modal = document.getElementById(modalId);
                if (modal) {{
                    modal.classList.add('hidden');
                    modal.style.display = 'none';
                }}
            }});
        }});

        // Close modal when clicking outside
        document.querySelectorAll('[id^="modal-"]').forEach(modal => {{
            modal.addEventListener('click', (e) => {{
                if (e.target === modal) {{
                    modal.classList.add('hidden');
                    modal.style.display = 'none';
                }}
            }});
        }});

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {{
            if (e.key === 'Escape') {{
                document.querySelectorAll('[id^="modal-"]').forEach(modal => {{
                    modal.classList.add('hidden');
                    modal.style.display = 'none';
                }});
            }}
        }});

        // Footer Easter Egg: Raining PFPs
        const footerEasterEgg = document.getElementById('footer-easter-egg');
        footerEasterEgg.addEventListener('click', () => {{
            const pfpPath = 'pfp.webp';
            const rainDuration = 4000;
            const pfpCount = 30;

            for (let i = 0; i < pfpCount; i++) {{
                const pfp = document.createElement('img');
                pfp.src = pfpPath;
                pfp.style.position = 'fixed';
                pfp.style.pointerEvents = 'none';
                pfp.style.zIndex = '9999';
                pfp.style.width = '60px';
                pfp.style.height = '60px';
                pfp.style.borderRadius = '9999px';
                pfp.style.objectFit = 'cover';
                pfp.style.left = Math.random() * 100 + '%';
                pfp.style.top = '-80px';
                
                const randomDuration = 2000 + Math.random() * 2000;
                const randomDelay = i * 100;
                
                pfp.style.animation = `pfpFall ${{randomDuration}}ms linear ${{randomDelay}}ms forwards`;
                
                document.body.appendChild(pfp);
                
                setTimeout(() => {{
                    pfp.remove();
                }}, randomDuration + randomDelay);
            }}
        }});

        // Project copy link functionality
        const copyLinkBtns = document.querySelectorAll('.copy-link-btn');
        copyLinkBtns.forEach(btn => {{
            btn.addEventListener('click', (e) => {{
                e.preventDefault();
                const projectId = btn.getAttribute('data-project-id');
                const url = window.location.origin + window.location.pathname + '#' + projectId;
                navigator.clipboard.writeText(url).then(() => {{
                    const originalIcon = btn.innerHTML;
                    btn.innerHTML = '<ion-icon name="checkmark" class="text-lg"></ion-icon>';
                    setTimeout(() => {{
                        btn.innerHTML = originalIcon;
                    }}, 2000);
                }});
            }});
        }});

        // Project highlight on scroll to
        const highlightProject = (projectId) => {{
            projectCards.forEach(card => {{
                card.classList.remove('ring-2', 'ring-blue-400', 'dark:ring-blue-500');
            }});
            const targetCard = document.getElementById(projectId);
            if (targetCard) {{
                targetCard.classList.add('ring-2', 'ring-blue-400', 'dark:ring-blue-500');
                setTimeout(() => {{
                    targetCard.classList.remove('ring-2', 'ring-blue-400', 'dark:ring-blue-500');
                }}, 3000);
            }}
        }};

        // Check for hash on page load and highlight
        if (window.location.hash) {{
            const projectId = window.location.hash.substring(1);
            highlightProject(projectId);
        }}

        // Handle hash changes
        window.addEventListener('hashchange', () => {{
            const projectId = window.location.hash.substring(1);
            if (projectId) {{
                highlightProject(projectId);
            }}
        }});

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pfpFall {{
                to {{
                    transform: translateY(100vh) rotate(360deg);
                    opacity: 0;
                }}
            }}
            @keyframes skillRollout {{
                from {{
                    opacity: 0;
                    transform: scaleY(0);
                    transform-origin: top;
                }}
                to {{
                    opacity: 1;
                    transform: scaleY(1);
                    transform-origin: top;
                }}
            }}
            .skill-rollout:not(.hidden) {{
                animation: skillRollout 0.3s ease-out;
            }}
        `;
        document.head.appendChild(style);
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
