from __future__ import annotations

import datetime
import json
import re
from pathlib import Path
from typing import Any

import tomllib

ROOT_DIR = Path(__file__).resolve().parent
CONFIG_PATH = ROOT_DIR / "site.toml"
TEMPLATES_DIR = ROOT_DIR / "templates"

PLACEHOLDER_PATTERN = re.compile(
    r"(?<!\$)\{([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+)\}"
)


def load_config(path: Path = CONFIG_PATH) -> dict[str, Any]:
    with path.open("rb") as file:
        return tomllib.load(file)


def resolve_placeholder(context: dict[str, Any], key_path: str) -> Any:
    value: Any = context
    for key in key_path.split("."):
        if not isinstance(value, dict) or key not in value:
            raise KeyError(key_path)
        value = value[key]
    return value


def render_placeholders(template_text: str, context: dict[str, Any]) -> str:
    def replace(match: re.Match[str]) -> str:
        raw_value = resolve_placeholder(context, match.group(1))
        if raw_value is None:
            return ""
        if isinstance(raw_value, (dict, list)):
            return json.dumps(raw_value)
        return str(raw_value)

    return PLACEHOLDER_PATTERN.sub(replace, template_text)


def render_template(template_name: str, context: dict[str, Any]) -> str:
    template_path = TEMPLATES_DIR / template_name
    template_text = template_path.read_text(encoding="utf-8")
    try:
        return render_placeholders(template_text, context)
    except KeyError as error:
        missing_key = error.args[0]
        raise KeyError(
            f"Missing value for placeholder {missing_key!r} in template {template_name!r}."
        ) from error


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "item"


def project_slug(project: dict[str, Any]) -> str:
    return slugify(project.get("title", "project"))


def project_has_page(project: dict[str, Any]) -> bool:
    return bool(project.get("page") or project.get("essay") or project.get("hero"))


def page_asset_root(depth: int) -> str:
    if depth <= 0:
        return ""
    return "../" * depth


def asset_url(src: str, root: str = "") -> str:
    if not src:
        return ""
    if src.startswith("http://") or src.startswith("https://") or src.startswith("/"):
        return src
    prefix = root if root.endswith("/") or root == "" else f"{root}/"
    if prefix == "./":
        prefix = ""
    return f"{prefix}{src}"


_FIGURE_SEQ = 0


def uniquify_svg_ids(svg: str, prefix: str) -> str:
    found = set(re.findall(r'\bid="([^"]+)"', svg))
    for raw in found:
        svg = svg.replace(f'id="{raw}"', f'id="{prefix}-{raw}"')
        svg = svg.replace(f"url(#{raw})", f"url(#{prefix}-{raw})")
    return svg


def prefix_svg_classes(svg: str, prefix: str) -> str:
    def repl_attr(match: re.Match[str]) -> str:
        names = " ".join(f"{prefix}-{name}" for name in match.group(1).split())
        return f'class="{names}"'

    svg = re.sub(r'class="([^"]+)"', repl_attr, svg)
    return re.sub(r"(?<![\w-])\.([A-Za-z][\w-]*)", rf".{prefix}-\1", svg)


def render_figure(src: str, caption: str = "", alt: str = "", root: str = "") -> str:
    if not src:
        return ""
    global _FIGURE_SEQ
    _FIGURE_SEQ += 1
    caption_html = f'<figcaption class="essay-caption">{caption}</figcaption>' if caption else ""
    local = ROOT_DIR / src
    if local.suffix.lower() == ".svg" and local.is_file():
        svg = local.read_text(encoding="utf-8", errors="replace")
        svg = re.sub(r"<\?xml[^>]*\?>", "", svg).strip()
        token = f"fig{_FIGURE_SEQ}"
        svg = uniquify_svg_ids(svg, token)
        svg = prefix_svg_classes(svg, token)
        svg = svg.replace("<svg ", f'<svg class="diagram" role="img" aria-label="{alt or caption or "Project figure"}" ', 1)
        return f'<figure class="essay-figure">{svg}{caption_html}</figure>'
    return (
        f'<figure class="essay-figure">'
        f'<img src="{asset_url(src, root)}" alt="{alt or caption or "Project figure"}" loading="lazy">'
        f"{caption_html}"
        f"</figure>"
    )


