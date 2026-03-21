from __future__ import annotations

import logging
import subprocess
import tempfile
from pathlib import Path

from backend.models.errors import ServiceUnavailableError
from backend.services.generation.models import FinalExamAssembly

logger = logging.getLogger(__name__)


def export_exam_to_pdf(
    *,
    assembly: FinalExamAssembly,
    output_dir: str,
    filename: str = "exam.pdf",
) -> Path:
    """Convert a FinalExamAssembly to PDF via Pandoc. Returns the output path."""
    markdown = _render_markdown(assembly)
    output_path = Path(output_dir) / filename
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as tmp:
        tmp.write(markdown)
        tmp_path = tmp.name

    try:
        subprocess.run(
            ["pandoc", tmp_path, "-o", str(output_path)],
            check=True,
            capture_output=True,
            timeout=30,
        )
    except FileNotFoundError as exc:
        raise ServiceUnavailableError(
            "Pandoc is not installed. Install Pandoc to enable PDF export."
        ) from exc
    except subprocess.CalledProcessError as exc:
        logger.error("Pandoc failed: %s", exc.stderr.decode() if exc.stderr else "unknown error")
        raise ServiceUnavailableError("PDF export failed") from exc
    except subprocess.TimeoutExpired as exc:
        raise ServiceUnavailableError("PDF export timed out") from exc
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    return output_path


def _render_markdown(assembly: FinalExamAssembly) -> str:
    lines: list[str] = [f"# {assembly.title}", ""]

    for question in assembly.questions:
        lines.append(f"## Question {question.question_order}")
        lines.append("")
        lines.append(question.question_text)
        lines.append("")

        if question.options:
            for i, option in enumerate(question.options):
                letter = chr(65 + i)
                lines.append(f"- **{letter}.** {option}")
            lines.append("")

    return "\n".join(lines)
