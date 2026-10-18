from __future__ import annotations

import html
import re
import shutil
import xml.etree.ElementTree as etree
from pathlib import Path
from typing import Any, Callable

import markdown
import tomllib
from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape
from markdown.extensions import Extension
from markdown.treeprocessors import Treeprocessor
from markupsafe import Markup

ROOT_DIR = Path(__file__).resolve().parent
DIST_DIR = ROOT_DIR / "dist"
CONFIG_PATH = ROOT_DIR / "site.toml"
TEMPLATES_DIR = ROOT_DIR / "templates"
POSTS_DIR = ROOT_DIR / "posts"
STATIC_FILES = ("site.css", "pfp.webp")
STATIC_DIRS = ("media", ".well-known")
GENERATED_PREFIXES = ("blog", "projects", "resume")


class FrontmatterError(ValueError):
    """A post's frontmatter is missing, still YAML, or not valid TOML."""


def parse_frontmatter(content: str, path: Path) -> tuple[dict[str, Any], str]:
    """Parse TOML frontmatter delimited by lines that are exactly ``+++``."""
    lines = content.splitlines(keepends=True)
    if not lines:
        return {}, content

    first = lines[0].strip("\r\n")
    if first == "---":
        raise FrontmatterError(
            f"{path}: YAML frontmatter delimited by '---' is not supported; "
            "use TOML frontmatter delimited by '+++'"
        )
    if first != "+++":
        return {}, content

    close = next((index for index in range(1, len(lines)) if lines[index].strip("\r\n") == "+++"), None)
    if close is None:
        raise FrontmatterError(f"{path}: TOML frontmatter is missing a closing '+++' line")

    raw = "".join(lines[1:close])
    try:
        meta = tomllib.loads(raw)
    except tomllib.TOMLDecodeError as exc:
        raise FrontmatterError(f"{path}: failed to parse TOML frontmatter: {exc}") from exc
    if not isinstance(meta, dict):
        raise FrontmatterError(f"{path}: TOML frontmatter must be a table")
    return meta, "".join(lines[close + 1 :]).lstrip("\n")


class StandaloneFigureProcessor(Treeprocessor):
    """Turn a paragraph that is only an image into an essay figure."""

    def __init__(self, md: markdown.Markdown, asset_root: str) -> None:
        super().__init__(md)
        self.asset_root = asset_root

    def run(self, root: etree.Element) -> None:
        for parent in list(root.iter()):
            for index, child in enumerate(list(parent)):
                block = self._figure_html(child)
                if block is None:
                    continue
                holder = etree.Element("p")
                holder.text = self.md.htmlStash.store(block)
                parent[index] = holder

    def _figure_html(self, element: etree.Element) -> str | None:
        if element.tag != "p":
            return None
        children = list(element)
        if len(children) != 1 or children[0].tag != "img":
            return None
        if (element.text or "").strip():
            return None
        image = children[0]
        if (image.tail or "").strip():
            return None

        alt = image.get("alt") or ""
        src = asset_url(image.get("src") or "", self.asset_root)
        caption = image.get("title") if "title" in image.attrib else alt
        img_html = (
            f'<img src="{html.escape(src, quote=True)}" '
            f'alt="{html.escape(alt, quote=True)}" loading="lazy">'
        )
        caption_html = (
            f'<figcaption class="essay-caption">{html.escape(caption)}</figcaption>' if caption else ""
        )
        return f'<figure class="essay-figure">{img_html}{caption_html}</figure>'


class FigureExtension(Extension):
    """Resolve standalone Markdown images against the page root."""

    def __init__(self, **kwargs: Any) -> None:
        self.config = {"root": ["", "Relative prefix for local image sources."]}
        super().__init__(**kwargs)

    def extendMarkdown(self, md: markdown.Markdown) -> None:
        md.treeprocessors.register(
            StandaloneFigureProcessor(md, str(self.getConfig("root"))),
            "standalone_figure",
            -10,
        )


