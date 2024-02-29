import markdown

INFO_TEMPLATE = """
<li class="contact-item">
            <div class="icon-box">
              <ion-icon name="ICON"></ion-icon>
            </div>
            <div class="contact-info">
              <p class="contact-title">NAME</p>
              <address>VALUE</address>
            </div>
          </li>
"""
INFO_TEMPLATE_VARIABLES = ["ICON", "NAME", "VALUE"]

SOCIAL_TEMPLATE = """
<li class="social-item">
            <a href="URL" class="social-link">
              <ion-icon name="ICON"></ion-icon>
            </a>
          </li>
  """

SOCIAL_TEMPLATE_VARIABLES = ["URL", "ICON"]

PAGE_TEMPLATE_NAVBAR_HOMEPAGE = """
<li class="navbar-item">
            <button class="navbar-link  active" data-nav-link>NAME</button>
          </li>
"""

PAGE_VARIABLES = ["NAME"]

PAGE_TEMPLATE_NAVBAR = """<li class="navbar-item">
            <button class="navbar-link" data-nav-link>NAME</button>
          </li>
"""

ARTICLE_TEMPLATE = """<article class="LOWER_NAME" data-page="LOWER_NAME">
          <header>
          <h2 class="h2 article-title">NAME</h2>
          </header>
        SECTIONS
</article>
"""

ARTICLE_VARIABLES = ["NAME"]
TIMELINE_TEMPLATE = """<section class="timeline">
      header_goes_here
      <ol class="timeline-list">
           TIMELINE            
      </ol>
    </section>
        """

TIMELINE_TEMPLATE_VARIABLES = ["TIMELINE_NAME", "TIMELINE"]

TIMELINE_ITEM_TEMPLATE = """<li class="timeline-item">
      <h4 class="h4 timeline-item-title">NAME</h4>
      <span>TIME_PERIOD</span>
      <p class="timeline-text">DESCRIPTION</p>
</li>
"""

TIMELINE_ITEM_VARIABLES = ["NAME", "TIME_PERIOD", "DESCRIPTION"]

OPTIONAL_HEADER_TEMPLATE = """<div class="title-wrapper-default">
            <div class="icon-box">
              <ion-icon name="ICON"></ion-icon>
            </div>
            <h3 class="h3">NAME</h3>
          </div>
"""
SKILLS_TEMPLATE = """<section class="skill">
          header_goes_here
          <ul class="skills-list content-card">SKILLS</ul>
</section>"""
SKILLS_VARIABLES = ["NAME", "SKILLS"]
SKILLS_ITEM_TEMPLATE = """<li class="skills-item">
              <div class="title-wrapper">
                <h5 class="h5">NAME</h5>
                <data value="AMOUNT">AMOUNT%</data>
              </div>
              <div class="skill-progress-bg">
                <div class="skill-progress-fill" style="width: AMOUNT%;"></div>
              </div>
 </li>
 """

SKILLS_ITEM_VARIABLES = ["NAME", "AMOUNT"]

CONTACT_FORM_TEMPLATE = """<section class="contact-form">
        header_goes_here
          <form action="FORMSPREE_URL" class="form" method="POST" data-form>
            <div class="input-wrapper">
              <input type="text" name="fullname" class="form-input" placeholder="Full Name" required data-form-input>
              <input type="email" name="email" class="form-input" placeholder="Email Address" required data-form-input>
            </div>
            <textarea name="message" class="form-input" placeholder="Your Message" required data-form-input></textarea>
            <button class="form-btn" type="submit" disabled data-form-btn>
              <ion-icon name="paper-plane"></ion-icon>
              <span>Send Message</span>
            </button>
          </form>
        </section>"""

CONTACT_FORM_TEMPLATE_VARIABLES = ["FORMSPREE_URL"]

PROJECT_ITEM_TEMPLATE = """<li class="project-item  active" data-filter-item data-category="CATEGORY">
              <a href="LINK">
                <figure class="project-img">
                  <div class="project-item-icon-box">
                    <ion-icon name="eye-outline"></ion-icon>
                  </div>
                  <img src="PROJECT_IMAGE" alt="PROJECT_NAME" loading="lazy">
                </figure>
                <h3 class="project-title">PROJECT_NAME</h3>
                <p class="project-category">DESCRIPTION</p>
              </a>
            </li>
           """

