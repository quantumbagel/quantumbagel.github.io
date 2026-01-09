import os
import htmlmin

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
        {"icon": "school-outline", "label": "Credits", "value": "63"},
        {"icon": "logo-github", "label": "GitHub", "value": "@quantumbagel"},
        {"icon": "logo-linkedin", "label": "LinkedIn", "value": "@julian-reder-nc"},
        {"icon": "logo-discord", "label": "Discord", "value": "@thequantumbagel"}

    ]
}

ABOUT_ME = [
    "Hello! I'm <strong class=\"text-gray-800 dark:text-white\">Julian Reder</strong>, a programmer and student at North Carolina State University. This is version 2 of my portfolio website, with this one being entirely coded from scratch using Tailwind because I'm lazy.",
    "This website serves as mostly just a list of the projects I've made. Feel free to look at my <a href=\"#projects\" class=\"text-blue-500 hover:underline\">projects</a> or learn more about my <a href=\"#experience\" class=\"text-blue-500 hover:underline\">experience</a>.",
    "I just really like making stuff that comes to my mind and thought it would be cool to share here."
]

EXPERIENCES = [
    {
        "icon": "school-outline",
        "title": "North Carolina State University",
        "date": "Fall 2025 - Present",
        "description": "I am currently enrolled in the Computer Engineering program at North Carolina State University. I am also considering pursuing a Bachelor's degree in Statistics and a Master's of Computer Science"
    },
    {
        "icon": "code-slash-outline",
        "title": "AERPAW Developer",
        "date": "2023 - Present",
        "description": "I have had the pleasure to work with Dr. Mihail Sichitiu at the Aerial Experimentation and Research Platform for Advanced Wireless at North Carolina State University for a couple of years now."
                       "I have built several interesting projects including a plane tracker and a drone flight recorder."
    },
    {
        "icon": "school-outline",
        "title": "Wake Tech Community College",
        "date": "Fall 2023 - Spring 2025",
        "description": "This was my first experience taking college coursework. I graduated with multiple appearances on the Dean's List, membership in the Phi Theta Kappa chapter, and an Associates in Engineering degree."
    }
]

SKILLS = {
    "Programming Languages": [
        {"name": "Python", "level": "Expert", "percentage": 100},
        {"name": "C/C++", "level": "Advanced", "percentage": 90},
        {"name": "JavaScript", "level": "Advanced", "percentage": 85},
        {"name": "Java", "level": "Competent", "percentage": 80},
        {"name": "C#", "level": "Competent", "percentage": 75},
        {"name": "Bash", "level": "Competent", "percentage": 70},
    ],
    "Technologies & Frameworks": [
        {"name": "Linux/Unix", "level": "Expert", "percentage": 100},
        {"name": "Docker", "level": "Expert", "percentage": 100},
        {"name": "JetBrains Suite", "level": "Expert", "percentage": 100},
        {"name": "Git", "level": "Advanced", "percentage": 90},
        {"name": "Selenium / Web Scraping", "level": "Advanced", "percentage": 90},
        {"name": "OpenAPI", "level": "Advanced", "percentage": 90},
        {"name": "SQL/MySQL/Postgres", "level": "Advanced", "percentage": 90},
        {"name": "MongoDB", "level": "Advanced", "percentage": 90},
        {"name": "Solidworks / CAD", "level": "Competent", "percentage": 80},
    ]
}

