from __future__ import annotations

import logging


LOGGER_NAME = "nexo-ai-python"


def configure_logging() -> logging.Logger:
    logger = logging.getLogger(LOGGER_NAME)

    if logger.handlers:
        return logger

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    logger.setLevel(logging.INFO)
    return logger


def get_logger() -> logging.Logger:
    return logging.getLogger(LOGGER_NAME)