PROJECT_TEMPLATE = """
        <section class="projects">
        header_goes_here
          <ul class="filter-list">
          <li class="filter-item">
              <button class="active" data-filter-btn>All</button>   
            </li>
FILTER_ITEMS
          </ul>
          <div class="filter-select-box">
            <button class="filter-select" data-select>
              <div class="select-value" data-select-value>Select category</div>
              <div class="select-icon">
                <ion-icon name="chevron-down"></ion-icon>
              </div>
            </button>
            <ul class="select-list">
            <li class="select-item">
              <button class="active" data-filter-btn>All</button>   
            </li>
SELECT_ITEMS
            </ul>
          </div>
          <ul class="project-list">
PROJECT_ITEMS
          </ul>
          </section>
          </ul>


"""

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>

<!-- Google tag (gtag.js) -->
<script defer src="https://www.googletagmanager.com/gtag/js?id=GTAG_IDENTIFICATION"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'GTAG_IDENTIFICATION');
</script>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="configuration.description">
  <title>configuration.name - @configuration.username</title>
  <link rel="shortcut icon" href="configuration.favicon" type="image/x-icon">
  <link rel="stylesheet" href="/assets/css/style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
  <meta name="google-site-verification" content="gLWjWyzJC6D2D_6Pe9HWCRkaWL_rKtxRf05_Dhiu2is" />
</head>
<body>
  <main>
    <aside class="sidebar" data-sidebar>
      <div class="sidebar-info">
        put_back_to_home_link_here
        <figure class="avatar-box">
          <img src="configuration.sidebar.image" alt="configuration.name" width="80">
        </figure>
        <div class="info-content">
          <h1 class="name" title="configuration.name"><a class="colorlink" href="https://github.com/configuration.username"> configuration.name</a></h1>
          <p class="title">configuration.sidebar.title</p>
        </div>
        <button class="info_more-btn" data-sidebar-btn>
          <span>More Information</span>
          <ion-icon name="chevron-down"></ion-icon>
        </button>
      </div>
      <div class="sidebar-info_more">
        <div class="separator"></div>
        <ul class="contacts-list">
          generated_info_panel
        </ul>
        <div class="separator"></div>
        <ul class="social-list">
          generated_social_panel
        </ul>
      </div>
    </aside>
    <div class="main-content">
      <nav class="navbar">
        <ul class="navbar-list">
          generated_navbar
        </ul>
      </nav>
generated_articles
    </div>
  </main>
  <script defer src="/assets/js/script.js"></script>
  <script defer type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
  <script defer nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>
</body>
</html>"""

TEXT_TEMPLATE = """
<section class="about-text">
          <p>TEXT</p>
</section>
"""




FILTER_ITEM_TEMPLATE = """
            <li class="filter-item">
              <button data-filter-btn>CATEGORY</button>
            </li>
"""

SELECT_ITEM_TEMPLATE = """
<li class="select-item">
  <button data-filter-btn>CATEGORY</button>
