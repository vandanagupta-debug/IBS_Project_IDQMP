"""
Centralized logging configuration for the application.

Uses loguru (already a project dependency) to give consistent, structured
logs across the API layer, services, and background tasks. Import
`configure_logging()` once at startup (see app.main) rather than configuring
loggers ad-hoc in individual modules.
"""

from __future__ import annotations

import sys

from loguru import logger

from app.core.config import settings


def configure_logging() -> None:
    """Configure loguru sinks based on the current settings.

    Safe to call multiple times (e.g. in tests) - it simply resets and
    re-adds sinks each time.
    """
    logger.remove()

    level = "DEBUG" if settings.DEBUG else "INFO"

    logger.add(
        sys.stdout,
        level=level,
        colorize=True,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> "
            "- <level>{message}</level>"
        ),
    )


__all__ = ["configure_logging", "logger"]