def default_project_filters(projects: list[dict[str, Any]]) -> list[dict[str, str]]:
    categories: list[str] = []
    for project in projects:
        category = project.get("category")
        if category and category not in categories:
            categories.append(category)

    filters = [{"key": "all", "label": "All"}]
    filters.extend({"key": category, "label": category.replace("-", " ").title()} for category in categories)
    return filters


def render_about(paragraphs: list[str]) -> str:
    body = "".join(f"<p>{paragraph}</p>" for paragraph in paragraphs)
    return f'<div class="fg-prose">{body}</div>'


def render_experience_item(item: dict[str, Any]) -> str:
    if item.get("link"):
        title_html = (
            f'<h3 class="look-name"><a href="{item["link"]}">{item["title"]}</a></h3>'
            f'<button class="experience-copy-link icon-btn" data-link="{item["link"]}" title="Copy link" type="button">'
            f'<i class="bi bi-link-45deg"></i></button>'
        )
    else:
        title_html = f'<h3 class="look-name">{item["title"]}</h3>'

    context_item = {**item, "title_html": title_html}
    return render_template("partials/experience_item.html", {"item": context_item})


def calculate_duration(start_val: Any) -> str:
    if not start_val or not isinstance(start_val, str):
        return ""
    
    today = datetime.date.today()
    try:
        parts = [int(p) for p in start_val.split("-") if p.isdigit()]
        if len(parts) == 3:
            start_year, start_month, start_day = parts
        else:
            return str(start_val)
            
        years = today.year - start_year - ((today.month, today.day) < (start_month, start_day))
        
        if years <= 0:
            months = (today.year - start_year) * 12 + today.month - start_month
            if months <= 1:
                return "1 month"
            return f"{months} months"
        elif years == 1:
            return "over 1 year"
        else:
            return f"over {years} years"
    except Exception:
        return str(start_val)


def render_skill_item(skill: dict[str, Any], project_ids: dict[str, str]) -> str:
    skill_id = slugify(skill["name"].replace("/", "-").replace("+", "plus"))

    projects_html = ""
    project_names = skill.get("projects", [])
    if project_names:
        project_pills = []
        for project_name in project_names:
            project_id = project_ids.get(project_name)
            if project_id:
                project_pills.append(
                    f'<a href="#{project_id}" class="project-jump chip-btn">{project_name}</a>'
                )
            else:
                project_pills.append(
                    f'<span class="chip-btn">{project_name}</span>'
                )
        projects_html = f'<div class="chips">{"".join(project_pills)}</div>'

    icon_html = ""
    if skill.get("icon"):
        icon_val = skill["icon"]
        if "devicon" in icon_val:
            icon_class = icon_val
        elif icon_val.startswith("bi bi-") or icon_val.startswith("bi-"):
            icon_class = icon_val if icon_val.startswith("bi bi-") else f"bi {icon_val}"
        else:
            icon_class = f"bi bi-{icon_val}"
        icon_html = f'<i class="{icon_class}"></i>'

    duration_html = ""
    duration = skill.get("duration")
    if skill.get("start_date"):
        duration = calculate_duration(skill["start_date"])

    if duration:
        duration_html = f'<span class="look-meta">{duration}</span>'

    details_html = ""
    if skill.get("details"):
        details_html = f'<p class="doc">{skill["details"]}</p>'

    context = {
        "item": {
            "skill_id": skill_id,
            "name": skill["name"],
            "level": skill.get("level", ""),
            "icon_html": icon_html,
            "duration_html": duration_html,
            "details_html": details_html,
            "projects_html": projects_html,
        }
    }
    return render_template("partials/skill_item.html", context)