def render_markdown(text: str, root: str = "") -> str:
    if not text:
        return ""
    converter = markdown.Markdown(
        extensions=["fenced_code", "tables", "sane_lists", FigureExtension(root=root)],
        output_format="html",
    )
    return converter.convert(text)


def calculate_reading_time(text: str) -> str:
    cleaned = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    words = len(re.findall(r"\b\w+\b", cleaned))
    minutes = max(1, round(words / 200))
    return f"{minutes} min read"


def load_blog_posts(posts_dir: Path = POSTS_DIR) -> list[dict[str, Any]]:
    if not posts_dir.exists():
        return []

    posts: list[dict[str, Any]] = []
    for file in sorted(posts_dir.glob("*.md")):
        content = file.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(content, file)
        if meta.get("draft") is True:
            continue

        raw_title = str(meta.get("title") or file.stem.replace("-", " ").title())
        slug = slugify(str(meta.get("slug") or re.sub(r"^\d{4}-\d{2}(-\d{2})?-", "", file.stem) or raw_title))
        date_str = str(meta.get("date") or "")
        match_year = re.search(r"\b(20\d\d)\b", date_str)
        year = match_year.group(1) if match_year else "Recent"
        desc = str(meta.get("description") or "")
        tags = meta.get("tags") or []
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]

        reading_time = calculate_reading_time(body)

        posts.append({
            "title": raw_title,
            "slug": slug,
            "date": date_str,
            "year": year,
            "description": desc,
            "tags": tags,
            "body": body,
            "reading_time": reading_time,
            "file": file.name,
            "featured": bool(meta.get("featured", False)),
        })

    posts.sort(key=lambda p: (p["year"], p["date"], p["file"]), reverse=True)
    return posts



def load_config(path: Path = CONFIG_PATH) -> dict[str, Any]:
    with path.open("rb") as file:
        return tomllib.load(file)


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


def process_svg(svg: str, prefix: str, label: str) -> str:
    """Inline an SVG, giving its ids and classes a page-local prefix."""
    svg = re.sub(r"<\?xml[^>]*\?>", "", svg).strip()
    svg = uniquify_svg_ids(svg, prefix)
    svg = prefix_svg_classes(svg, prefix)
    safe_label = html.escape(label, quote=True)
    return svg.replace(
        "<svg ",
        f'<svg class="diagram" role="img" aria-label="{safe_label}" ',
        1,
    )


class FigureCounter:
    """Per-page figure prefix counter. Each page starts at fig1."""

    def __init__(self) -> None:
        self._used = 0

    def next_prefix(self) -> str:
        self._used += 1
        return f"fig{self._used}"


def prepare_figure(
    src: str,
    caption: str,
    alt: str,
    root: str,
    counter: FigureCounter,
) -> dict[str, Any] | None:
    if not src:
        return None
    prefix = counter.next_prefix()
    label = alt or caption or "Project figure"
    local = ROOT_DIR / src
    if local.suffix.lower() == ".svg" and local.is_file():
        raw = local.read_text(encoding="utf-8", errors="replace")
        return {
            "svg": Markup(process_svg(raw, prefix, label)),
            "src": "",
            "alt": label,
            "caption": caption,
        }
    return {
        "svg": "",
        "src": asset_url(src, root),
        "alt": label,
        "caption": caption,
    }


def prose_model(value: Any) -> dict[str, Any] | None:
    """Classify a config value so the prose macro can wrap it."""
    if not value:
        return None
    if isinstance(value, list):
        parts = [part for part in value if part]
        if not parts:
            return None
        return {"kind": "list", "parts": parts}
    text = str(value)
    if any(tag in text for tag in ("<p", "<ul", "<ol", "<div")):
        if not text.lstrip().startswith("<"):
            parts = re.split(r"(?=<p|<ul|<ol|<div)", text, maxsplit=1)
            if len(parts) == 2 and parts[0].strip():
                return {"kind": "mixed", "lead": parts[0].strip(), "html": parts[1]}
        return {"kind": "html", "html": text}
    return {"kind": "plain", "text": text}


