"""
AgriSense ML Service — Centralized Logging
============================================

Purpose:
    Provides a consistent, structured logger for every module in the service.
    All logs include timestamp, level, module name, and message so that
    every request is traceable in production.

Why it exists:
    Avoids ad-hoc print() statements. A single logging configuration ensures
    consistent formatting and level control across the entire service.

Interactions:
    - Every module calls `get_logger(__name__)` to obtain its own named logger.
    - Log level can be adjusted globally without touching individual files.
"""

import io
import logging
import sys

_stream = None


def _get_stream():
    global _stream
    if _stream is None:
        _stream = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True)
    return _stream


def get_logger(name: str) -> logging.Logger:
    """
    Creates and returns a named logger with a standard format.

    Args:
        name: Usually `__name__` from the calling module.

    Returns:
        A configured logging.Logger instance.
    """
    logger = logging.getLogger(name)

    # Prevent adding duplicate handlers if called multiple times
    if not logger.handlers:
        logger.setLevel(logging.DEBUG)

        # Console handler — outputs to stdout with UTF-8 encoding (Windows fix)
        handler = logging.StreamHandler(_get_stream())
        handler.setLevel(logging.DEBUG)

        # Format: timestamp | level | module | message
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

        # Prevent log propagation to root logger (avoids duplicate logs)
        logger.propagate = False

    return logger