def render_prose(text: Any, extra_class: str = "") -> str:
    if not text:
        return ""
    if isinstance(text, list):
        blocks = [render_prose(part) for part in text if part]
        if not blocks:
            return ""
        return f'<div class="space-y-0">{"".join(blocks)}</div>'
    classes = " ".join(part for part in ("fg-prose", extra_class) if part)
    text = str(text)
    if any(tag in text for tag in ("<p", "<ul", "<ol", "<div")):
        if not text.lstrip().startswith("<"):
            parts = re.split(r"(?=<p|<ul|<ol|<div)", text, maxsplit=1)
            if len(parts) == 2 and parts[0].strip():
                text = f"<p>{parts[0].strip()}</p>{parts[1]}"
        return f'<div class="{classes}">{text}</div>'
    return f'<p class="{classes}">{text}</p>'


def render_section_body(value: Any) -> str:
    if isinstance(value, list):
        return render_bullet_list(value)
    return render_prose(value)


def render_labeled_section(title: str, body_html: str, nested: bool = False) -> str:
    if not body_html:
        return ""
    if nested:
        return (
            f'<div class="subgroup">'
            f'<div class="subgroup-title">{title}</div>'
            f"{body_html}"
            f"</div>"
        )
    return (
        f'<section class="section">'
        f'<div class="section-head"><h3>{title}</h3></div>'
        f'<div class="section-body">{body_html}</div>'
        f"</section>"
    )


def render_skill_pills(project_skills: list[str], extra_class: str = "") -> str:
    if not project_skills:
        return ""
    pills_html = "".join(f'<span class="chip-btn">{skill}</span>' for skill in project_skills)
    classes = " ".join(part for part in ("chips", extra_class) if part)
    return f'<div class="{classes}">{pills_html}</div>'


def render_project_link(project: dict[str, Any], label: str = "View Project") -> str:
    if not project.get("link"):
        return ""
    return (
        f'<a href="{project["link"]}" target="_blank" rel="noopener noreferrer" class="btn small">'
        f"{label} ↗</a>"
    )


def render_project_date(project: dict[str, Any], category_map: dict[str, str] | None = None) -> str:
    if not project.get("date"):
        return ""
    category = project.get("category", "other")
    category_label = category_map.get(category) if category_map else None
    if not category_label:
        category_label = category.replace("-", " ").title()
    return f'<span class="look-meta">{project["date"]} · {category_label}</span>'


def render_bullet_list(items: list[str]) -> str:
    if not items:
        return ""
    features_list = "".join(
        f"<li>{feature}</li>"
        for feature in items
    )
    return f'<ul class="fg-list">{features_list}</ul>'


def render_project_gallery(project: dict[str, Any], carousel_id: str, root: str = "") -> str:
    project_gallery = project.get("gallery", [])
    if not project_gallery:
        return ""

    slides = []
    captions: list[str] = []
    for index, item in enumerate(project_gallery):
        media_type = "image"
        src = ""
        poster = ""
        alt = f"Gallery item {index + 1}"

        if isinstance(item, str):
            src = item
            ext = src.split("?")[0].split("#")[0].split(".")[-1].lower()
            if ext in ("mp4", "webm", "ogg", "mov", "m4v"):
                media_type = "video"
        elif isinstance(item, dict):
            media_type = item.get("type", "image")
            src = item.get("src") or item.get("url", "")
            poster = item.get("poster", "")
            alt = item.get("alt") or item.get("caption") or f"Gallery item {index + 1}"

        if not src:
            continue

        src = asset_url(src, root)
        poster = asset_url(poster, root) if poster else ""
        captions.append(alt)

        if media_type == "video":
            poster_attr = f' poster="{poster}"' if poster else ""
            media_element = (
                f'<video src="{src}"{poster_attr} controls playsinline '
                f'class="carousel-media" preload="metadata"></video>'
            )
        else:
            media_element = (
                f'<img src="{src}" alt="{alt}" loading="lazy" decoding="async" '
                f'class="carousel-media">'
            )

        slides.append(f'<div class="carousel-slide">{media_element}</div>')

    if not slides:
        return ""

    prev_btn = ""
    next_btn = ""
    indicators = ""
    if len(slides) > 1:
        prev_btn = (
            '<button class="carousel-prev icon-btn" type="button" aria-label="Previous slide">‹</button>'
        )
        next_btn = (
            '<button class="carousel-next icon-btn" type="button" aria-label="Next slide">›</button>'
        )
        dots = []
        for i in range(len(slides)):
            on_class = " on" if i == 0 else ""
            dots.append(
                f'<button class="carousel-dot{on_class}" type="button" data-slide-to="{i}" aria-label="Go to slide {i + 1}"></button>'
            )
        indicators = f'<div class="carousel-dots">{"".join(dots)}</div>'

    caption = captions[0] if len(captions) == 1 else ""
    caption_html = f'<p class="essay-caption">{caption}</p>' if caption else ""

    return (
        '<figure class="essay-figure media-figure">'
        f'<div class="media-carousel" data-carousel-id="{carousel_id}">'
        '<div class="carousel-slides" style="transform: translateX(0%);">'
        f'{"".join(slides)}'
        "</div>"
        f"{prev_btn}"
        f"{next_btn}"
        f"{indicators}"
        "</div>"
        f"{caption_html}"
        "</figure>"
    )


