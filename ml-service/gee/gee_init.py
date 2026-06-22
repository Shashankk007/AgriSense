import json
import os
import tempfile
from typing import Optional

import ee


def _create_temp_key_file(raw_json: str) -> str:
    key_data = json.loads(raw_json)
    temp_file = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False)
    json.dump(key_data, temp_file)
    temp_file.flush()
    temp_file.close()
    return temp_file.name


def _initialize_service_account() -> Optional[str]:
    service_account = os.getenv("GEE_SERVICE_ACCOUNT")
    private_key_file = os.getenv("GEE_PRIVATE_KEY_FILE")
    private_key_json = os.getenv("GEE_PRIVATE_KEY_JSON")

    if not service_account:
        return None

    if private_key_file and os.path.exists(private_key_file):
        credentials = ee.ServiceAccountCredentials(service_account, private_key_file)
        ee.Initialize(credentials)
        return "service_account:file"

    if private_key_json:
        key_file = _create_temp_key_file(private_key_json)
        credentials = ee.ServiceAccountCredentials(service_account, key_file)
        ee.Initialize(credentials)
        return "service_account:json"

    return None


def initialize_gee() -> str:
    mode = os.getenv("GEE_INIT_MODE", "local").lower()

    if mode == "service_account":
        initialized = _initialize_service_account()
        if not initialized:
            raise RuntimeError(
                "GEE service account mode selected but credentials are missing. "
                "Set GEE_SERVICE_ACCOUNT and GEE_PRIVATE_KEY_FILE or GEE_PRIVATE_KEY_JSON."
            )
        return initialized

    # Local mode: use cached credentials if available; otherwise prompt interactive auth once.
    try:
        ee.Initialize()
        return "local:cached"
    except Exception:
        raise RuntimeError(
            "Earth Engine local credentials not found. Run authentication once with: "
            "python -c \"import ee; ee.Authenticate(); ee.Initialize()\""
        )
