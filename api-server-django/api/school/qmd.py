"""
Utilidades para el contenido Quarto (`.qmd`) de las presentaciones.

Convención Quarto: cada encabezado de nivel 2 (`## `) abre una diapositiva. El
frontend aplica exactamente la misma regla al construir el deck, así que
cualquier cambio aquí debe replicarse en `utils/qmd.js`.
"""

from __future__ import annotations

import re

FENCE_RE = re.compile(r'^\s*(```+|~~~+)')
# `##` abre una diapositiva normal; `#` abre una de sección. Ambas cuentan.
SLIDE_HEADING_RE = re.compile(r'^##(?!#)\s')
SECTION_HEADING_RE = re.compile(r'^#(?!#)\s')
ANY_SLIDE_RE = re.compile(r'^#{1,2}(?!#)\s')


def iter_content_lines(content: str | None) -> list[tuple[str, bool]]:
    """Devuelve `(línea, dentro_de_bloque_de_código)` para cada línea."""
    lines: list[tuple[str, bool]] = []
    fence: str | None = None
    for line in (content or '').splitlines():
        match = FENCE_RE.match(line)
        if fence is None:
            if match:
                fence = match.group(1)[0]
            lines.append((line, False))
        else:
            # Dentro del bloque: la línea de cierre también cuenta como código.
            lines.append((line, True))
            if match and match.group(1)[0] == fence:
                fence = None
    return lines


def count_qmd_slides(content: str | None) -> int:
    """Diapositivas que abre el contenido: encabezados `#` y `##` fuera de código."""
    return sum(
        1 for line, in_code in iter_content_lines(content)
        if not in_code and ANY_SLIDE_RE.match(line)
    )


def demote_legacy_subtitles(content: str | None) -> str:
    """
    Convierte el patrón heredado `# Título` + `## Subtítulo` en una diapositiva
    de sección Quarto.

    Antes las diapositivas se partían por `---`, así que ese par se veía como
    una sola. Bajo la regla Quarto cada `##` abre diapositiva, y el par se
    partiría en dos. Se degrada el `##` a un párrafo `[texto]{.subtitle}` para
    conservar el aspecto original.
    """
    if not content:
        return content or ''

    lines = iter_content_lines(content)
    out: list[str] = []
    for idx, (line, in_code) in enumerate(lines):
        previous = lines[idx - 1] if idx else None
        is_subtitle = (
            not in_code
            and SLIDE_HEADING_RE.match(line)
            and previous is not None
            and not previous[1]
            and SECTION_HEADING_RE.match(previous[0])
        )
        if is_subtitle:
            out.append(f'[{line[2:].strip()}]{{.subtitle}}')
        else:
            out.append(line)
    return '\n'.join(out)


def strip_legacy_separators(content: str | None) -> str:
    """
    Elimina los `---` que antes separaban diapositivas.

    Solo se tocan las líneas que consisten únicamente en guiones y que están
    fuera de bloques de código; un `---` dentro de un bloque es código, y uno
    con texto alrededor no es un separador.
    """
    if not content:
        return content or ''

    kept: list[str] = []
    for line, in_code in iter_content_lines(content):
        if not in_code and re.fullmatch(r'\s*-{3,}\s*', line):
            continue
        kept.append(line)

    # Colapsa los huecos que deja el separador al desaparecer.
    text = '\n'.join(kept)
    return re.sub(r'\n{3,}', '\n\n', text).strip() + '\n'