def render_project_writeup(project: dict[str, Any], category_map: dict[str, str] | None = None) -> str:
    project_title = project.get("title", "Project")
    project_id = f"project-{slugify(project_title)}"

    built = project.get("built") or project.get("details") or ""
    challenges = project.get("challenges") or ""
    learned = project.get("learned") or ""
    results = project.get("results") or project.get("features") or []

    demo_html = ""
    if project.get("demo") == "sim":
        demo_label = project.get("demo_label", "Open the simulations")
        demo_html = (
            f'<button type="button" data-open-sim class="btn small">{demo_label}</button>'
        )

    page_href = f"projects/{project_slug(project)}/" if project_has_page(project) else f"#{project_id}"
    page_link_html = ""
    if project_has_page(project):
        page_link_html = (
            f'<a href="{page_href}" class="btn small primary">Open writeup</a>'
        )
    hero_html = ""
    if project.get("hero"):
        hero_html = render_figure(
            project["hero"],
            caption=project.get("hero_caption", ""),
            alt=f"{project_title} schematic",
        )

    context = {
        "item": {
            "project_id": project_id,
            "category": project.get("category", "other"),
            "title": project_title,
            "description": project.get("description", ""),
            "date_html": render_project_date(project, category_map),
            "built_html": render_labeled_section("Built", render_section_body(built), nested=True),
            "challenges_html": render_labeled_section("Hard parts", render_section_body(challenges), nested=True),
            "learned_html": render_labeled_section("Learned", render_section_body(learned), nested=True),
            "results_html": render_labeled_section("Also", render_bullet_list(results), nested=True),
            "gallery_html": render_project_gallery(project, f"gallery-{project_id}"),
            "skills_html": render_skill_pills(project.get("skills", [])),
            "link_html": render_project_link(project),
            "demo_html": demo_html,
            "page_href": page_href,
            "page_link_html": page_link_html,
            "hero_html": hero_html,
        }
    }
    return render_template("partials/project_writeup.html", context)


def render_project_archive(project: dict[str, Any], category_map: dict[str, str] | None = None) -> str:
    project_title = project.get("title", "Project")
    project_id = f"project-{slugify(project_title)}"
    notes = project.get("built") or project.get("details") or ""
    notes_html = ""
    if notes:
        notes_html = (
            '<details class="notes">'
            "<summary>Notes</summary>"
            f'<div class="section-body">{render_prose(notes)}</div>'
            "</details>"
        )

    context = {
        "item": {
            "project_id": project_id,
            "category": project.get("category", "other"),
            "title": project_title,
            "description": project.get("description", ""),
            "date_html": render_project_date(project, category_map),
            "notes_html": notes_html,
            "gallery_html": render_project_gallery(project, f"gallery-{project_id}"),
            "link_html": (
                f'<a href="projects/{project_slug(project)}/" class="btn small">Writeup</a>'
                if project_has_page(project)
                else ""
            )
            + render_project_link(project),
        }
    }
    return render_template("partials/project_archive.html", context)


def render_elsewhere_link(item: dict[str, Any]) -> str:
    return render_template(
        "partials/elsewhere_link.html",
        {"item": {"label": item.get("label", item.get("url", "Link")), "url": item.get("url", "")}},
    )