def group_by_year(
    items: list[dict[str, Any]],
    key_fn: Callable[[dict[str, Any]], str],
) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for item in items:
        grouped.setdefault(key_fn(item), []).append(item)
    return grouped


def project_year(project: dict[str, Any]) -> str:
    match = re.search(r"\b(20\d\d)\b", str(project.get("date", "")))
    return match.group(1) if match else "Other"


def project_list_entry(project: dict[str, Any]) -> dict[str, Any]:
    title = str(project.get("title", ""))
    page = project_has_page(project)
    href = f"projects/{project_slug(project)}/" if page else (project.get("link") or "#")
    classes: list[str] = []
    if project.get("featured"):
        classes.append("good")
    if project.get("hero"):
        classes.append("has-preview")
    links: list[dict[str, str]] = []
    if project.get("link"):
        links.append({"href": str(project["link"]), "label": "code"})
    if page:
        links.append({"href": href, "label": "writeup"})
    for extra in project.get("links") or []:
        if isinstance(extra, dict) and extra.get("label") and extra.get("url"):
            links.append({"href": str(extra["url"]), "label": str(extra["label"])})
    preview = None
    if project.get("hero"):
        preview = {
            "src": str(project["hero"]),
            "title": title,
            "caption": str(project.get("hero_caption") or ""),
        }
    return {
        "title": title,
        "description": str(project.get("description") or ""),
        "href": href,
        "css_class": " ".join(classes),
        "preview": preview,
        "links": links,
    }


def select_group_projects(
    projects: list[dict[str, Any]],
    category: str,
    matched: set[int],
) -> list[dict[str, Any]]:
    selected: list[dict[str, Any]] = []
    for index, project in enumerate(projects):
        if index in matched:
            continue
        if category == "*" or project.get("category") == category:
            selected.append(project)
            matched.add(index)
    return selected


def year_buckets(
    items: list[dict[str, Any]],
    year_of: Callable[[dict[str, Any]], str],
) -> list[dict[str, Any]]:
    grouped = group_by_year(items, year_of)
    return [{"year": year, "items": grouped[year]} for year in sorted(grouped, reverse=True)]


def build_project_groups(
    projects: list[dict[str, Any]],
    groups: list[Any],
) -> list[dict[str, Any]]:
    matched: set[int] = set()
    rendered: list[dict[str, Any]] = []
    for group in groups:
        if not isinstance(group, dict):
            continue
        category = str(group.get("category") or "*")
        selected = select_group_projects(projects, category, matched)
        buckets = year_buckets(selected, project_year)
        rendered.append({
            "title": str(group.get("title", "")),
            "note": str(group.get("note") or ""),
            "years": [
                {
                    "year": bucket["year"],
                    "projects": [project_list_entry(project) for project in bucket["items"]],
                }
                for bucket in buckets
            ],
        })
    return rendered