PROJECTS = [
    {
        "category": "internship",
        "image": "https://placehold.co/400x250/3498DB/FFFFFF?text=PyAerial",
        "title": "PyAerial",
        "description": "A better plane tracker for AERPAW, successor to airstrik.py.",
        "link": "https://github.com/quantumbagel/PyAerial",
        "skills": ["Python", "MavSDK", "Docker", "MongoDB", "ADS-B"],
    },
{
        "category": "internship",
        "image": "https://placehold.co/400x250/E74C3C/FFFFFF?text=airstrik.py",
        "title": "airstrik.py",
        "description": "A pure-python ADS-B plane tracker for AERPAW.",
        "link": "https://github.com/quantumbagel/airstrik.py",
        "skills": ["Python", "MavSDK", "Docker", "MongoDB", "ADS-B"]
    },
    {
        "category": "discord-bots",
        "image": "https://placehold.co/400x250/2ECC71/FFFFFF?text=Piranha",
        "title": "Piranha",
        "description": "A chess-playing Discord bot with various features.",
        "link": None,
        "skills": ["Python", "Stockfish", "Docker"]
    },
    {
        "category": "other",
        "image": "https://placehold.co/400x250/E74C3C/FFFFFF?text=finiteCraft",
        "title": "finiteCraft",
        "description": "A web scraper and craft finder for Neal Agarwal's Infinite Craft.",
        "link": "https://github.com/finiteCraft/finiteCraft",
        "skills": ["Python", "Selenium", "Web Scraping", "Proxies", "Automation"]
    },
    {
        "category": "internship",
        "image": "https://placehold.co/400x250/9B59B6/FFFFFF?text=DroneTracker",
        "title": "DroneTracker",
        "description": "Track drones with cameras! Another AERPAW project.",
        "link": "https://github.com/quantumbagel/DroneTracker",
        "skills": ["Python", "VAPIX", "Docker", "MavSDK", "netcat", "Linux"]
    },
    {
        "category": "discord-bots",
        "image": "https://placehold.co/400x250/F1C40F/FFFFFF?text=Triggered",
        "title": "Triggered",
        "description": "An if-this-than-that Discord bot for automation and fun.",
        "link": "https://github.com/quantumbagel/Triggered",
        "skills": ["Python", "discord.py", "MySQL", "Programmable API"]
    },
    {
        "category": "other",
        "image": "https://placehold.co/400x250/1ABC9C/FFFFFF?text=Portfolio v1",
        "title": "Portfolio Website (v1)",
        "description": "A remake of the vCard portfolio website.",
        "link": "https://github.com/quantumbagel/quantumbagel.github.io/tree/d76d5fac008ab10e3a32b2550b36a8dd0a06b835",
        "skills": ["Python", "HTML", "CSS", "JS", "Ion-Icons"]
    },
    {
        "category": "other",
        "image": "https://placehold.co/400x250/E74C3C/FFFFFF?text=Portfolio v2",
        "title": "Portfolio Website (v2)",
        "description": "A new portfolio website for me from the ground up. Made in three days.",
        "link": "https://github.com/quantumbagel/quantumbagel.github.io",
        "skills": ["Python", "HTML", "CSS", "JS", "TailwindCSS", "Ion-Icons"]
    },
    {
        "category": "discord-bots",
        "image": "https://placehold.co/400x250/F1C40F/FFFFFF?text=PlayCord",
        "title": "PlayCord",
        "description": "A Discord bot for paper and pencil games with fully functional local and global leaderboards, and dynamic loading of games.",
        "link": "https://github.com/PlayCord/bot",
        "skills": ["Python", "discord.py", "MySQL", "Programmable API", ""]
    },
    {
        "category": "other",
        "image": "https://placehold.co/400x250/3498DB/FFFFFF?text=Statify",
        "title": "Statify",
        "description": "A SpigotMC plugin for statistics aggregation and leaderboards",
        "link": "https://github.com/quantumbagel/Statify",
        "skills": ["Java", "SpigotMC"]
    },
    {
        "category": "other",
        "image": "https://placehold.co/400x250/2ECC71/FFFFFF?text=Molotov",
        "title": "Molotov",
        "description": "A Selenium-based bot for the game Bomb Party (jklm.fun)",
        "link": "https://github.com/quantumbagel/Statify",
        "skills": ["Python", "Selenium", "JavaScript"]
    },
]


# ==============================================================================
# HTML GENERATION FUNCTIONS
# ==============================================================================
# These functions build the HTML components of the website.
# You shouldn't need to edit these unless you want to change the site's layout.
# ==============================================================================

def generate_timeline_item(item):
    """Generates a single timeline item for the experience section."""
    return f"""
                        <div class="mb-10 ml-8">
                            <span class="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-8 ring-white dark:ring-gray-800 dark:bg-blue-900">
                                <ion-icon name="{item['icon']}" class="text-blue-500 dark:text-blue-400"></ion-icon>
                            </span>
                            <h3 class="flex items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white">{item['title']}</h3>
                            <time class="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">{item['date']}</time>
                            <p class="text-base font-normal text-gray-500 dark:text-gray-400">{item['description']}</p>
                        </div>"""