def render_project_card(project: dict[str, Any], category_map: dict[str, str] | None = None) -> str:
    project_title = project.get("title", "Project")
    project_id = f"project-{slugify(project_title)}"
    modal_id = f"modal-{project_id}"

    skills_html = render_skill_pills(project.get("skills", []))
    link_html = render_project_link(project)
    image_html = ""
    if project.get("image"):
        image_html = (
            f'<img src="{project["image"]}" alt="{project_title}" loading="lazy" decoding="async" class="carousel-media">'
        )
    date_html = render_project_date(project, category_map)

    details_button_html = ""
    if project.get("details") or project.get("features"):
        details_button_html = (
            f'<button class="project-details-btn btn small ghost" type="button" data-modal-id="{modal_id}">'
            "More Info</button>"
        )

    context = {
        "item": {
            "project_id": project_id,
            "modal_id": modal_id,
            "category": project.get("category", "other"),
            "title": project_title,
            "description": project.get("description", ""),
            "image_html": image_html,
            "date_html": date_html,
            "skills_html": skills_html,
            "link_html": link_html,
            "details_button_html": details_button_html,
        }
    }
    return render_template("partials/project_card.html", context)


def render_project_modal(project: dict[str, Any]) -> str:
    project_title = project.get("title", "Project")
    project_id = f"project-{slugify(project_title)}"
    modal_id = f"modal-{project_id}"

    details_html = render_prose(project.get("details") or "")
    gallery_html = render_project_gallery(project, f"carousel-{modal_id}")
    features_html = render_labeled_section("Features", render_bullet_list(project.get("features") or []))
    link_button_html = render_project_link(project, "View on GitHub")

    context = {
        "item": {
            "modal_id": modal_id,
            "title": project_title,
            "details_html": details_html,
            "gallery_html": gallery_html,
            "features_html": features_html,
            "link_button_html": link_button_html,
        }
    }
    return render_template("partials/project_modal.html", context)


def render_filter_buttons(filters: list[dict[str, str]]) -> str:
    button_classes = "chip-btn filter-btn"

    buttons: list[str] = []
    for index, filter_item in enumerate(filters):
        context = {
            "item": {
                "key": filter_item["key"],
                "label": filter_item["label"],
                "aria_pressed": "true" if index == 0 else "false",
                "button_classes": button_classes + (" on" if index == 0 else ""),
            }
        }
        buttons.append(render_template("partials/project_filter_button.html", context))
    return "".join(buttons)