def normalize_intro(paragraphs: list[Any]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for item in paragraphs:
        if isinstance(item, str):
            rows.append({"text": item, "class": ""})
        elif isinstance(item, dict):
            rows.append({
                "text": str(item.get("text", "")),
                "class": str(item.get("class") or ""),
            })
    return rows


def normalize_experiences(experiences: list[Any]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for exp in experiences:
        if not isinstance(exp, dict):
            continue
        rows.append({
            "title": str(exp.get("title", "")),
            "link": str(exp.get("link") or ""),
            "date": str(exp.get("date", "")),
        })
    return rows


def writing_years(posts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets = year_buckets(posts, lambda post: str(post["year"]))
    return [
        {
            "year": bucket["year"],
            "posts": [
                {
                    "href": f"/blog/{post['slug']}/",
                    "title": str(post.get("title", "")),
                    "description": str(post.get("description") or ""),
                }
                for post in bucket["items"]
            ],
        }
        for bucket in buckets
    ]


def blog_index_years(posts: list[dict[str, Any]], root: str) -> list[dict[str, Any]]:
    buckets = year_buckets(posts, lambda post: str(post["year"]))
    return [
        {
            "year": bucket["year"],
            "posts": [
                {
                    "href": f"{root}blog/{post['slug']}/",
                    "title": str(post.get("title", "")),
                    "description": str(post.get("description") or ""),
                    "date": str(post.get("date", "")),
                    "reading_time": str(post.get("reading_time", "")),
                    "tags": list(post.get("tags") or []),
                }
                for post in bucket["items"]
            ],
        }
        for bucket in buckets
    ]


def default_project_filters(projects: list[dict[str, Any]]) -> list[dict[str, str]]:
    categories: list[str] = []
    for project in projects:
        category = project.get("category")
        if category and category not in categories:
            categories.append(category)

    filters = [{"key": "all", "label": "All"}]
    filters.extend({"key": category, "label": category.replace("-", " ").title()} for category in categories)
    return filters


def build_category_map(config: dict[str, Any], projects: list[dict[str, Any]]) -> dict[str, str]:
    categories = config.get("categories")
    if isinstance(categories, dict) and categories:
        return {str(key): str(label) for key, label in categories.items()}
    filters = config.get("project_filters") or default_project_filters(projects)
    return {
        item["key"]: item["label"]
        for item in filters
        if isinstance(item, dict) and "key" in item and "label" in item
    }


def prepare_gallery(project: dict[str, Any], root: str) -> dict[str, Any] | None:
    slides: list[dict[str, str]] = []
    for index, item in enumerate(project.get("gallery") or []):
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
            media_type = str(item.get("type") or "image")
            src = str(item.get("src") or item.get("url") or "")
            poster = str(item.get("poster") or "")
            alt = str(item.get("alt") or item.get("caption") or alt)
        if not src:
            continue
        slides.append({
            "type": media_type,
            "src": asset_url(src, root),
            "poster": asset_url(poster, root) if poster else "",
            "alt": alt,
        })
    if not slides:
        return None
    return {
        "id": f"gallery-{project_slug(project)}",
        "slides": slides,
        "caption": slides[0]["alt"] if len(slides) == 1 else "",
    }


def prepare_project_item(
    project: dict[str, Any],
    category_map: dict[str, str],
    root: str,
    counter: FigureCounter,
) -> dict[str, Any]:
    title = str(project.get("title") or "Project")
    date = str(project.get("date") or "")
    category = str(project.get("category") or "")
    category_label = category_map.get(category, category.replace("-", " ").title())
    kicker = f"{category_label} · {date}" if date else category_label
    hero = prepare_figure(
        str(project.get("hero") or ""),
        caption=str(project.get("hero_caption") or ""),
        alt=f"{title} schematic",
        root=root,
        counter=counter,
    )
    essay: list[dict[str, Any]] = []
    for section in project.get("essay") or []:
        if not isinstance(section, dict):
            continue
        heading = str(section.get("heading") or "")
        essay.append({
            "heading": heading,
            "body": section.get("body") or "",
            "figure": prepare_figure(
                str(section.get("figure") or ""),
                caption=str(section.get("caption") or ""),
                alt=str(section.get("alt") or heading),
                root=root,
                counter=counter,
            ),
        })
    demo_label = ""
    if project.get("demo") == "sim":
        demo_label = str(project.get("demo_label") or "Open the simulations")
    return {
        "title": title,
        "description": str(project.get("description") or ""),
        "date": date,
        "kicker": kicker,
        "hero": hero,
        "built": project.get("built") or project.get("details") or "",
        "challenges": project.get("challenges") or "",
        "learned": project.get("learned") or "",
        "features": project.get("features") or [],
        "skills": list(project.get("skills") or []),
        "essay": essay,
        "gallery": prepare_gallery(project, root),
        "link": str(project.get("link") or ""),
        "demo_label": demo_label,
    }


def build_common_context(config: dict[str, Any]) -> dict[str, Any]:
    site = {"lang": "en", **config.get("site", {})}

    user_config = config.get("user", {})
    user = {
        "name": "Your Name",
        "headline": "Your headline",
        "profile_image": "pfp.png",
        "email": "",
        **user_config,
    }
    user["social"] = {
        "github": "",
        "linkedin": "",
        "discord": "",
        "discord_handle": "",
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

    contact = {
        "form_action": "",
        "submit_label": "Send Message",
        "intro": "",
        **config.get("contact", {}),
    }

    home_config = config.get("home", {})
    if not isinstance(home_config, dict):
        home_config = {}
    headings_raw = home_config.get("headings", {})
    if not isinstance(headings_raw, dict):
        headings_raw = {}
    home = {"headings": {str(key): str(value) for key, value in headings_raw.items()}}

    return {
        "site": site,
        "meta": meta,
        "user": user,
        "contact": contact,
        "home": home,
    }


def create_env() -> Environment:
    env = Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(["html"]),
        undefined=StrictUndefined,
        keep_trailing_newline=True,
    )
    env.globals["prose_model"] = prose_model
    return env


def render_template(env: Environment, template_name: str, context: dict[str, Any]) -> str:
    return env.get_template(template_name).render(**context)


def minify_if_available(html_output: str) -> str:
    try:
        import htmlmin
    except ImportError:
        return html_output

    return htmlmin.minify(html_output, remove_empty_space=True)


def write_html(path: Path, html_output: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(minify_if_available(html_output), encoding="utf-8")


def redirect_label(path_key: str) -> str:
    label = path_key.replace("-", " ").replace("/", " ").strip().title()
    return label or "Redirect"


def write_redirects(env: Environment, config: dict[str, Any], context: dict[str, Any]) -> None:
    redirects = config.get("redirects", {})
    if not isinstance(redirects, dict):
        raise TypeError("The [redirects] section must be a TOML table.")

    for path_key, target_url in redirects.items():
        redirect_path = str(path_key).strip("/")
        if not redirect_path:
            raise ValueError("Redirect keys cannot be empty.")
        if not target_url:
            raise ValueError(f"Redirect URL for {path_key!r} cannot be empty.")
        depth = redirect_path.count("/") + 1
        page_context = {
            **context,
            "root": page_asset_root(depth),
            "page_title": f"{context['user']['name']} - {redirect_label(redirect_path)}",
            "page_description": f"Redirecting to {target_url}",
            "redirect": {"url": str(target_url)},
        }
        html_output = render_template(env, "redirect.html", page_context)
        write_html(DIST_DIR / redirect_path / "index.html", html_output)


def write_project_pages(env: Environment, config: dict[str, Any], context: dict[str, Any]) -> None:
    projects = config.get("projects", [])
    category_map = build_category_map(config, projects)
    root = page_asset_root(2)
    for project in projects:
        if not project_has_page(project):
            continue
        counter = FigureCounter()
        page_context = {
            **context,
            "root": root,
            "page_title": f"{project.get('title', 'Project')} | {context['user']['name']}",
            "page_description": str(project.get("description") or ""),
            "item": prepare_project_item(project, category_map, root, counter),
        }
        html_output = render_template(env, "project.html", page_context)
        slug = project_slug(project)
        write_html(DIST_DIR / "projects" / slug / "index.html", html_output)


def write_blog_pages(env: Environment, posts: list[dict[str, Any]], context: dict[str, Any]) -> None:
    root = page_asset_root(1)
    index_context = {
        **context,
        "root": root,
        "page_title": f"Writing | {context['user']['name']}",
        "page_description": f"Essays, notes, and technical articles by {context['user']['name']}",
        "blog_years": blog_index_years(posts, root),
    }
    write_html(DIST_DIR / "blog" / "index.html", render_template(env, "blog_index.html", index_context))

    post_root = page_asset_root(2)
    for post in posts:
        tags = list(post.get("tags") or [])
        page_context = {
            **context,
            "root": post_root,
            "page_title": f"{post['title']} | {context['user']['name']}",
            "page_description": str(post.get("description") or ""),
            "post": {
                "title": str(post.get("title", "")),
                "date": str(post.get("date", "")),
                "reading_time": str(post.get("reading_time", "")),
                "description": str(post.get("description") or ""),
                "tags": tags,
                "content_html": Markup(render_markdown(post["body"], post_root)),
            },
        }
        write_html(
            DIST_DIR / "blog" / post["slug"] / "index.html",
            render_template(env, "blog_post.html", page_context),
        )


LOCAL_REF_RE = re.compile(r"""(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')""", re.IGNORECASE)


def reset_dist() -> None:
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir()


def copy_path(src: Path, dest: Path) -> None:
    if src.is_dir():
        shutil.copytree(src, dest, dirs_exist_ok=True)
    elif src.is_file():
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
    else:
        raise FileNotFoundError(f"Required static path is missing: {src}")


def copy_static_assets() -> None:
    for name in STATIC_FILES:
        copy_path(ROOT_DIR / name, DIST_DIR / name)
    for name in STATIC_DIRS:
        copy_path(ROOT_DIR / name, DIST_DIR / name)


def local_references(html_text: str) -> list[str]:
    refs: list[str] = []
    for match in LOCAL_REF_RE.finditer(html_text):
        raw = match.group(1) if match.group(1) is not None else match.group(2)
        if not raw:
            continue
        lowered = raw.lower()
        if lowered.startswith(("http://", "https://", "mailto:", "data:", "javascript:", "//", "#")):
            continue
        path = raw.split("#", 1)[0].split("?", 1)[0]
        if path:
            refs.append(path)
    return refs


def resolve_dist_ref(html_path: Path, ref: str) -> Path:
    if ref.startswith("/"):
        target = (DIST_DIR / ref.lstrip("/")).resolve()
    else:
        target = (html_path.parent / ref).resolve()
    target.relative_to(DIST_DIR.resolve())
    return target


def is_generated_output(relative: Path) -> bool:
    if relative.suffix.lower() == ".html":
        return True
    return bool(relative.parts) and relative.parts[0] in GENERATED_PREFIXES


def verify_local_assets() -> None:
    """Copy any other referenced static files, then fail if one is still missing."""
    missing: list[str] = []
    for html_path in sorted(DIST_DIR.rglob("*.html")):
        for ref in local_references(html_path.read_text(encoding="utf-8")):
            try:
                target = resolve_dist_ref(html_path, ref)
            except ValueError:
                missing.append(f"{html_path}: reference {ref!r} points outside dist/")
                continue
            if target.exists():
                continue
            relative = target.relative_to(DIST_DIR.resolve())
            source = ROOT_DIR / relative
            if source.exists() and not is_generated_output(relative):
                copy_path(source, target)
                continue
            page = html_path.relative_to(DIST_DIR)
            missing.append(f"{page} references missing local file {relative}")
    if missing:
        joined = "\n".join(missing)
        raise FileNotFoundError(f"Generated pages reference local files that are not in dist/:\n{joined}")


def main() -> None:
    reset_dist()
    config = load_config()
    env = create_env()
    context = build_common_context(config)
    posts = load_blog_posts()

    home_config = config.get("home", {})
    if not isinstance(home_config, dict):
        home_config = {}
    groups = home_config.get("groups", [])
    if not isinstance(groups, list):
        groups = []
    intro = home_config.get("intro", [])
    if not isinstance(intro, list):
        intro = []
    projects = config.get("projects", [])

    index_context = {
        **context,
        "root": page_asset_root(0),
        "page_title": context["meta"]["page_title"],
        "page_description": context["meta"]["description"],
        "intro": normalize_intro(intro),
        "project_groups": build_project_groups(projects, groups),
        "writing_years": writing_years(posts),
        "experiences": normalize_experiences(config.get("experiences", [])),
    }
    write_html(DIST_DIR / "index.html", render_template(env, "index.html", index_context))
    write_redirects(env, config, context)
    write_project_pages(env, config, context)
    write_blog_pages(env, posts, context)
    copy_static_assets()
    verify_local_assets()
    print("Successfully generated clean portfolio website!")


if __name__ == "__main__":
    main()
