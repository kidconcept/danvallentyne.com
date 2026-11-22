from pathlib import Path
import re


root = Path(__file__).resolve().parent
dist = root / "dist"
feature = (root / "components/footer-feature.html").read_text().strip()
links = (root / "components/footer-links.html").read_text().strip()


def render_footer(compact: bool) -> str:
    modifier = " footer-compact" if compact else ""
    content = links if compact else f"{feature}\n{links}"
    return f'<footer class="contact-footer{modifier}" id="footer"><div class="wrap">\n{content}\n</div></footer>'


for page in dist.rglob("*.html"):
    source = page.read_text()
    if '<footer class="contact-footer' not in source:
        continue
    compact = page.relative_to(dist).as_posix() in ("about.html", "contact.html")
    rendered, count = re.subn(
        r'<footer class="contact-footer(?: footer-compact)?" id="footer">.*?</footer>',
        render_footer(compact),
        source,
        count=1,
        flags=re.DOTALL,
    )
    if count != 1:
        raise ValueError(f"Could not replace footer in {page}")
    if rendered != source:
        page.write_text(rendered)