def build_index_context(config: dict[str, Any]) -> dict[str, Any]:
    site = {"lang": "en", **config.get("site", {})}

    user_config = config.get("user", {})
    user = {
        "name": "Your Name",
        "headline": "Your headline",
        "profile_image": "pfp.png",
        **user_config,
    }
    user["social"] = {
        "github": "",
        "linkedin": "",
        "discord": "",
        "resume": "",
        **user_config.get("social", {}),
    }

    meta = {
        "page_title": "",
        "description": "",
        "favicon": "",
        **config.get("meta", {}),
    }
    if not meta["page_title"]:
        meta["page_title"] = f'{user["name"]} - {user["headline"]}' if user["headline"] else user["name"]
    if not meta["description"]:
        meta["description"] = f'Portfolio of {user["name"]}, {user["headline"]}.'
    if not meta["favicon"]:
        meta["favicon"] = user["profile_image"]

    sections = {
        "about_title": "About",
        "experience_title": "Experience",
        "projects_title": "What I've built",
        "more_title": "More builds",
        "elsewhere_title": "Elsewhere",
        "skills_title": "Skills",
        "contact_title": "Contact",
        "no_projects": "No projects found matching your criteria.",
        **config.get("sections", {}),
    }

    contact = {
        "form_action": "",
        "submit_label": "Send Message",
        "intro": "",
        **config.get("contact", {}),
    }

    footer = {
        "text": "Made with <3",
        **config.get("footer", {}),
    }

    content_config = config.get("content", {})
    taglines = content_config.get("taglines", [])
    if not taglines:
        taglines = [user["headline"]] if user["headline"] else [user["name"]]

    experiences = config.get("experiences", [])
    skills = config.get("skills", {})
    projects = config.get("projects", [])
    about_paragraphs = content_config.get("about", [])

    project_ids = {
        project["title"]: f'project-{slugify(project["title"])}'
        for project in projects
        if project.get("title")
    }

    filters = config.get("project_filters") or default_project_filters(projects)
    category_map = {f["key"]: f["label"] for f in filters if "key" in f and "label" in f}
    featured_projects = [project for project in projects if project.get("featured")]
    archive_projects = [project for project in projects if not project.get("featured")]
    if not featured_projects:
        featured_projects = projects
        archive_projects = []
    elsewhere = [
        item
        for item in config.get("elsewhere", [])
        if isinstance(item, dict) and item.get("url") and item.get("label")
    ]

    skills_categories_config = config.get("skills_categories", {})
    skills_categories = []

    if isinstance(skills_categories_config, dict):
        for key, val in skills_categories_config.items():
            skills_categories.append({"key": key, "title": val})

    existing_keys = {cat["key"] for cat in skills_categories}
    if isinstance(skills, dict):
        for key in skills.keys():
            if key not in existing_keys:
                title = key.replace("_", " ").title()
                skills_categories.append({"key": key, "title": title})

    skills_columns = []
    for cat in skills_categories:
        cat_key = cat["key"]
        cat_title = cat["title"]
        items = skills.get(cat_key, []) if isinstance(skills, dict) else []
        if not items:
            continue

        items_html = "".join(render_skill_item(skill, project_ids) for skill in items)
        column_html = (
            f'<div>'
            f'<div class="subgroup-title">{cat_title}</div>'
            f'{items_html}'
            f'</div>'
        )
        skills_columns.append(column_html)

    num_columns = len(skills_columns)
    if num_columns <= 1:
        skills_grid_class = "skills-grid cols-1"
    elif num_columns == 2:
        skills_grid_class = "skills-grid cols-2"
    elif num_columns == 3:
        skills_grid_class = "skills-grid cols-3"
    else:
        skills_grid_class = "skills-grid cols-4"

    skills_html = "\n".join(skills_columns)

    content = {
        "first_tagline": taglines[0],
        "taglines_json": json.dumps(taglines),
        "about_html": render_about(about_paragraphs),
        "timeline_items_html": "".join(render_experience_item(item) for item in experiences),
        "skills_html": skills_html,
        "skills_grid_class": skills_grid_class,
        "project_filters_html": render_filter_buttons(filters),
        "project_cards_html": "".join(render_project_card(project, category_map) for project in projects),
        "project_modals_html": "".join(render_project_modal(project) for project in archive_projects if project.get("gallery")),
        "project_writeups_html": "".join(render_project_writeup(project, category_map) for project in featured_projects),
        "project_archive_html": "".join(render_project_archive(project, category_map) for project in archive_projects),
        "elsewhere_html": "".join(render_elsewhere_link(item) for item in elsewhere),
        "has_archive": "true" if archive_projects else "",
        "has_elsewhere": "true" if elsewhere else "",
    }

    return {
        "site": site,
        "meta": meta,
        "user": user,
        "sections": sections,
        "contact": contact,
        "footer": footer,
        "content": content,
    }


def minify_if_available(html_output: str) -> str:
    try:
        import htmlmin
    except ImportError:
        return html_output

    return htmlmin.minify(html_output, remove_empty_space=True)


def build_redirect_page(path_key: str, target_url: str, user_name: str) -> str:
    label = path_key.replace("-", " ").replace("/", " ").strip().title() or "Redirect"
    context = {
        "redirect": {
            "title": f"{user_name} - {label}",
            "description": f"Redirecting to {target_url}",
            "url": target_url,
        }
    }
    return render_template("redirect.html", context)


