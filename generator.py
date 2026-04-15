from __future__ import annotations

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
    return "".join(f"<p class='mb-4 last:mb-0'>{paragraph}</p>" for paragraph in paragraphs)


def render_experience_item(item: dict[str, Any]) -> str:
    return render_template("partials/experience_item.html", {"item": item})


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
                    f'<a href="#{project_id}" class="project-jump inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 mr-1.5 mb-1.5 transition-colors">{project_name}</a>'
                )
            else:
                project_pills.append(
                    f'<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 mr-1.5 mb-1.5">{project_name}</span>'
                )
        projects_html = f'<div class="mt-2 flex flex-wrap">{"".join(project_pills)}</div>'

    icon_html = ""
    if skill.get("icon"):
        icon_html = f'<ion-icon name="{skill["icon"]}" class="text-lg mr-2"></ion-icon>'

    duration_html = ""
    if skill.get("duration"):
        duration_html = f'<span class="text-xs text-zinc-500 dark:text-zinc-400">{skill["duration"]}</span>'

    details_html = ""
    if skill.get("details"):
        details_html = f'<p class="text-sm text-zinc-600 dark:text-zinc-400 mb-3 mt-2">{skill["details"]}</p>'

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


def render_project_card(project: dict[str, Any]) -> str:
    project_title = project.get("title", "Project")
    project_id = f"project-{slugify(project_title)}"
    modal_id = f"modal-{project_id}"

    skills_html = ""
    project_skills = project.get("skills", [])
    if project_skills:
        pills_html = "".join(
            f'<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 mr-1.5 mb-1.5">{skill}</span>'
            for skill in project_skills
        )
        skills_html = f'<div class="flex flex-wrap mt-3">{pills_html}</div>'

    link_html = ""
    if project.get("link"):
        link_html = (
            f'<a href="{project["link"]}" target="_blank" rel="noopener noreferrer" '
            'class="inline-flex items-center text-sm font-medium text-zinc-900 dark:text-zinc-100 '
            'hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-3">'
            'View Project <span class="ml-1 text-xs">↗</span></a>'
        )

    image_html = ""
    if project.get("image"):
        image_html = (
            f'<img src="{project["image"]}" alt="{project_title}" loading="lazy" decoding="async" '
            'class="w-full h-48 object-cover border-b border-zinc-200 dark:border-zinc-800">'
        )

    date_html = ""
    if project.get("date"):
        date_html = (
            '<span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 block flex items-center">'
            f'<ion-icon name="time-outline" class="mr-1"></ion-icon>{project["date"]}</span>'
        )

    details_button_html = ""
    if project.get("details") or project.get("features"):
        details_button_html = (
            f'<button class="project-details-btn text-sm text-zinc-500 hover:text-zinc-900 '
            f'dark:hover:text-zinc-100 transition-colors mt-3" data-modal-id="{modal_id}">'
            "More Info →</button>"
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

    details_html = ""
    if project.get("details"):
        details_html = (
            f'<p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">'
            f'{project["details"]}</p>'
        )

    features_html = ""
    project_features = project.get("features", [])
    if project_features:
        features_list = "".join(
            f'<li class="text-sm text-zinc-600 dark:text-zinc-400 flex items-start"><span class="mr-3">•</span><span>{feature}</span></li>'
            for feature in project_features
        )
        features_html = (
            '<div class="mt-4"><h4 class="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Features</h4>'
            f'<ul class="space-y-1">{features_list}</ul></div>'
        )

    link_button_html = ""
    if project.get("link"):
        link_button_html = (
            f'<a href="{project["link"]}" target="_blank" rel="noopener noreferrer" '
            'class="inline-flex items-center px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white '
            'dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 '
            'transition-colors">View on GitHub <span class="ml-2">↗</span></a>'
        )

    context = {
        "item": {
            "modal_id": modal_id,
            "title": project_title,
            "details_html": details_html,
            "features_html": features_html,
            "link_button_html": link_button_html,
        }
    }
    return render_template("partials/project_modal.html", context)


def render_filter_buttons(filters: list[dict[str, str]]) -> str:
    active_classes = (
        "px-3 py-1 text-sm rounded-full bg-zinc-900 text-white dark:bg-zinc-100 "
        "dark:text-zinc-900 filter-btn active hover:bg-zinc-800 dark:hover:bg-zinc-200"
    )
    inactive_classes = (
        "px-3 py-1 text-sm rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 "
        "dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 filter-btn transition-colors"
    )

    buttons: list[str] = []
    for index, filter_item in enumerate(filters):
        context = {
            "item": {
                "key": filter_item["key"],
                "label": filter_item["label"],
                "aria_pressed": "true" if index == 0 else "false",
                "button_classes": active_classes if index == 0 else inactive_classes,
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
        "profile_image": "pfp.webp",
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
        "projects_title": "Projects",
        "skills_title": "Skills",
        "languages_title": "Languages",
        "technologies_title": "Technologies",
        "contact_title": "Contact",
        **config.get("sections", {}),
    }

    contact = {
        "form_action": "",
        "submit_label": "Send Message",
        **config.get("contact", {}),
    }

    footer = {
        "text": "Made with <3",
        **config.get("footer", {}),
    }

    content_config = config.get("content", {})
    taglines = content_config.get("taglines", config.get("taglines", []))
    if not taglines:
        taglines = [user["headline"]] if user["headline"] else [user["name"]]

    experiences = config.get("experiences", [])
    skills = config.get("skills", {})
    projects = config.get("projects", [])
    about_paragraphs = content_config.get("about", config.get("about", []))

    project_ids = {
        project["title"]: f'project-{slugify(project["title"])}'
        for project in projects
        if project.get("title")
    }

    filters = config.get("project_filters") or default_project_filters(projects)

    content = {
        "first_tagline": taglines[0],
        "taglines_json": json.dumps(taglines),
        "about_html": render_about(about_paragraphs),
        "timeline_items_html": "".join(render_experience_item(item) for item in experiences),
        "programming_skills_html": "".join(
            render_skill_item(skill, project_ids) for skill in skills.get("languages", [])
        ),
        "tech_skills_html": "".join(
            render_skill_item(skill, project_ids) for skill in skills.get("technologies", [])
        ),
        "project_filters_html": render_filter_buttons(filters),
        "project_cards_html": "".join(render_project_card(project) for project in projects),
        "project_modals_html": "".join(render_project_modal(project) for project in projects),
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
    config = load_config()
    context = build_index_context(config)

    index_template = render_template("index.html", context)
    index_output = minify_if_available(index_template)
    (ROOT_DIR / "index.html").write_text(index_output, encoding="utf-8")

    write_redirects(config, context["user"]["name"])
    print("Successfully generated clean portfolio website!")


if __name__ == "__main__":
    main()