def generate_skill_bar(skill):
    """Generates a single skill bar."""
    return f"""
                            <div class="mb-4">
                                <div class="flex justify-between mb-1">
                                    <span class="text-base font-medium text-gray-700 dark:text-gray-300">{skill['name']}</span>
                                    <span class="text-sm font-medium text-blue-700 dark:text-blue-400">{skill['level']}</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div class="bg-blue-500 h-2.5 rounded-full skill-bar-fill" style="width: {skill['percentage']}%"></div>
                                </div>
                            </div>"""


def generate_project_card(project):
    """
    Generates a single project card with advanced hover effects.

    Expects a project dictionary with keys: 'category', 'image',
    'hover_image', 'title', 'description', 'skills', and 'link'.
    """
    # Gracefully handle projects that may not have a hover image
    # It will use the main image as a fallback to prevent errors
    hover_image_src = project.get('hover_image', project.get('image'))

    # Generate HTML for skill pills if they exist
    skills_html = ""
    if project.get("skills"):
        pills_html = "".join([
            f'<span class="inline-block bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium mr-2 mb-2 px-3 py-1 rounded-full">{skill}</span>'
            for skill in project['skills']
        ])
        skills_html = f'<div class="flex flex-wrap mt-4">{pills_html}</div>'

    # Generate HTML for the link if it exists
    link_html = ""
    if project.get("link"):
        link_html = f'<a href="{project["link"]}" class="text-blue-500 font-semibold hover:underline mt-4 inline-block">View Project &rarr;</a>'

    # Return the complete card HTML using an f-string
    return f"""
<div class="project-card {project.get('category', 'other')} group relative hover:z-10">
    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl flex flex-col h-full">

        <div class="relative h-48 transition-all duration-300 overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img src="{project.get('image')}" 
                 class="absolute w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 flex items-center justify-center text-gray-500 dark:text-gray-400" 
                 alt="{project.get('title')} Project">

            <img src="{hover_image_src}" 
                 class="absolute w-full h-full object-cover opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 flex items-center justify-center text-gray-500 dark:text-gray-400" 
                 alt="{project.get('title')} Preview">
        </div>

        <div class="p-6 flex flex-col flex-grow">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{project.get('title')}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">{project.get('description')}</p>
            <div class="mt-auto">
                {skills_html}
                {link_html}
            </div>
        </div>
    </div>
</div>
"""