def render_essay_sections(project: dict[str, Any], root: str) -> str:
    sections = project.get("essay") or []
    if not isinstance(sections, list):
        return ""
    chunks = []
    for section in sections:
        if not isinstance(section, dict):
            continue
        heading = section.get("heading", "")
        body = render_prose(section.get("body", ""))
        figure = render_figure(
            section.get("figure", ""),
            caption=section.get("caption", ""),
            alt=section.get("alt") or heading,
            root=root,
        )
        heading_html = f'<div class="section-head"><h3>{heading}</h3></div>' if heading else ""
        chunks.append(f'<section class="section essay-section">{heading_html}<div class="section-body">{body}{figure}</div></section>')
    return "".join(chunks)


def render_project_page(project: dict[str, Any], context: dict[str, Any], category_map: dict[str, str]) -> str:
    root = page_asset_root(2)
    title = project.get("title", "Project")
    date = project.get("date", "")
    category = project.get("category", "")
    category_label = category_map.get(category, category.replace("-", " ").title())
    kicker = f"{category_label} · {date}" if date else category_label
    hero_html = render_figure(
        project.get("hero", ""),
        caption=project.get("hero_caption", ""),
        alt=f"{title} schematic",
        root=root,
    )
    demo_html = ""
    if project.get("demo") == "sim":
        demo_label = project.get("demo_label", "Open the simulations")
        demo_html = (
            f'<button type="button" data-open-sim class="btn small">{demo_label}</button>'
        )
    private_html = ""
    if not project.get("link"):
        private_html = '<span class="chip">Private — architecture only</span>'
    page_context = {
        **context,
        "paths": {"root": root},
        "item": {
            "title": title,
            "description": project.get("description", ""),
            "date": date,
            "kicker": kicker,
            "tone": str(project.get("tone", "199")),
            "hero_html": hero_html,
            "built_html": render_labeled_section("Built", render_section_body(project.get("built") or project.get("details") or "")),
            "challenges_html": render_labeled_section("Hard parts", render_section_body(project.get("challenges") or "")),
            "learned_html": render_labeled_section("Learned", render_section_body(project.get("learned") or "")),
            "features_html": render_labeled_section("Also", render_bullet_list(project.get("features") or [])),
            "skills_html": render_skill_pills(project.get("skills", [])),
            "essay_html": render_essay_sections(project, root),
            "gallery_html": render_project_gallery(project, f"gallery-{slugify(title)}", root),
            "link_html": render_project_link(project) or private_html,
            "demo_html": demo_html,
        },
    }
    return render_template("project.html", page_context)


def write_project_pages(config: dict[str, Any], context: dict[str, Any]) -> None:
    projects = config.get("projects", [])
    filters = config.get("project_filters") or default_project_filters(projects)
    category_map = {f["key"]: f["label"] for f in filters if "key" in f and "label" in f}
    for project in projects:
        if not project_has_page(project):
            continue
        slug = project_slug(project)
        output_dir = ROOT_DIR / "projects" / slug
        output_dir.mkdir(parents=True, exist_ok=True)
        html = minify_if_available(render_project_page(project, context, category_map))
        (output_dir / "index.html").write_text(html, encoding="utf-8")


def write_redirects(config: dict[str, Any], user_name: str) -> None:
    redirects = config.get("redirects", {})
    if not isinstance(redirects, dict):
        raise TypeError("The [redirects] section must be a TOML table.")

    for path_key, target_url in redirects.items():
        redirect_path = str(path_key).strip("/")
        if not redirect_path:
            raise ValueError("Redirect keys cannot be empty.")
        if not target_url:
            raise ValueError(f"Redirect URL for {path_key!r} cannot be empty.")

        redirect_html = build_redirect_page(redirect_path, str(target_url), user_name)
        output_path = ROOT_DIR / redirect_path / "index.html"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(redirect_html, encoding="utf-8")


def main() -> None:
    global _FIGURE_SEQ
    _FIGURE_SEQ = 0
    config = load_config()
    context = build_index_context(config)

    index_template = render_template("index.html", context)
    index_output = minify_if_available(index_template)
    (ROOT_DIR / "index.html").write_text(index_output, encoding="utf-8")

    write_redirects(config, context["user"]["name"])
    write_project_pages(config, context)
    print("Successfully generated clean portfolio website!")


if __name__ == "__main__":
    main()
