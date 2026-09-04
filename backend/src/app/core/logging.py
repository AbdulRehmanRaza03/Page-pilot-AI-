from __future__ import annotations

import logging
import uuid

logger = logging.getLogger("pagepilot")


def setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


def trace_id() -> str:
    return uuid.uuid4().hex