def create_html_structure():
    """Builds the final HTML file content by assembling all components."""

    # Generate dynamic components
    timeline_items_html = "".join([generate_timeline_item(item) for item in EXPERIENCES])

    programming_skills_html = "".join([generate_skill_bar(skill) for skill in SKILLS['Programming Languages']])
    tech_skills_html = "".join([generate_skill_bar(skill) for skill in SKILLS['Technologies & Frameworks']])

    project_cards_html = "".join([generate_project_card(project) for project in PROJECTS])

    contact_details_html = "".join([f"""
                    <li class="flex items-center">
                        <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-gray-700 flex items-center justify-center mr-4">
                            <ion-icon name="{detail['icon']}" class="text-blue-500 dark:text-blue-400 text-xl"></ion-icon>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{detail['label']}</p>
                            <p class="font-medium text-gray-800 dark:text-gray-200">{detail['value']}</p>
                        </div>
                    </li>""" for detail in PERSONAL_INFO['contact_details']])

    about_me_html = "".join([f"<p>{paragraph}</p>" for paragraph in ABOUT_ME])

    # Assemble the final HTML
    html_content = f"""
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{PERSONAL_INFO['name']} - Developer Portfolio</title>
    <meta name="description" content="Personal portfolio for Julian Reder (@quantumbagel), a Computer Engineering student at NCSU showcasing software development projects in Python, C++, Docker, and more.">
    <meta name="author" content="Julian Reder">
    <meta name="keywords" content="Julian Reder, portfolio, developer, computer engineering, programmer, NCSU, North Carolina State University, Python, C++, Docker, Tailwind CSS, projects">

    <meta property="og:title" content="Julian Reder - Developer Portfolio">
    <meta property="og:description" content="A Computer Engineering student at NCSU showcasing software development projects.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://quantumbagel.github.io/"> <meta property="og:image" content="https://quantumbagel.github.io/social-preview.png"> <meta property="og:site_name" content="Julian Reder's Portfolio">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Julian Reder - Developer Portfolio">
    <meta name="twitter:description" content="A Computer Engineering student at NCSU showcasing software development projects.">
    <meta name="twitter:image" content="https://quantumbagel.github.io"> 
    <meta name="twitter:creator" content="@quantumbagel">

    <link rel="icon" type="image/png" href="pfp.webp">

    <link rel="apple-touch-icon" href="pfp.webp">
    <script src="tailwind.js"></script>
    <link href="font.css" rel="stylesheet">
    <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js" defer></script>
    <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js" defer></script>
    <style>
        html, body {{
            font-family: 'Inter', sans-serif;
            overflow-x: hidden;
        }}
        html {{
            scroll-behavior: smooth;
        }}
        .sidebar {{
            -ms-overflow-style: none;
            scrollbar-width: none;  
        }}
        .sidebar::-webkit-scrollbar {{ 
            display: none; 
        }}
        .active-nav {{
            color: #000000 !important;
            background-color: #EFF6FF;
        }}
        /* Project Modal Styles */
        .project-modal {{
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
            backdrop-filter: blur(4px);
        }}
        .project-modal.active {{
            opacity: 1;
            visibility: visible;
        }}
        .project-modal-content {{
            background: white;
            border-radius: 1rem;
            max-width: 600px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            transform: scale(0.9) translateY(20px);
            transition: transform 0.3s ease;
        }}
        .project-modal.active .project-modal-content {{
            transform: scale(1) translateY(0);
        }}
        .dark .project-modal-content {{
            background: #1f2937;
        }}
        /* Fix for project card hover overflow */
        #project-grid {{
            overflow: visible;
            padding: 1rem;
            margin: -1rem;
        }}
        .project-card {{
            transition: transform 0.3s ease;
        }}
        .project-card:hover {{
            transform: translateY(-4px);
        }}
        /* Click indicator on project cards */
        .project-card .click-indicator {{
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            background: rgba(59, 130, 246, 0.9);
            color: white;
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 10;
        }}
        .project-card:hover .click-indicator {{
            opacity: 1;
        }}
    </style>
</head>
<body class="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
    <div class="flex flex-col lg:flex-row min-h-screen">
        <!-- Sidebar -->
        <aside class="w-full lg:w-1/4 lg:max-w-sm bg-white dark:bg-gray-800 lg:fixed lg:h-full lg:overflow-y-auto sidebar border-r border-gray-200 dark:border-gray-700 p-8 shadow-lg lg:shadow-none">
            <div class="flex flex-col items-center text-center">
                <div class="relative">
                    <img class="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-md" src="{PERSONAL_INFO['profile_image']}" alt="{PERSONAL_INFO['name']}">
                </div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{PERSONAL_INFO['name']}</h1>
                <p class="text-blue-500 dark:text-blue-400 mt-1">{PERSONAL_INFO['title']}</p>

                <div class="flex justify-center space-x-4 mt-6">
                    <a href="{PERSONAL_INFO['social_links']['github']}"  aria-label="GitHub" class="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300">
                        <ion-icon name="logo-github" class="text-3xl"></ion-icon>
                    </a>
                    <a href="{PERSONAL_INFO['social_links']['linkedin']}" aria-label="LinkedIn" class="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300">
                        <ion-icon name="logo-linkedin" class="text-3xl"></ion-icon>
                    </a>
                    <a href="{PERSONAL_INFO['social_links']['discord']}" aria-label="Discord" class="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300">
                        <ion-icon name="logo-discord" class="text-3xl"></ion-icon>
                    </a>
                    <a href="{PERSONAL_INFO['social_links']['resume']}" aria-label="Resume" class="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300">
                        <ion-icon name="document" class="text-3xl"></ion-icon>
                    </a>
                </div>
            </div>

            <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <ul class="space-y-4">
                    {contact_details_html}
                </ul>
            </div>
             <div class="mt-8 text-center">
                <a href="#contact" class="inline-block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:-translate-y-1">
                    Contact Me
                </a>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="w-full lg:ml-[24rem] p-4 sm:p-8 lg:p-12">
            <!-- Navigation -->
            <nav class="bg-white dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-lg sticky top-0 z-50 mb-8 hidden lg:block">
                 <ul class="flex justify-center items-center space-x-2">
                    <li><a href="#about" class="nav-link px-4 py-2 rounded-md font-medium text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-300">About</a></li>
                    <li><a href="#experience" class="nav-link px-4 py-2 rounded-md font-medium text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-300">Experience</a></li>
                    <li><a href="#skills" class="nav-link px-4 py-2 rounded-md font-medium text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-300">Skills</a></li>
                    <li><a href="#projects" class="nav-link px-4 py-2 rounded-md font-medium text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-300">Projects</a></li>
                    <li><a href="#contact" class="nav-link px-4 py-2 rounded-md font-medium text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-300">Contact</a></li>
                </ul>
            </nav>

            <!-- About Section -->
            <section id="about" class="mb-16 scroll-mt-24">
                <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                    <h2 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
                        <ion-icon name="person-outline" class="mr-3 text-blue-500"></ion-icon>
                        About Me
                    </h2>
                    <div class="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                        {about_me_html}
                    </div>
                </div>
            </section>

            <!-- Experience Section -->
            <section id="experience" class="mb-16 scroll-mt-24">
                <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                    <h2 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white flex items-center">
                        <ion-icon name="briefcase-outline" class="mr-3 text-blue-500"></ion-icon>
                        Experience & Education
                    </h2>
                    <div class="relative border-l-2 border-blue-200 dark:border-gray-700 ml-4">
                        {timeline_items_html}
                    </div>
                </div>
            </section>

            <!-- Skills Section -->
            <section id="skills" class="mb-16 scroll-mt-24">
                <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                    <h2 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white flex items-center">
                        <ion-icon name="bar-chart-outline" class="mr-3 text-blue-500"></ion-icon>
                        My Skills
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 class="text-lg font-semibold mb-4">Programming Languages</h3>
                            {programming_skills_html}
                        </div>
                         <div>
                            <h3 class="text-lg font-semibold mb-4">Technologies & Frameworks</h3>
                            {tech_skills_html}
                        </div>
                    </div>
                </div>
            </section>

            <!-- Projects Section -->
            <section id="projects" class="mb-16 scroll-mt-24">
                 <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                    <h2 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white flex items-center">
                        <ion-icon name="folder-open-outline" class="mr-3 text-blue-500"></ion-icon>
                        Projects
                    </h2>
                    <div class="flex flex-wrap justify-center gap-2 mb-8" id="filter-buttons">
                        <button class="filter-btn active-filter-btn bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium" data-filter="all">All</button>
                        <button class="filter-btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full text-sm font-medium" data-filter="discord-bots">Discord Bots</button>
                        <button class="filter-btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full text-sm font-medium" data-filter="internship">Internship</button>
                        <button class="filter-btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full text-sm font-medium" data-filter="other">Other</button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="project-grid">
                        {project_cards_html}
                    </div>
                </div>
            </section>

            <!-- Contact Section -->
            <section id="contact" class="scroll-mt-24">
                <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                    <h2 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
                        <ion-icon name="mail-outline" class="mr-3 text-blue-500"></ion-icon>
                        Contact Me
                    </h2>
                    <p class="mb-8 text-gray-600 dark:text-gray-300">
                        If you have a project or position you think I might be interested in, feel free to reach out using this form. :3
                    </p>
                    <form action="https://formspree.io/f/moqgwdop" method="POST" class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input type="text" name="fullname" placeholder="Your Name" required class="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-blue-500 rounded-lg outline-none transition-all">
                            <input type="email" name="email" placeholder="Your Email Address" required class="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-blue-500 rounded-lg outline-none transition-all">
                        </div>
                        <textarea name="message" placeholder="Your Message" rows="5" required class="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-blue-500 rounded-lg outline-none transition-all"></textarea>
                        <button type="submit" class="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center">
                             <ion-icon name="paper-plane-outline" class="mr-2"></ion-icon> Send Message
                        </button>
                    </form>
                </div>
            </section>
        </main>
    </div>

    <!-- Project Modal -->
    <div id="project-modal" class="project-modal">
        <div class="project-modal-content shadow-2xl">
            <div class="relative">
                <div id="modal-image" class="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-xl"></div>
                <button id="modal-close" class="absolute top-4 right-4 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <ion-icon name="close-outline" class="text-xl text-gray-700 dark:text-gray-300"></ion-icon>
                </button>
            </div>
            <div class="p-6">
                <h3 id="modal-title" class="text-2xl font-bold text-gray-900 dark:text-white mb-2"></h3>
                <p id="modal-category" class="text-sm text-blue-500 mb-4"></p>
                <p id="modal-description" class="text-gray-600 dark:text-gray-300 mb-4"></p>
                <div id="modal-details" class="text-gray-600 dark:text-gray-400 text-sm mb-4 space-y-2"></div>
                <div id="modal-tags" class="flex flex-wrap gap-2 mb-6"></div>
                <a id="modal-link" href="#" target="_blank" class="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    <ion-icon name="logo-github" class="mr-2"></ion-icon>
                    View on GitHub
                </a>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {{
            // Project data with extended information
            const projectData = {{
                'PyAerial': {{
                    category: 'Internship Project',
                    description: 'A better plane tracker for AERPAW, successor to airstrik.py.',
                    details: 'PyAerial is a comprehensive ADS-B tracking solution developed for the AERPAW research platform at NC State. It provides real-time aircraft position tracking, historical data storage, and visualization capabilities.',
                    features: ['Real-time ADS-B decoding', 'MongoDB integration for data persistence', 'Docker containerized deployment', 'RESTful API for data access'],
                    image: 'https://placehold.co/600x300/3498DB/FFFFFF?text=PyAerial',
                    link: 'https://github.com/quantumbagel/PyAerial'
                }},
                'airstrik.py': {{
                    category: 'Internship Project',
                    description: 'A pure-python ADS-B plane tracker for AERPAW.',
                    details: 'The original pure-Python implementation of an ADS-B tracker for drone airspace monitoring. This project laid the groundwork for PyAerial.',
                    features: ['Pure Python implementation', 'ADS-B signal processing', 'Integration with MavSDK for drone communication'],
                    image: 'https://placehold.co/600x300/E74C3C/FFFFFF?text=airstrik.py',
                    link: 'https://github.com/quantumbagel/airstrik.py'
                }},
                'Piranha': {{
                    category: 'Discord Bot',
                    description: 'A chess-playing Discord bot with various features.',
                    details: 'Piranha is a feature-rich Discord bot that allows users to play chess directly within Discord. It integrates with the Stockfish chess engine for AI opponents.',
                    features: ['Play chess against AI or friends', 'Multiple difficulty levels via Stockfish', 'Game history and statistics', 'Docker deployment support'],
                    image: 'https://placehold.co/600x300/2ECC71/FFFFFF?text=Piranha',
                    link: ''
                }},
                'finiteCraft': {{
                    category: 'Other Project',
                    description: "A web scraper and craft finder for Neal Agarwal's Infinite Craft.",
                    details: 'finiteCraft is an automation tool that scrapes and discovers all possible crafting combinations in the game Infinite Craft. Uses distributed proxy networks for efficient scraping.',
                    features: ['Selenium-based automation', 'Proxy rotation support', 'Crafting recipe database', 'Pathfinding algorithms for recipe discovery'],
                    image: 'https://placehold.co/600x300/E74C3C/FFFFFF?text=finiteCraft',
                    link: 'https://github.com/finiteCraft/finiteCraft'
                }},
                'DroneTracker': {{
                    category: 'Internship Project',
                    description: 'Track drones with cameras! Another AERPAW project.',
                    details: 'DroneTracker is a computer vision system that uses PTZ cameras to track drones in real-time. It integrates with AXIS cameras via VAPIX protocol.',
                    features: ['PTZ camera control via VAPIX', 'Real-time drone position estimation', 'MavSDK integration for telemetry', 'Containerized deployment'],
                    image: 'https://placehold.co/600x300/9B59B6/FFFFFF?text=DroneTracker',
                    link: 'https://github.com/quantumbagel/DroneTracker'
                }},
                'Triggered': {{
                    category: 'Discord Bot',
                    description: 'An if-this-than-that Discord bot for automation and fun.',
                    details: 'Triggered allows Discord server administrators to create custom automation rules based on triggers and actions, similar to IFTTT.',
                    features: ['Custom trigger/action system', 'Programmable API', 'MySQL database for persistence', 'Extensive customization options'],
                    image: 'https://placehold.co/600x300/F1C40F/FFFFFF?text=Triggered',
                    link: 'https://github.com/quantumbagel/Triggered'
                }},
                'Portfolio Website (v1)': {{
                    category: 'Other Project',
                    description: 'A remake of the vCard portfolio website.',
                    details: 'The first version of my portfolio website, built as a customized version of the vCard template with personal modifications.',
                    features: ['Responsive design', 'Custom styling', 'Ion-Icons integration'],
                    image: 'https://placehold.co/600x300/1ABC9C/FFFFFF?text=Portfolio+v1',
                    link: 'https://github.com/quantumbagel/quantumbagel.github.io/tree/d76d5fac008ab10e3a32b2550b36a8dd0a06b835'
                }},
                'Portfolio Website (v2)': {{
                    category: 'Other Project',
                    description: 'A new portfolio website for me from the ground up. Made in three days.',
                    details: "The current portfolio website you're viewing! Built from scratch using TailwindCSS for a modern, responsive design.",
                    features: ['TailwindCSS styling', 'Dark mode support', 'Smooth scrolling navigation', 'Project filtering system'],
                    image: 'https://placehold.co/600x300/E74C3C/FFFFFF?text=Portfolio+v2',
                    link: 'https://github.com/quantumbagel/quantumbagel.github.io'
                }},
                'PlayCord': {{
                    category: 'Discord Bot',
                    description: 'A Discord bot for paper and pencil games with fully functional local and global leaderboards, and dynamic loading of games.',
                    details: 'PlayCord brings classic paper and pencil games to Discord with a competitive twist. Features global and server-specific leaderboards.',
                    features: ['Multiple game modes', 'Global and local leaderboards', 'Dynamic game loading system', 'MySQL persistence'],
                    image: 'https://placehold.co/600x300/F1C40F/FFFFFF?text=PlayCord',
                    link: 'https://github.com/PlayCord/bot'
                }},
                'Statify': {{
                    category: 'Other Project',
                    description: 'A SpigotMC plugin for statistics aggregation and leaderboards',
                    details: 'Statify is a Minecraft server plugin that tracks player statistics and generates leaderboards for competitive servers.',
                    features: ['Comprehensive stat tracking', 'Customizable leaderboards', 'SpigotMC API integration'],
                    image: 'https://placehold.co/600x300/3498DB/FFFFFF?text=Statify',
                    link: 'https://github.com/quantumbagel/Statify'
                }},
                'Molotov': {{
                    category: 'Other Project',
                    description: 'A Selenium-based bot for the game Bomb Party (jklm.fun)',
                    details: 'Molotov is an automation bot for the word game Bomb Party. It uses Selenium to interact with the game and an optimized word database for fast responses.',
                    features: ['Selenium automation', 'Optimized word lookup', 'Configurable response timing', 'JavaScript injection for speed'],
                    image: 'https://placehold.co/600x300/2ECC71/FFFFFF?text=Molotov',
                    link: 'https://github.com/quantumbagel/Molotov'
                }}
            }};

            // Modal elements
            const modal = document.getElementById('project-modal');
            const modalClose = document.getElementById('modal-close');
            const modalImage = document.getElementById('modal-image');
            const modalTitle = document.getElementById('modal-title');
            const modalCategory = document.getElementById('modal-category');
            const modalDescription = document.getElementById('modal-description');
            const modalDetails = document.getElementById('modal-details');
            const modalTags = document.getElementById('modal-tags');
            const modalLink = document.getElementById('modal-link');

            // Open modal function
            function openModal(projectName, tags) {{
                const data = projectData[projectName];
                if (!data) return;

                modalImage.style.backgroundImage = `url('${{data.image}}')`;
                modalImage.style.backgroundSize = 'cover';
                modalImage.style.backgroundPosition = 'center';
                modalTitle.textContent = projectName;
                modalCategory.textContent = data.category;
                modalDescription.textContent = data.details || data.description;

                // Add features list
                if (data.features && data.features.length > 0) {{
                    modalDetails.innerHTML = '<p class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Features:</p><ul class="list-disc list-inside space-y-1">' +
                        data.features.map(f => `<li>${{f}}</li>`).join('') + '</ul>';
                }} else {{
                    modalDetails.innerHTML = '';
                }}

                // Add tags
                modalTags.innerHTML = tags.map(tag =>
                    `<span class="inline-block bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium px-3 py-1 rounded-full">${{tag}}</span>`
                ).join('');

                // Set link
                if (data.link) {{
                    modalLink.href = data.link;
                    modalLink.style.display = 'inline-flex';
                }} else {{
                    modalLink.style.display = 'none';
                }}

                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }}

            // Close modal function
            function closeModal() {{
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }}

            // Add click handlers to project cards
            document.querySelectorAll('.project-card').forEach(card => {{
                card.style.cursor = 'pointer';

                // Get project name and tags from the card
                const titleEl = card.querySelector('h3');
                const tagEls = card.querySelectorAll('.flex.flex-wrap span');

                if (titleEl) {{
                    const projectName = titleEl.textContent.trim();
                    const tags = Array.from(tagEls).map(el => el.textContent.trim()).filter(t => t);

                    // Add click indicator icon
                    const indicator = document.createElement('div');
                    indicator.className = 'click-indicator';
                    indicator.innerHTML = '<ion-icon name="expand-outline"></ion-icon>';
                    const cardInner = card.querySelector('.bg-gray-50');
                    if (cardInner) {{
                        cardInner.style.position = 'relative';
                        cardInner.appendChild(indicator);
                    }}

                    card.addEventListener('click', (e) => {{
                        // Don't open modal if clicking the link
                        if (e.target.closest('a')) return;
                        openModal(projectName, tags);
                    }});
                }}
            }});

            // Close modal events
            modalClose.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {{
                if (e.target === modal) closeModal();
            }});
            document.addEventListener('keydown', (e) => {{
                if (e.key === 'Escape') closeModal();
            }});

            // Project filtering
            const filterButtons = document.querySelectorAll('.filter-btn');
            const projectCards = document.querySelectorAll('.project-card');

            filterButtons.forEach(button => {{
                button.addEventListener('click', () => {{
                    const filter = button.dataset.filter;
                    filterButtons.forEach(btn => {{
                        btn.classList.remove('active-filter-btn', 'bg-blue-500', 'text-white');
                        btn.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-200');
                    }});
                    button.classList.add('active-filter-btn', 'bg-blue-500', 'text-white');
                    button.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-200');
                    projectCards.forEach(card => {{
                        if (filter === 'all' || card.classList.contains(filter)) {{
                            card.style.display = 'block';
                        }} else {{
                            card.style.display = 'none';
                        }}
                    }});
                }});
            }});

            // --- Navigation Highlighting ---
            const sections = document.querySelectorAll('section');
            const navLinks = document.querySelectorAll('.nav-link');

            const observer = new IntersectionObserver((entries) => {{
                entries.forEach(entry => {{
                    if (entry.isIntersecting) {{
                        const id = entry.target.getAttribute('id');
                        navLinks.forEach(link => link.classList.remove('active-nav'));
                        const activeLink = document.querySelector(`.nav-link[href="#${{id}}"]`);
                        if (activeLink) {{
                            activeLink.classList.add('active-nav');
                        }}
                    }}
                }});
            }}, {{
                rootMargin: '-40% 0px -40% 0px'
            }});

            sections.forEach(section => observer.observe(section));

            const handleEdgeCases = () => {{
                const scrollPosition = window.scrollY;
                const pageHeight = document.body.offsetHeight;
                const viewportHeight = window.innerHeight;

                if (scrollPosition < 50) {{
                    navLinks.forEach(link => link.classList.remove('active-nav'));
                    document.querySelector('.nav-link[href="#about"]')?.classList.add('active-nav');
                }}
                else if (pageHeight - (scrollPosition + viewportHeight) < 50) {{
                    navLinks.forEach(link => link.classList.remove('active-nav'));
                    document.querySelector('.nav-link[href="#contact"]')?.classList.add('active-nav');
                }}
            }};

            window.addEventListener('scroll', handleEdgeCases);
            handleEdgeCases();
        }});
    </script>
</body>
</html>
"""
    return html_content


def main():
    """Main function to generate and save the HTML file."""
    # Ensure the output directory exists


    # Generate the HTML content
    html_output = create_html_structure()

    minified = htmlmin.minify(html_output, remove_empty_space=True)

    # Write the content to the portfolio.html file
    file_path = os.path.join("index.html")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(minified)

    print(f"Successfully generated portfolio website!")
    print(f"File saved to: {os.path.abspath(file_path)}")


if __name__ == "__main__":
    main()