</li>
"""

def markdown_text_parsing(txt):
    o = markdown.markdown(txt)[3:][:-4]
    return o.replace('href', "style=\"display: inline\" class=\"colorlink\" href")


def generate_timeline_item(variables):
    for item in variables:
        variables[item] = markdown_text_parsing(variables[item])
    return TIMELINE_ITEM_TEMPLATE.replace("NAME", variables['name']).replace("TIME_PERIOD",
                                                                             variables['time_period']).replace(
        "DESCRIPTION", variables['description'])


def generate_skills_item(variables):
    for item in variables:
        variables[item] = markdown_text_parsing(variables[item])
    return SKILLS_ITEM_TEMPLATE.replace("NAME", variables['name']).replace("AMOUNT", variables['level'])


def generate_text(variables):
    return TEXT_TEMPLATE.replace("TEXT", markdown_text_parsing(variables["text"]["text"]))


def generate_header(variables):
    return OPTIONAL_HEADER_TEMPLATE.replace("NAME", markdown_text_parsing(variables["name"])).replace("ICON",
                                                                                                      variables["icon"])


def generate_contact(variables):
    return CONTACT_FORM_TEMPLATE.replace("FORMSPREE_URL", markdown_text_parsing(variables["contact"]["formspree_url"]))


def generate_navbar_item(variables, is_first=True):
    if is_first:
        return PAGE_TEMPLATE_NAVBAR_HOMEPAGE.replace("NAME", variables["name"])
    return PAGE_TEMPLATE_NAVBAR.replace("NAME", variables['name'])


def generate_timeline(variables):
    variables = variables['timeline']
    timeline_internal = ''
    for timeline_item_raw in variables['timeline']:
        timeline_internal += generate_timeline_item(timeline_item_raw)

    return TIMELINE_TEMPLATE.replace("TIMELINE", timeline_internal)


def generate_skills(variables):
    variables = variables['skills']
    skills_internal = ''
    for skills_item_raw in variables['skills']:
        skills_internal += generate_skills_item(skills_item_raw)

    return SKILLS_TEMPLATE.replace("SKILLS", skills_internal)


def generate_project_item(variables):
    return (PROJECT_ITEM_TEMPLATE.replace("PROJECT_NAME", variables["name"])
            .replace("PROJECT_IMAGE", variables["image"])
            .replace("DESCRIPTION", variables["description"])
            .replace("LINK", variables["link"])
            .replace("CATEGORY", variables["tag"].lower()))



def generate_projects(variables):
    variables = variables['projects']
    projects_internal = ''
    for project_item_raw in variables['projects']:
        projects_internal += generate_project_item(project_item_raw)

    p = PROJECT_TEMPLATE.replace("PROJECT_ITEMS", projects_internal)

    select_items = ''
    filter_items = ''
    for tag in variables['tags']:
        select_items += SELECT_ITEM_TEMPLATE.replace("CATEGORY", tag)
        filter_items += FILTER_ITEM_TEMPLATE.replace("CATEGORY", tag)

    p = p.replace("FILTER_ITEMS", filter_items).replace("SELECT_ITEMS", select_items)

    return p


def generate_article(variables, is_first=True):
    generator_map = {"timeline": generate_timeline, "skills": generate_skills, "text": generate_text,
                     "projects": generate_projects, "contact": generate_contact}
    article = ARTICLE_TEMPLATE.replace("LOWER_NAME", variables['name'].lower()).replace("NAME", variables['name'])
    sections = ""

    for section in variables["elements"]:
        section_data = generator_map[list(section)[0]](section)
        section = section[list(section)[0]]
        header = ""
        if "header" in section.keys():
            header = generate_header(section['header'])
        section_data = section_data.replace("header_goes_here", header)
        sections += section_data
    if is_first:
        article = article.replace("\" data-page=", "  active\" data-page=")
    return article.replace("SECTIONS", sections)


def generate_html(variables):
    html = (HTML_TEMPLATE.replace("configuration.favicon", variables['favicon']).replace("configuration.name",
                                                                                        variables["name"]).replace(
        "configuration.username", variables["username"]).replace("configuration.sidebar.image",
                                                                 variables["sidebar"]["image"]).replace(
        "configuration.sidebar.title", variables["sidebar"]["title"])
            .replace("configuration.description", variables["meta_description"]))
    articles = ""
    navbar = ""
    for i, article in enumerate(variables["pages"]):
        articles += generate_article(variables["pages"][article], i == variables["starting_page_index"])
        navbar += generate_navbar_item(variables["pages"][article], i == variables["starting_page_index"])

    info_panels = ""
    for info in variables["sidebar"]["info_panels"]:
        info_panels += (INFO_TEMPLATE.replace("ICON", info["icon"])
                        .replace("NAME", info["title"])
                        .replace("VALUE", info["value"]))
    social_panels = ""
    for social in variables["sidebar"]["social_panels"]:
        social_panels += (SOCIAL_TEMPLATE.replace("ICON", social["icon"])
                          .replace("URL", social["url"]))

    back_to_home = ""
    if variables["sidebar"]["back_to_home"]:
        back_to_home = (f'<a class="colorlink" style="text-align: center"'
                        f' href="https://{variables["username"]}.github.io"><ion-icon name="home" size="large"></ion-icon></a>')

    html = (html.replace("generated_articles", articles).replace("generated_navbar", navbar)
            .replace("generated_info_panel", info_panels).replace("generated_social_panel", social_panels)
            .replace("put_back_to_home_link_here", back_to_home).replace("GTAG_IDENTIFICATION",
                                                                         variables["analytics"]["tag_manager_id"]))
    return html


import ruamel.yaml

y = ruamel.yaml.YAML()

jobs = y.load(open("generate_execute.yaml"))["jobs"]
for job_key in jobs.keys():
    job = jobs[job_key]
    data = y.load(open(job["in"]))
    f = open(job["out"], "w")
    f.truncate(0)
    f.write(generate_html(data))
    f.close()
print(f"Regenerated {len(jobs)} jobs.")
